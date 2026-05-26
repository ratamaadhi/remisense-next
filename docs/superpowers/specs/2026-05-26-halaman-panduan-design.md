# Halaman Panduan Bermain Remi — Design Spec

**Tanggal:** 2026-05-26
**Status:** Approved

---

## Ringkasan

Menambahkan halaman terpisah `/panduan` yang menampilkan panduan bermain Remi. Konten di-parse dari file markdown yang sudah ada (`docs/panduan-bermain-remi.md`). Layout menggunakan single column dengan sticky Table of Contents sidebar.

---

## Keputusan Design

| Aspek | Keputusan |
|-------|-----------|
| Akses | Halaman terpisah di route `/panduan` |
| Layout | Single column + sticky TOC sidebar |
| Navigasi | Header link (selalu visible) + tombol di setup phase |
| Konten | Parse dari `docs/panduan-bermain-remi.md` saat build time |
| Library | `react-markdown` + `remark-gfm` |

---

## Arsitektur

### File Baru

```
src/app/panduan/page.tsx       — Halaman utama panduan
src/components/panduan/
  TableOfContents.tsx          — Sidebar TOC component
  MarkdownRenderer.tsx         — Custom markdown renderer dengan styling
```

### File yang Dimodifikasi

```
src/app/layout.tsx             — Tambah navigation link ke /panduan (jika ada shared nav)
src/components/setup/          — Tambah tombol "Cara Bermain" di setup phase
```

---

## Layout Detail

### Desktop (≥768px)

```
┌─────────────────────────────────────────────────┐
│  ← Kembali ke Permainan          [Theme Toggle] │
├────────────┬────────────────────────────────────┤
│            │                                    │
│  Daftar    │   # Panduan Bermain Remi           │
│  Isi       │                                    │
│            │   ## Komponen Permainan             │
│  • Komponen│   - 1 set kartu standar...          │
│  • Persiap.│                                    │
│  • Joker   │   ## Persiapan Permainan           │
│  • Meld    │   ...                              │
│  • Alur    │                                    │
│  • Pickup  │                                    │
│  • Poin    │                                    │
│  • Menang  │                                    │
│  • Strategi│                                    │
│            │                                    │
├────────────┴────────────────────────────────────┤
│  (sticky)     (scrollable, max-w-prose)         │
└─────────────────────────────────────────────────┘
```

- TOC: sticky, scroll-spy highlight section aktif
- Konten: max-width ~65ch untuk readability
- Heading mendapat anchor ID untuk deep-link

### Mobile (<768px)

```
┌─────────────────────────┐
│ ← Kembali    [Theme]    │
├─────────────────────────┤
│ ▼ Daftar Isi           │
│  (collapsible dropdown) │
├─────────────────────────┤
│                         │
│ # Panduan Bermain Remi  │
│                         │
│ ## Komponen Permainan   │
│ ...                     │
│                         │
└─────────────────────────┘
```

- TOC: collapsible di atas konten
- Full-width content dengan padding

---

## Navigasi ke Halaman Panduan

### 1. Header Link (Selalu Visible)

- Posisi: di area header/navigation halaman utama
- Tampilan: ikon buku (`BookOpen` dari Lucide) + teks "Panduan"
- Behavior: `<Link href="/panduan">` (Next.js client-side navigation)

### 2. Setup Phase Button

- Posisi: di area setup, dekat tombol-tombol setup lainnya
- Tampilan: tombol secondary/outline "Cara Bermain"
- Behavior: sama, link ke `/panduan`

---

## Rendering Markdown

### Pendekatan

1. Import markdown file sebagai raw string saat build time (Next.js static import atau fs.readFileSync di server component)
2. Parse dengan `react-markdown` + `remark-gfm`
3. Custom components untuk styling:
   - `h2`, `h3` → Shadcn-style heading + anchor ID
   - `table` → styled table dengan border dan alternating rows
   - `blockquote` → styled callout/note box
   - `code` → inline code styling
   - `ul`, `ol` → proper list styling

### TOC Generation

- Extract semua `## Heading` dari markdown content
- Generate anchor ID dari heading text (slugify)
- Render sebagai list of links di sidebar
- Scroll-spy: highlight TOC item berdasarkan scroll position (IntersectionObserver)

---

## Dependencies Baru

| Package | Versi | Alasan |
|---------|-------|--------|
| `react-markdown` | ^9.x | Render markdown ke React components |
| `remark-gfm` | ^4.x | Support tabel GFM di markdown |

---

## Styling

- Mengikuti existing theme (dark/light mode via ThemeProvider)
- Menggunakan Tailwind prose-like classes untuk typography
- Tabel: border, header bold, alternating row colors
- Blockquote: left border accent + background subtle
- TOC active item: text color accent atau bold

---

## Edge Cases

- **Markdown file tidak ditemukan:** Build akan gagal (fail-fast, karena static)
- **Heading tanpa anchor:** Semua h2/h3 otomatis dapat ID
- **Mobile TOC:** Collapse by default, expand on tap
- **Back navigation:** Tombol "Kembali" menggunakan `router.back()` atau link ke `/`

---

## Out of Scope

- Search/filter dalam panduan
- Multi-bahasa (hanya Bahasa Indonesia)
- Edit panduan dari UI
- Print/PDF export
