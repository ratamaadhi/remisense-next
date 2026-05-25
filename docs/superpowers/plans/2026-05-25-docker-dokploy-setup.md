# Docker + Dokploy Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setup Docker multi-stage build dengan Nginx untuk deploy Next.js static site ke Dokploy.

**Architecture:** Multi-stage Dockerfile — stage 1 build static files dengan Node.js, stage 2 serve dengan Nginx alpine. Next.js dikonfigurasi dengan `output: 'export'` untuk generate static files ke folder `out/`.

**Tech Stack:** Next.js 16, Node.js 20 Alpine, Nginx Alpine, Docker

---

## File Structure

| File | Action | Keterangan |
|------|--------|------------|
| `next.config.ts` | Modify | Tambah `output: 'export'` |
| `Dockerfile` | Create | Multi-stage build |
| `nginx.conf` | Create | SPA routing + gzip |
| `.dockerignore` | Create | Exclude unnecessary files |

---

### Task 1: Update next.config.ts untuk static export

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Buka dan edit next.config.ts**

Ubah isi file menjadi:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

- [ ] **Step 2: Verifikasi build berjalan dengan benar**

```bash
npm run build
```

Expected output: Build sukses dan folder `out/` terbentuk di root project. Pastikan ada file `out/index.html`.

```bash
ls out/
```

Expected: `index.html`, `_next/`, dan file/folder lainnya.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add static export output to next.config"
```

---

### Task 2: Buat .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Buat file .dockerignore**

```
node_modules
.next
out
.git
.gitignore
*.md
docs
.env*
.DS_Store
coverage
.opencode
.superpowers
graphify-out
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "feat: add .dockerignore"
```

---

### Task 3: Buat nginx.conf

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Buat file nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Cache static assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add nginx.conf
git commit -m "feat: add nginx config for static site serving"
```

---

### Task 4: Buat Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Buat file Dockerfile**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static build output
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Test build Docker image secara lokal**

```bash
docker build -t ai-remi-assist .
```

Expected: Build sukses tanpa error. Dua stage selesai.

- [ ] **Step 3: Test jalankan container secara lokal**

```bash
docker run -p 8080:80 ai-remi-assist
```

Buka browser ke `http://localhost:8080`. Pastikan app tampil dengan benar.

- [ ] **Step 4: Stop container dan commit**

```bash
# Ctrl+C untuk stop, atau:
docker ps
docker stop <container-id>

git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile with nginx"
```

---

### Task 5: Verifikasi final dan push

- [ ] **Step 1: Cek semua file sudah ada**

```bash
ls -la Dockerfile nginx.conf .dockerignore
cat next.config.ts
```

Expected: Semua 4 file ada. `next.config.ts` mengandung `output: 'export'`.

- [ ] **Step 2: Cek ukuran Docker image**

```bash
docker images ai-remi-assist
```

Expected: Size sekitar 20-40MB.

- [ ] **Step 3: Push ke remote**

```bash
git push
```

---

## Dokploy Setup (Manual Steps)

Setelah semua file di-push ke repo, lakukan langkah berikut di Dokploy:

1. Buat aplikasi baru → pilih tipe **Application**
2. Connect ke repository ini
3. Build type: **Dockerfile**
4. Dockerfile path: `./Dockerfile`
5. Port: set **Published Port** = `3000`, **Container Port** = `80`
6. Deploy

Akses app di `http://<IP-server>:3000`.
