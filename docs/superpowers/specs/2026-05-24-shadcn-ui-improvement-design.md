# UI Improvement dengan shadcn/ui — RemiSense AI

**Tanggal:** 2026-05-24  
**Status:** Approved  
**Scope:** Visual improvement only — tidak ada perubahan fungsional/logika game

---

## Latar Belakang

RemiSense AI saat ini menggunakan komponen UI custom dengan Tailwind CSS 4. Tampilan sudah fungsional tapi tidak konsisten — setiap komponen punya styling sendiri-sendiri. Tujuan improvement ini adalah mengganti komponen custom dengan shadcn/ui untuk konsistensi visual, aksesibilitas yang lebih baik, dan maintainability jangka panjang.

---

## Keputusan Desain

- **Gaya visual:** Clean & Minimal (putih bersih, border tipis, fokus konten)
- **Layout:** Sidebar kanan dipertahankan (input 2/3 kiri, rekomendasi 1/3 kanan sticky)
- **Komponen shadcn/ui yang dipakai:** Card, Button, Badge (sebagai inspirasi CardChip), Dialog, Separator, Progress

---

## Perubahan per Area

### 1. Setup shadcn/ui

Proyek belum punya shadcn/ui. Perlu inisialisasi dan install komponen.

**Langkah:**
- Jalankan `npx shadcn@latest init` — pilih style Default, base color Slate, CSS variables yes
- Add komponen: `button`, `card`, `badge`, `dialog`, `separator`, `progress`
- File `src/lib/utils.ts` dibuat otomatis (berisi `cn()` utility)

**Catatan Tailwind 4:** shadcn/ui secara default menggunakan Tailwind 3. Perlu verifikasi kompatibilitas dengan Tailwind 4 saat init — kemungkinan perlu penyesuaian di `globals.css` untuk CSS variables.

---

### 2. Card Component

**Berlaku untuk:** `HandArea`, `DiscardPile`, `MeldTable`, `RecommendationPanel`, `GameSetup`

**Sebelum:**
```tsx
<div className="border rounded-lg p-4 bg-white">
  <h2 className="text-base font-semibold text-gray-800">...</h2>
  ...
</div>
```

**Sesudah:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">...</CardTitle>
  </CardHeader>
  <CardContent>
    ...
  </CardContent>
</Card>
```

---

### 3. Button Component

**Berlaku untuk:** semua `<button>` di seluruh komponen

| Tombol | Variant | Size |
|--------|---------|------|
| + Tambah Kartu | `outline` | `sm` |
| + Buangan Pemain Lain | `outline` | `sm` |
| + Tambah Grup Meld | `outline` | `sm` |
| Reset Permainan | `destructive` | `sm` |
| Lanjut → | `default` | `sm` |
| Mulai Permainan | `default` | `default` |
| Konfirmasi (CardPicker) | `default` | `default` |
| Hapus meld (✕) | `ghost` | `icon` |
| Tutup modal (✕) | `ghost` | `icon` |
| Pilih jumlah pemain (2-6) | `outline` | `default` |

---

### 4. CardChip

CardChip tetap sebagai komponen custom karena butuh interaktivitas spesifik (onClick, disabled, variant danger/success, joker styling). Namun:
- Gunakan `cn()` dari shadcn untuk class merging yang lebih bersih
- Sesuaikan styling agar konsisten dengan design token shadcn (border-radius, shadow, spacing)
- Tidak menggunakan `<Badge>` shadcn langsung karena Badge tidak support `onClick` dan `disabled` dengan baik

---

### 5. Dialog untuk CardPicker

**Sebelum:** Modal custom dengan `fixed inset-0 bg-black/50`

**Sesudah:** `<Dialog>` shadcn

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Di parent (HandArea, DiscardPile, dll):
<Dialog open={showPicker} onOpenChange={setShowPicker}>
  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{multiSelect ? "Pilih Kartu (min. 3)" : "Pilih Kartu"}</DialogTitle>
    </DialogHeader>
    {/* konten grid kartu tetap sama */}
  </DialogContent>
</Dialog>
```

**Keuntungan:** Focus trap otomatis, Escape key menutup dialog, aria-labelledby otomatis, animasi masuk/keluar.

**Perubahan API CardPicker:** Hapus prop `onClose` — Dialog shadcn handle sendiri via `onOpenChange`. Hapus tombol ✕ manual di dalam CardPicker karena DialogContent sudah punya close button bawaan.

---

### 6. Separator di RecommendationPanel

Tambah `<Separator>` antara section di RecommendationPanel:
- Antara "Buang" dan "Kombinasi Terkuat"
- Antara "Kombinasi Terkuat" dan "Hampir Lengkap"
- Antara "Hampir Lengkap" dan "Kartu Berisiko"

---

### 7. Progress/Stepper di GameSetup

Tambah visual step indicator di atas form GameSetup.

**Steps:** Jumlah Pemain (1) → Kartu Tangan (2) → Buangan Awal (3) → Kartu Joker (4) → Selesai (5)

**Implementasi:** Gunakan `<Progress>` shadcn dengan value `(currentStep / totalSteps) * 100`, ditambah label step di bawahnya.

```tsx
import { Progress } from "@/components/ui/progress"

const STEP_MAP: Record<SetupStep, number> = {
  playerCount: 1,
  hand: 2,
  initialDiscard: 3,
  joker: 4,
  done: 5,
}

<Progress value={(STEP_MAP[step] / 5) * 100} className="mb-4" />
<p className="text-xs text-muted-foreground mb-4">
  Langkah {STEP_MAP[step]} dari 5
</p>
```

---

## File yang Berubah

| File | Perubahan |
|------|-----------|
| `src/app/globals.css` | Tambah CSS variables shadcn |
| `src/app/layout.tsx` | Tidak berubah |
| `src/app/page.tsx` | Tidak berubah (layout sudah oke) |
| `src/components/ui/*` | Baru — generated oleh shadcn CLI |
| `src/lib/utils.ts` | Baru — `cn()` utility |
| `src/components/hand/HandArea.tsx` | Card, Button, Dialog |
| `src/components/hand/CardPicker.tsx` | Hapus wrapper modal, pakai DialogContent |
| `src/components/hand/CardChip.tsx` | Gunakan `cn()`, sesuaikan styling |
| `src/components/discard/DiscardPile.tsx` | Card, Button, Dialog |
| `src/components/melds/MeldTable.tsx` | Card, Button, Dialog, Button ghost icon |
| `src/components/recommendation/RecommendationPanel.tsx` | Card, Separator |
| `src/components/setup/GameSetup.tsx` | Card, Button, Progress, Dialog |

---

## Batasan & Non-Goals

- Tidak mengubah logika game engine sama sekali
- Tidak mengubah store (Zustand)
- Tidak menambah fitur baru
- Tidak mengubah layout grid halaman utama
- Dark mode tidak diimplementasikan (pilihan Clean & Minimal / light only)

---

## Risiko

- **Tailwind 4 + shadcn:** shadcn/ui didesain untuk Tailwind 3. Perlu cek apakah `npx shadcn init` berjalan mulus dengan Tailwind 4. Jika ada konflik CSS variables, perlu manual merge di `globals.css`.
- **CardPicker API change:** Menghapus prop `onClose` dari CardPicker akan membutuhkan update di semua parent yang memanggilnya (HandArea, DiscardPile, MeldTable, GameSetup).
