# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# EduAI Companion — multi-stage production image
#
#   docker build -t ghcr.io/zwenix/eduaicompanion:dev .
#   docker run -p 3000:3000 --env-file .env ghcr.io/zwenix/eduaicompanion:dev
#
# Stage 1 "build"   : installs ALL deps (incl. dev) and runs the Vite +
#                     esbuild production build (client → dist/, server →
#                     dist/server.cjs).
# Stage 2 "runtime" : production deps only, bundled app, non-root user.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts fallback keeps the build working on hosts where a
# postinstall hook is unavailable (matches local/CI convention in MANUAL_PUSH.md)
RUN npm ci --no-audit --no-fund || npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# Production artifacts from the build stage
COPY --from=build /app/dist ./dist
# The /splash.mp4 route reads splash.mp4 from the working directory
COPY splash.mp4 ./
# Fallback static assets (also copied into dist/ by Vite, kept for parity)
COPY public ./public

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/server.cjs"]
