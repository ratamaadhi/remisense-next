# Dockerfile: Standalone Output untuk Dokploy (tanpa Nginx)

**Date:** 2026-06-06
**Status:** Approved

## Context

RemiSense saat ini menggunakan static export (`output: 'export'`) dengan Nginx sebagai static file server. Untuk deployment di Dokploy (yang sudah menggunakan Traefik sebagai reverse proxy/SSL terminator), Nginx tidak diperlukan.

## Decision: Standalone Output + `next start`

Ganti dari `output: 'export'` + Nginx → `output: 'standalone'` + `node server.js`.

### Why Standalone

- Official Next.js production deployment pattern
- Built-in compression (gzip/brotli) dan caching headers
- Support SSR/API routes jika dibutuhkan nanti tanpa perubahan Dockerfile
- Dokploy Traefik handle edge (SSL, domain routing)
- Tidak perlu binary tambahan (cukup Node.js yang sudah di project)

## Changes

### 1. `next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

### 2. `Dockerfile`

3-stage build:
1. `deps` — `npm ci` isolasi dependency
2. `builder` — `npm run build`
3. `runner` — minimal image, non-root `nextjs` user

Final image: `node:20.19-alpine`, `EXPOSE 3000`, `CMD ["node", "server.js"]`

`public/` dan `.next/static/` di-copy manual karena standalone output tidak meng-include-nya.

### 3. Deleted

- `nginx.conf` — tidak diperlukan lagi (Traefik handle reverse proxy)

### 4. `.dockerignore`

Tidak ada perubahan signifikan (entry `out` bisa dihapus atau dibiarkan).

## Port

- Container: `3000`
- Dokploy/Traefik routing dari `443` → `3000`
- Environment: `PORT=3000`, `HOSTNAME="0.0.0.0"`
