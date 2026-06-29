# DevOps Foundation: Atlas Events
**Architecture**: docs/architecture-atlas-events.md
**Security**: docs/security-atlas-events.md
**Test Strategy**: docs/test-strategy-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: DevOps/DevSecOps

---

## 1. Environment Strategy

| Environment | Purpose | Infrastructure | Deploy Trigger |
|---|---|---|---|
| **local** | Developer workstation | Docker Compose (all services) | `docker compose up` |
| **staging** | QA + integration testing | Kubernetes (same cluster, `atlas-staging` namespace) | Auto on merge to `main` |
| **production** | Live users | Kubernetes (`atlas-prod` namespace) | Manual approval gate (GitHub Environment) |

**Namespace convention:**
```
atlas-staging  — staging workloads
atlas-prod     — production workloads
```

Both namespaces share one K8s cluster for MVP. Separate clusters when budget allows.

---

## 2. CI Pipeline — GitHub Actions

Full pipeline: `secrets-scan` → `[test-api ‖ test-scraper ‖ test-web]` → `security-scan` → `build-images` → `deploy-staging` → `deploy-prod` (manual gate).

### File: `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches: [main, "feature/**", "fix/**"]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write   # for SARIF uploads

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}/atlas-events

jobs:

  # ── Stage 0: Secrets scan (fast, blocks everything else) ──────────────────
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ── Stage 1: Test (parallel across modules) ───────────────────────────────
  test-api:
    needs: secrets-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      - name: Run tests + coverage (atlas-api)
        run: mvn -pl atlas-api verify -Pcoverage
        # JaCoCo configured to fail if combined coverage < 80%
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: api-coverage
          path: atlas-api/target/site/jacoco/

  test-scraper:
    needs: secrets-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      - name: Run tests + coverage (atlas-scraper)
        run: mvn -pl atlas-scraper verify -Pcoverage
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: scraper-coverage
          path: atlas-scraper/target/site/jacoco/

  test-web:
    needs: secrets-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: atlas-web/package-lock.json
      - name: Install dependencies
        working-directory: atlas-web
        run: npm ci
      - name: Lint
        working-directory: atlas-web
        run: npm run lint
      - name: Unit tests + coverage
        working-directory: atlas-web
        run: npm run test:ci
        # jest configured: coverageThreshold.global.lines = 80
      - name: Install Playwright browsers
        working-directory: atlas-web
        run: npx playwright install --with-deps chromium
      - name: E2E tests (against mock API)
        working-directory: atlas-web
        run: npm run e2e:ci
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: atlas-web/playwright-report/

  # ── Stage 2: Security scanning ────────────────────────────────────────────
  security-scan:
    needs: [test-api, test-scraper, test-web]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Semgrep SAST (Java + Angular)
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/security-audit
            p/java
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: Trivy SCA — atlas-api
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: atlas-api
          severity: CRITICAL,HIGH
          exit-code: 1

      - name: Trivy SCA — atlas-scraper
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: atlas-scraper
          severity: CRITICAL,HIGH
          exit-code: 1

      - name: Trivy SCA — atlas-web
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: atlas-web
          severity: CRITICAL,HIGH
          exit-code: 1

      - name: Checkov — K8s manifests
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: k8s/
          framework: kubernetes
          soft_fail: false

  # ── Stage 3: Build Docker images ──────────────────────────────────────────
  build-images:
    needs: security-scan
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    outputs:
      image-tag: ${{ github.sha }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push atlas-api
        uses: docker/build-push-action@v5
        with:
          context: atlas-api
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api:${{ github.sha }}

      - name: Build and push atlas-scraper
        uses: docker/build-push-action@v5
        with:
          context: atlas-scraper
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-scraper:${{ github.sha }}

      - name: Build and push atlas-web
        uses: docker/build-push-action@v5
        with:
          context: atlas-web
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-web:${{ github.sha }}

      - name: Trivy image scan — atlas-api
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1

  # ── Stage 4: Deploy to staging (auto) ─────────────────────────────────────
  deploy-staging:
    needs: build-images
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging namespace
        env:
          KUBECONFIG_DATA: ${{ secrets.KUBECONFIG_STAGING }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          echo "$KUBECONFIG_DATA" | base64 -d > /tmp/kubeconfig
          export KUBECONFIG=/tmp/kubeconfig
          kubectl set image deployment/atlas-api atlas-api=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api:$IMAGE_TAG -n atlas-staging
          kubectl set image deployment/atlas-web atlas-web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-web:$IMAGE_TAG -n atlas-staging
          kubectl set image cronjob/atlas-scraper atlas-scraper=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-scraper:$IMAGE_TAG -n atlas-staging
          kubectl rollout status deployment/atlas-api -n atlas-staging --timeout=120s
      - name: Log CI status
        run: echo "$(date -u) DEPLOY: staging green — ${{ github.sha }}" >> .ci-log.txt

  # ── Stage 5: Deploy to production (manual approval) ───────────────────────
  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production   # requires reviewer approval in GitHub Environments
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production namespace
        env:
          KUBECONFIG_DATA: ${{ secrets.KUBECONFIG_PROD }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          echo "$KUBECONFIG_DATA" | base64 -d > /tmp/kubeconfig
          export KUBECONFIG=/tmp/kubeconfig
          kubectl set image deployment/atlas-api atlas-api=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api:$IMAGE_TAG -n atlas-prod
          kubectl set image deployment/atlas-web atlas-web=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-web:$IMAGE_TAG -n atlas-prod
          kubectl set image cronjob/atlas-scraper atlas-scraper=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-scraper:$IMAGE_TAG -n atlas-prod
          kubectl rollout status deployment/atlas-api -n atlas-prod --timeout=120s
```

---

## 3. Dockerfiles

### `atlas-api/Dockerfile`
```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S atlas && adduser -S atlas -G atlas
WORKDIR /app
COPY --from=builder --chown=atlas:atlas /build/target/*.jar app.jar
USER atlas
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
```

### `atlas-scraper/Dockerfile`
```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S atlas && adduser -S atlas -G atlas
WORKDIR /app
COPY --from=builder --chown=atlas:atlas /build/target/*.jar app.jar
USER atlas
# No EXPOSE — scraper has no inbound HTTP; only RabbitMQ outbound
HEALTHCHECK --interval=60s --timeout=5s --retries=2 \
  CMD wget -qO- http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
```

### `atlas-web/Dockerfile`
```dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
RUN addgroup -S atlas && adduser -S atlas -G atlas
COPY --from=builder /build/dist/atlas-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Run nginx as non-root (port 8080)
RUN chown -R atlas:atlas /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown atlas:atlas /var/run/nginx.pid
USER atlas
EXPOSE 8080
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:8080/ || exit 1
```

### `atlas-web/nginx.conf`
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    # Angular routing — all paths serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers (supplement Ingress headers)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. Docker Compose (Local Development)

### `docker-compose.yml`
```yaml
services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: atlasevents
      POSTGRES_USER: atlas
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-atlas_local_password}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U atlas -d atlasevents"]
      interval: 5s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: atlas
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-atlas_local_rabbit}
    ports:
      - "5672:5672"
      - "15672:15672"   # management UI — local only
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  atlas-api:
    build:
      context: atlas-api
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: local
      DATABASE_URL: jdbc:postgresql://postgres:5432/atlasevents
      DATABASE_USERNAME: atlas
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-atlas_local_password}
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: atlas
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD:-atlas_local_rabbit}
      JWT_SECRET: ${JWT_SECRET:-local_dev_jwt_secret_change_in_production_32chars}
      ADMIN_USERNAME: ${ADMIN_USERNAME:-admin}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin_local_password}
      CORS_ALLOWED_ORIGINS: http://localhost:4200
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  atlas-scraper:
    build:
      context: atlas-scraper
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: local
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: atlas
      RABBITMQ_PASSWORD: ${RABBITMQ_PASSWORD:-atlas_local_rabbit}
      DATABASE_URL: jdbc:postgresql://postgres:5432/atlasevents
      DATABASE_USERNAME: atlas
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-atlas_local_password}
      SCRAPER_CRON: "0 */6 * * * *"    # every 6 hours
    depends_on:
      rabbitmq:
        condition: service_healthy
      postgres:
        condition: service_healthy

  atlas-web:
    build:
      context: atlas-web
      dockerfile: Dockerfile
    ports:
      - "4200:8080"
    depends_on:
      - atlas-api

volumes:
  pgdata:
```

---

## 5. Kubernetes Manifest Outline

All manifests live in `k8s/`. Applied with `kubectl apply -k k8s/overlays/staging` (Kustomize).

```
k8s/
├── base/
│   ├── namespace.yaml              # atlas-staging / atlas-prod
│   ├── atlas-api/
│   │   ├── deployment.yaml         # 1 replica, HPA target CPU 70%
│   │   ├── service.yaml            # ClusterIP :8080
│   │   └── hpa.yaml                # min 1, max 3
│   ├── atlas-scraper/
│   │   └── cronjob.yaml            # schedule: "0 */6 * * *", restartPolicy: OnFailure
│   ├── atlas-web/
│   │   ├── deployment.yaml         # 1 replica
│   │   └── service.yaml            # ClusterIP :8080
│   ├── postgres/
│   │   ├── statefulset.yaml        # 1 replica, PVC 20Gi
│   │   └── service.yaml            # ClusterIP :5432
│   ├── rabbitmq/
│   │   ├── statefulset.yaml        # 1 replica, PVC 5Gi
│   │   └── service.yaml            # ClusterIP :5672
│   ├── ingress.yaml                # Nginx Ingress + cert-manager annotation
│   ├── network-policy.yaml         # Block external → postgres/rabbitmq/prometheus
│   └── secrets/                    # Sealed Secrets or external-secrets
│       ├── atlas-api-secrets.yaml
│       └── atlas-scraper-secrets.yaml
└── overlays/
    ├── staging/
    │   └── kustomization.yaml      # staging namespace, reduced resources
    └── prod/
        └── kustomization.yaml      # prod namespace, full resources
```

### Key K8s Security Constraints (applied to all pods)
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: [ALL]
```

### NetworkPolicy — block external access to internal services
```yaml
# Postgres and RabbitMQ only accessible from atlas-api and atlas-scraper pods
# Actuator /prometheus only accessible from Prometheus pod
# All other external ingress blocked
```

### Ingress
```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-prod"
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
# Routes: / → atlas-web:8080 | /api → atlas-api:8080 | /ical → atlas-api:8080
```

---

## 6. Secrets Management

All secrets stored as **K8s Secrets** (base64-encoded). Never in ConfigMap, Dockerfile, or committed YAML.

### `atlas-api-secrets` (K8s Secret)
```
DATABASE_URL          jdbc:postgresql://postgres:5432/atlasevents
DATABASE_USERNAME     atlas
DATABASE_PASSWORD     <generated — min 32 chars>
RABBITMQ_PASSWORD     <generated — min 24 chars>
JWT_SECRET            <generated — min 32 random bytes, base64-encoded>
ADMIN_USERNAME        admin
ADMIN_PASSWORD        <bcrypt hash generated at deploy time>
```

### `atlas-scraper-secrets` (K8s Secret)
```
RABBITMQ_PASSWORD     <same as atlas-api>
DATABASE_URL          jdbc:postgresql://postgres:5432/atlasevents
DATABASE_USERNAME     atlas
DATABASE_PASSWORD     <same as atlas-api>
```

### CI Secrets (GitHub Repository Secrets)
```
KUBECONFIG_STAGING    — base64-encoded kubeconfig for staging cluster
KUBECONFIG_PROD       — base64-encoded kubeconfig for prod cluster
SEMGREP_APP_TOKEN     — Semgrep CI token
```

---

## 7. Monitoring Baseline

### Stack
```
Spring Boot Actuator + Micrometer → Prometheus → Grafana
Structured JSON logs (Logback)   → stdout → K8s log aggregation (Loki/ELK)
Alertmanager                     → email alert on SLO breach
```

### Spring Boot Actuator config (`application.yml`)
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

### Key Alerts (Alertmanager rules)

| Alert | Condition | Severity | Action |
|---|---|---|---|
| APIHighErrorRate | HTTP 5xx rate > 1% over 5 min | Critical | Email |
| APIHighLatency | p99 > 1s over 10 min | Warning | Email |
| APIDown | `/actuator/health` fails 3 consecutive checks | Critical | Email |
| ScraperJobFailed | `scrape_log.success = false` for last run | Warning | Email |
| ScraperNoEvents | `scrape_log.events_found = 0` for 2+ consecutive runs | Warning | Email |
| DiskSpaceLow | PVC usage > 80% | Warning | Email |
| CertificateExpiringSoon | TLS cert expiry < 14 days | Warning | Email |
| RabbitMQDLQNotEmpty | `events.dead` queue depth > 0 | Warning | Email |

### Grafana Dashboards
1. **Atlas Events — API Health**: RPS, error rate, p99 latency, active pods
2. **Scraper Pipeline**: Scrape runs per source, events found/inserted over time, DLQ depth
3. **Infrastructure**: PostgreSQL connections, PVC usage, RabbitMQ queue depths, pod restarts

---

## 8. Security Scanning Gates (CI Enforcement)

| Scanner | Stage | Fail Condition |
|---|---|---|
| Gitleaks | `secrets-scan` (first) | Any secret detected |
| Semgrep | `security-scan` | High or Critical SAST finding |
| Trivy (fs) | `security-scan` | Critical or High CVE in dependencies |
| Trivy (image) | `build-images` | Critical or High CVE in built image |
| Checkov | `security-scan` | Failed K8s manifest security check |

---

## 9. .env.example

See `.env.example` in project root — written alongside this document.
