# Atlas Events — Production Deployment Guide

## Prerequisites

### Infrastructure
- Kubernetes cluster (1.28+) with NGINX Ingress Controller installed
- `cert-manager` installed for TLS (Let's Encrypt or custom CA)
- PostgreSQL 16 database accessible from the cluster (external or in-cluster)
- RabbitMQ 3.x accessible from the cluster (external or in-cluster)
- DNS records pointing `atlas-events.ma` and `staging.atlas-events.ma` to your ingress IP

### Tools
- `kubectl` 1.28+ configured to reach each cluster
- `kustomize` 5.x (`kubectl kustomize` built-in works too)
- `docker` with Buildx (for local image builds)
- GitHub repository with Actions enabled

### GitHub Secrets (Settings → Secrets → Actions)

| Secret name         | Value                                                      |
|---------------------|------------------------------------------------------------|
| `KUBECONFIG_STAGING`| `base64 -w0 ~/.kube/staging.yaml`                         |
| `KUBECONFIG_PROD`   | `base64 -w0 ~/.kube/prod.yaml`                            |

`GITHUB_TOKEN` is auto-provided by Actions — no manual secret needed for GHCR push.

### GitHub Environments (Settings → Environments)

Create two environments:
- `staging` — no approval gate, auto-deploys on push to main/master
- `production` — add **Required reviewers** (at least 1) for manual approval gate

---

## First-time cluster setup

### 1. Create the namespace and secrets

```bash
kubectl create namespace atlas-events

kubectl create secret generic atlas-secrets \
  --namespace atlas-events \
  --from-literal=DATABASE_URL='jdbc:postgresql://<HOST>:5432/atlasevents' \
  --from-literal=DATABASE_USERNAME='atlas' \
  --from-literal=DATABASE_PASSWORD='<STRONG_PASSWORD>' \
  --from-literal=RABBITMQ_USERNAME='atlas' \
  --from-literal=RABBITMQ_PASSWORD='<STRONG_PASSWORD>' \
  --from-literal=JWT_SECRET='<MIN_32_CHAR_RANDOM_BASE64>' \
  --from-literal=ADMIN_USERNAME='admin' \
  --from-literal=ADMIN_PASSWORD='<BCRYPT_HASH_OR_PLAIN_CHANGE_ME>'
```

> For production, `ADMIN_PASSWORD` should be a bcrypt hash. Generate one:
> ```bash
> htpasswd -bnBC 12 "" 'your-password' | tr -d ':\n'
> ```

### 2. Create TLS secrets (if not using cert-manager auto-issue)

```bash
kubectl create secret tls atlas-staging-tls \
  --namespace atlas-events \
  --cert=path/to/staging.crt \
  --key=path/to/staging.key

kubectl create secret tls atlas-prod-tls \
  --namespace atlas-events \
  --cert=path/to/prod.crt \
  --key=path/to/prod.key
```

### 3. Label the ingress-nginx namespace (required for NetworkPolicy)

```bash
kubectl label namespace ingress-nginx kubernetes.io/metadata.name=ingress-nginx --overwrite
```

### 4. Apply base manifests

```bash
# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/prod
```

---

## CI/CD Pipeline

The pipeline in `.github/workflows/ci.yml` runs automatically:

```
push to main/master
  └─ secrets-scan        (Gitleaks)
  ├─ test-api            (JUnit + JaCoCo ≥80%)
  ├─ test-scraper        (JUnit + JaCoCo ≥80%)
  ├─ test-web            (Jest ≥80%)
  └─ test-e2e            (Playwright — non-blocking)
        └─ security-scan (Trivy SCA)
              └─ build-images   (docker buildx → GHCR, tagged with SHA + "latest")
                    └─ deploy-staging  (kubectl apply + smoke test)
                          └─ deploy-prod  (manual approval → kubectl apply + smoke test)
```

### Manual deploy (without CI)

```bash
SHORT_SHA=$(git rev-parse --short HEAD)
OWNER=your-github-org   # or your username

# Build and push images
docker buildx build --push \
  -t ghcr.io/${OWNER}/atlas-api:${SHORT_SHA} \
  -t ghcr.io/${OWNER}/atlas-api:prod \
  -f atlas-api/Dockerfile .

docker buildx build --push \
  -t ghcr.io/${OWNER}/atlas-scraper:${SHORT_SHA} \
  -t ghcr.io/${OWNER}/atlas-scraper:prod \
  -f atlas-scraper/Dockerfile .

docker buildx build --push \
  -t ghcr.io/${OWNER}/atlas-web:${SHORT_SHA} \
  -t ghcr.io/${OWNER}/atlas-web:prod \
  -f atlas-web/Dockerfile atlas-web/

# Update kustomize image tags
cd k8s/overlays/prod
kustomize edit set image \
  ghcr.io/atlas-events/atlas-api=ghcr.io/${OWNER}/atlas-api:${SHORT_SHA} \
  ghcr.io/atlas-events/atlas-scraper=ghcr.io/${OWNER}/atlas-scraper:${SHORT_SHA} \
  ghcr.io/atlas-events/atlas-web=ghcr.io/${OWNER}/atlas-web:${SHORT_SHA}
cd ../../..

# Apply
kubectl apply -k k8s/overlays/prod

# Watch rollout
kubectl rollout status deployment/atlas-api -n atlas-events --timeout=300s
kubectl rollout status deployment/atlas-web -n atlas-events --timeout=300s
```

---

## Smoke tests

After any deployment, verify the stack is healthy:

```bash
# Health endpoints
curl -sf https://atlas-events.ma/api/v1/events | head -c 200
curl -sf https://atlas-events.ma/actuator/health

# Kubernetes pod status
kubectl get pods -n atlas-events

# Check logs if a pod is not Running
kubectl logs -n atlas-events deployment/atlas-api --tail=50
kubectl logs -n atlas-events deployment/atlas-web --tail=20
```

Expected: all pods in `Running` state, `/api/v1/events` returns HTTP 200 with JSON.

---

## Rollback procedure

### Option A — Rollback to previous Kubernetes revision (fast, no image rebuild)

```bash
kubectl rollout undo deployment/atlas-api -n atlas-events
kubectl rollout undo deployment/atlas-web -n atlas-events

# Verify
kubectl rollout status deployment/atlas-api -n atlas-events
```

### Option B — Redeploy a specific image SHA

```bash
SHORT_SHA=abc1234   # the SHA you want to roll back to

cd k8s/overlays/prod
kustomize edit set image \
  ghcr.io/atlas-events/atlas-api=ghcr.io/${OWNER}/atlas-api:${SHORT_SHA} \
  ghcr.io/atlas-events/atlas-web=ghcr.io/${OWNER}/atlas-web:${SHORT_SHA}
cd ../../..

kubectl apply -k k8s/overlays/prod
kubectl rollout status deployment/atlas-api -n atlas-events --timeout=120s
```

---

## Updating secrets

```bash
kubectl delete secret atlas-secrets -n atlas-events

kubectl create secret generic atlas-secrets \
  --namespace atlas-events \
  --from-literal=DATABASE_URL='...' \
  # ... all keys as in the initial setup above

# Restart deployments to pick up new secret values
kubectl rollout restart deployment/atlas-api -n atlas-events
kubectl rollout restart deployment/atlas-scraper -n atlas-events
```

---

## Triggering a manual scrape

The scraper runs on a 6-hour CronJob. To trigger immediately:

```bash
kubectl create job --from=cronjob/atlas-scraper-cron manual-scrape-$(date +%s) -n atlas-events
kubectl logs -n atlas-events job/manual-scrape-... --follow
```

---

## Local Docker Compose (development)

```bash
cp .env.example .env
# Edit .env with your local values

docker compose up --build

# App: http://localhost:4200
# API: http://localhost:8080
# RabbitMQ UI: http://localhost:15672
```
