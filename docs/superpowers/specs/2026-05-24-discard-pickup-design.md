# Spec: Fitur Ambil dari Tumpukan Buangan

**Tanggal:** 2026-05-24  
**Status:** Draft  
**Scope:** MVP Extension — Discard Pickup Feature

---

## 1. Latar Belakang

Dalam permainan Remi, pemain boleh mengambil kartu dari tumpukan buangan alih-alih menarik dari deck. Aturannya: pemain harus mengambil kartu target beserta semua kartu di atasnya, kartu target wajib langsung digunakan untuk membentuk meld, dan setelah itu pemain harus membuang 1 kartu.

Fitur ini menambahkan kemampuan app untuk:
1. Merekomendasikan apakah worth it mengambil dari buangan (untuk user sendiri)
2. Mencatat aksi pemain lain mengambil dari buangan (untuk menjaga state tumpukan buangan tetap akurat)

---

## 2. Aturan Mekanisme

1. Pemain melihat **7 kartu teratas** tumpukan buangan
2. Pemain memilih **kartu target** (maksimal kartu ke-7 dari atas)
3. Pemain **wajib mengambil semua kartu dari atas hingga kartu target**
4. Kartu target **harus langsung membentuk meld** bersama kartu di tangan
5. Sisa kartu yang ikut diambil **masuk ke tangan** dan bisa dipakai untuk meld lain
6. Setelah semua itu, pemain **membuang 1 kartu**

---

## 3. Data Model

### Tambahan di `src/types/index.ts`

```ts
/** Satu peluang pengambilan kartu dari tumpukan buangan */
type DiscardPickupOption = {
  targetCard: Card        // kartu yang jadi tujuan pengambilan
  targetIndex: number     // posisi dari atas tumpukan buangan (1 = paling atas, maks 7)
  cardsTaken: Card[]      // semua kartu yang harus diambil (atas s/d target, inklusif)
  formedMeld: Meld        // meld yang bisa dibentuk dengan kartu target + kartu tangan
  suggestedDiscard: Card  // kartu yang disarankan dibuang setelahnya
  netScore: number        // skor keuntungan bersih (meldValue - costOfExtraCards)
  worthIt: boolean        // true jika netScore > drawDeckScore
  reasons: string[]       // penjelasan dalam bahasa Indonesia
}

/** Hasil analisis semua peluang pengambilan dari tumpukan buangan */
type DiscardPickupRecommendation = {
  options: DiscardPickupOption[]    // semua peluang, sorted by netScore descending
  bestOption: DiscardPickupOption | null
  drawDeckScore: number             // baseline: estimasi nilai draw dari deck biasa
}
```

---

## 4. Engine Changes

### 4.1 `src/engine/probability/probabilityTracker.ts`

Tambah fungsi:

```ts
/**
 * Returns N kartu teratas dari tumpukan buangan.
 * Index terakhir array discardPile = kartu paling atas.
 * Returns semua kartu jika pile.length < n.
 */
function getTopNDiscards(discardPile: Card[], n: number): Card[]
```

### 4.2 `src/engine/recommendation/recommendationEngine.ts`

Tambah fungsi:

```ts
/**
 * Menganalisis semua peluang pengambilan kartu dari tumpukan buangan.
 * Untuk setiap kartu di 7 teratas buangan, cek apakah bisa membentuk meld
 * dengan kartu di tangan. Hitung netScore dan bandingkan dengan drawDeckScore.
 */
function analyzeDiscardPickup(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerRank: number | null,
  jokerIndicator: Card | null
): DiscardPickupRecommendation
```

**Logika netScore:**
```
meldValue      = jumlah kartu dalam formedMeld × 10
costOfExtras   = (cardsTaken.length - 1) × 5   // biaya kartu bonus yang ikut terbawa
netScore       = meldValue - costOfExtras
drawDeckScore  = rata-rata completionProbability semua nearMelds × 30
worthIt        = netScore > drawDeckScore
```

**Logika deteksi peluang:**
1. Ambil 7 kartu teratas dari `discardPile` via `getTopNDiscards`
2. Untuk setiap kartu di posisi 1–7 (sebagai kandidat target):
   - Simulasikan tangan baru = `hand + cardsTaken` (semua kartu dari atas s/d target)
   - Jalankan `solveOptimalMelds` pada tangan simulasi
   - Cek apakah `targetCard` masuk ke salah satu `completedMelds`
   - Jika ya → ini adalah peluang valid, hitung `netScore`
3. Sort semua peluang valid by `netScore` descending
4. `bestOption` = peluang dengan `netScore` tertinggi (atau `null` jika tidak ada)

---

## 5. Store Changes

### `src/store/gameStore.ts`

Tambah 2 actions baru:

```ts
/**
 * User mengambil dari buangan:
 * 1. Hapus cardsTaken dari discardPile
 * 2. Tambah cardsTaken ke hand (minus kartu yang masuk formedMeld)
 * 3. Tambah formedMeld ke visibleMelds
 * 4. Hapus kartu formedMeld dari hand
 * 5. Pindah discardAfter dari hand ke discardPile
 */
pickupFromDiscard: (
  cardsTaken: Card[],
  formedMeld: Card[],
  discardAfter: Card
) => void

/**
 * Pemain lain mengambil dari buangan:
 * 1. Hapus cardsTaken dari discardPile
 * 2. Tambah formedMeld ke visibleMelds
 * 3. Tambah newDiscard ke discardPile
 */
opponentPickupFromDiscard: (
  cardsTaken: Card[],
  formedMeld: Card[],
  newDiscard: Card
) => void
```

---

## 6. UI Changes

### 6.1 `src/components/discard/DiscardPile.tsx`

- Tampilkan 7 kartu teratas dengan visual highlight berbeda (border biru tipis) dari kartu buangan lainnya
- Tambah dua tombol baru di bawah tumpukan buangan:
  - `"Ambil dari Buangan (Saya)"` — membuka `DiscardPickupFlow` dengan mode `"self"`
  - `"Catat Ambil Pemain Lain"` — membuka `DiscardPickupFlow` dengan mode `"opponent"`
- Kedua tombol hanya aktif jika `discardPile.length > 0`

### 6.2 `src/components/discard/DiscardPickupFlow.tsx` (komponen baru)

Dialog multi-step. Dua mode: `"self"` dan `"opponent"`.

**Mode `"self"` — 3 steps:**

| Step | Konten |
|------|--------|
| 1 — Pilih Target | Tampilkan 7 kartu teratas buangan. User tap kartu target → highlight semua kartu yang akan ikut diambil. Tampilkan `DiscardPickupRecommendation` untuk target yang dipilih (worthIt badge, netScore, reasons). |
| 2 — Konfirmasi | Ringkasan: kartu yang diambil, meld yang terbentuk, kartu bonus masuk tangan, apakah worth it vs draw deck. Tombol "Konfirmasi" atau "Batal". |
| 3 — Pilih Buang | CardPicker single-select untuk memilih 1 kartu yang dibuang. `suggestedDiscard` dari engine di-pre-select sebagai default, tapi user bisa override. Setelah pilih → panggil `pickupFromDiscard`, tutup dialog. |

**Mode `"opponent"` — 3 steps:**

| Step | Konten |
|------|--------|
| 1 — Pilih Target | Tampilkan 7 kartu teratas buangan. User tap kartu target → highlight kartu yang akan diambil. Tidak ada rekomendasi. |
| 2 — Catat Meld | Multi-select CardPicker untuk mencatat meld yang dibentuk pemain lain (min. 3 kartu). CardPicker hanya menampilkan kartu yang belum digunakan di zona manapun (sudah handled oleh `CardPicker` existing). |
| 3 — Catat Buangan | Single CardPicker untuk kartu yang dibuang pemain lain. Setelah pilih → panggil `opponentPickupFromDiscard`, tutup dialog. |

### 6.3 `src/components/recommendation/RecommendationPanel.tsx`

- Tambah section baru **"Peluang Ambil Buangan"** di atas section "Kombinasi Terkuat"
- Section ini muncul otomatis jika `bestOption !== null && bestOption.worthIt === true`
- Konten section:
  - Badge "Worth It ✓" atau "Tidak Disarankan"
  - Kartu target yang disarankan diambil
  - Jumlah kartu bonus yang ikut terbawa
  - Meld yang akan terbentuk
  - Kartu yang disarankan dibuang setelahnya
  - Reasons dalam bahasa Indonesia

---

## 7. Testing

### `src/engine/probability/probabilityTracker.test.ts`

Tambah test untuk `getTopNDiscards`:
- Returns N kartu teratas (index terakhir = paling atas)
- Returns semua kartu jika `pile.length < N`
- Returns `[]` jika pile kosong

### `src/engine/recommendation/recommendationEngine.test.ts`

Tambah test untuk `analyzeDiscardPickup`:
- Deteksi peluang sequence dari tumpukan buangan
- Deteksi peluang set dari tumpukan buangan
- `worthIt = false` jika biaya kartu bonus terlalu tinggi (banyak kartu ikut terbawa)
- `worthIt = true` jika meld yang terbentuk bernilai tinggi dengan sedikit kartu bonus
- `bestOption: null` jika tidak ada peluang meld di 7 kartu teratas
- Joker di tumpukan buangan diperhitungkan sebagai kartu bonus biasa (bukan wildcard untuk meld)

### `src/store/gameStore.test.ts`

Tambah test untuk actions baru:
- `pickupFromDiscard` memindahkan kartu dengan benar ke semua zona
- `pickupFromDiscard` tidak meninggalkan duplikat kartu di zona manapun
- `opponentPickupFromDiscard` update `discardPile` dan `visibleMelds` dengan benar
- `opponentPickupFromDiscard` tidak meninggalkan duplikat kartu

---

## 8. Batasan & Asumsi

- Maksimal kartu yang bisa dilihat dari tumpukan buangan: **7 kartu**
- Kartu target wajib langsung membentuk meld — tidak boleh ambil kartu buangan tanpa tujuan meld
- Satu aksi pengambilan hanya menghasilkan **satu meld baru** (meld dari kartu target)
- Kartu bonus yang ikut terbawa bisa dipakai untuk meld lain di giliran yang sama, tapi ini tidak dimodelkan secara eksplisit di engine (user yang memutuskan)
- `drawDeckScore` adalah estimasi sederhana berbasis `nearMelds` yang sudah ada — bukan simulasi Monte Carlo

---

## 9. File yang Diubah / Dibuat

| File | Status |
|------|--------|
| `src/types/index.ts` | Diubah — tambah 2 type baru |
| `src/engine/probability/probabilityTracker.ts` | Diubah — tambah `getTopNDiscards` |
| `src/engine/recommendation/recommendationEngine.ts` | Diubah — tambah `analyzeDiscardPickup` |
| `src/store/gameStore.ts` | Diubah — tambah 2 actions baru |
| `src/components/discard/DiscardPile.tsx` | Diubah — highlight + 2 tombol baru |
| `src/components/discard/DiscardPickupFlow.tsx` | Baru — dialog multi-step |
| `src/components/recommendation/RecommendationPanel.tsx` | Diubah — tambah section peluang |
| `src/engine/probability/probabilityTracker.test.ts` | Diubah — tambah test |
| `src/engine/recommendation/recommendationEngine.test.ts` | Diubah — tambah test |
| `src/store/gameStore.test.ts` | Diubah — tambah test |
