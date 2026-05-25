# Docker + Dokploy Setup Design

**Date:** 2026-05-25  
**Project:** ai-remi-assist  
**Status:** Approved

## Summary

Setup Docker untuk deploy aplikasi Next.js static site ke Dokploy menggunakan multi-stage build dengan Nginx sebagai web server.

## Context

- Next.js 16, React 19, Tailwind 4
- Pure static site — tidak ada SSR, API routes, atau environment variables
- Deploy ke Dokploy dengan akses via IP langsung (belum ada domain)
- Dokploy berjalan di port 3000 pada host

## Architecture

### Multi-stage Dockerfile

**Stage 1 — builder (`node:20-alpine`)**
- Install dependencies via `npm ci`
- Run `next build` yang menghasilkan static output di `out/`
- Requires `output: 'export'` di `next.config.ts`

**Stage 2 — runner (`nginx:alpine`)**
- Copy folder `out/` dari stage builder ke nginx webroot (`/usr/share/nginx/html`)
- Serve di port 80 di dalam container
- Custom `nginx.conf` untuk handle SPA client-side routing (fallback ke `index.html`)

### Port Mapping di Dokploy

- Host port: `3000`
- Container port: `80`
- Akses: `http://<IP-server>:3000`

Tidak ada conflict — port 3000 adalah port host, Nginx berjalan di port 80 di dalam container.

## Files yang Dibuat/Diubah

| File | Action | Keterangan |
|------|--------|------------|
| `Dockerfile` | Create | Multi-stage build: node builder + nginx runner |
| `nginx.conf` | Create | Konfigurasi nginx dengan SPA fallback routing |
| `next.config.ts` | Modify | Tambah `output: 'export'` |
| `.dockerignore` | Create | Exclude `node_modules`, `.next`, `out`, dll |

## nginx.conf Design

- Root: `/usr/share/nginx/html`
- Port: `80`
- `try_files $uri $uri/ /index.html` — handle client-side routing
- Gzip compression untuk performa
- Cache headers untuk static assets

## Trade-offs

| Aspek | Keputusan |
|-------|-----------|
| Web server | Nginx (bukan Node.js `next start`) — lebih ringan untuk static |
| Image size | ~20MB (nginx:alpine) vs ~200MB+ (node) |
| SSR support | Tidak diperlukan saat ini |
| Env vars | Tidak ada |

## Catatan

- Jika di masa depan perlu SSR atau API routes, perlu ganti ke Opsi B (Node.js `next start`) dan hapus `output: 'export'`
- Jika domain sudah siap, konfigurasi Dokploy proxy/traefik bisa ditambahkan tanpa mengubah Dockerfile
