# Dockerfile Standalone for Dokploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from static export + Nginx to Next.js standalone output + `node server.js` for Dokploy deployment with Traefik.

**Architecture:** 3-stage Dockerfile (deps → builder → runner), non-root `nextjs` user, `server.js` via `output: 'standalone'`, Traefik at edge routes to port 3000.

**Tech Stack:** Next.js 16.2.6, Node.js 20.19 (alpine), Dokploy, Traefik

---

### Task 1: Update `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Change output mode from `'export'` to `'standalone'`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

---

### Task 2: Rewrite `Dockerfile`

**Files:**
- Modify: `Dockerfile`

- [ ] **Replace entire Dockerfile with standalone multi-stage build**

```dockerfile
FROM node:20.19-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

### Task 3: Remove `nginx.conf`

**Files:**
- Delete: `nginx.conf`

- [ ] **Delete nginx config file**

```bash
git rm nginx.conf
```

---

### Task 4: Verify build

**Files:**
- N/A

- [ ] **Run Next.js build to verify standalone output works**

```bash
npm run build
```

Expected: `.next/standalone/` is created with `server.js`

- [ ] **Run tests to verify nothing broke**

```bash
npm run test:run
```

Expected: all tests pass

---

### Task 5: Commit

**Files:**
- N/A

- [ ] **Commit all changes**

```bash
git add next.config.ts Dockerfile
git rm nginx.conf
git commit -m "feat: migrate to standalone output for Dokploy deployment

- Replace static export + Nginx with Next.js standalone output
- Multi-stage Dockerfile with non-root user
- Remove nginx.conf (Traefik handles reverse proxy)
```
