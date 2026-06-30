# ── Stage 1: Build Angular ────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG API_URL=http://localhost:8080
ENV API_URL=${API_URL}

RUN npm run build -- --configuration production

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
RUN addgroup -S atlas && adduser -S atlas -G atlas

COPY --from=build /app/dist/atlas-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx needs to write its tmp files
RUN chown -R atlas:atlas /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown atlas:atlas /var/run/nginx.pid

USER atlas
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
