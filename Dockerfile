# Build targets: `api` (Hono + Prisma) and `web` (static SPA behind nginx).
# Used by docker-compose.yml for self-hosting.

FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
RUN npm ci
COPY . .
RUN npm run build -w @foyer/types

FROM base AS api
RUN npm run build -w @foyer/api
ENV NODE_ENV=production \
    DEPLOYMENT_MODE=cloud \
    PORT=3000
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

FROM base AS web-build
ARG VITE_APP_NAME=
ARG VITE_PRIVACY_CONTACT_EMAIL=
ARG VITE_SOURCE_URL=
RUN npm run build -w @foyer/web

FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
