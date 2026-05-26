# Panduan Bermain Remi (Berdasarkan Aturan RemiSense)

Dokumen ini menjelaskan aturan permainan kartu Remi (varian Rummy Indonesia) sesuai dengan implementasi pada aplikasi RemiSense.

---

## Daftar Isi

1. [Komponen Permainan](#komponen-permainan)
2. [Persiapan Permainan](#persiapan-permainan)
3. [Sistem Joker](#sistem-joker)
4. [Meld (Kombinasi Kartu)](#meld-kombinasi-kartu)
5. [Alur Permainan](#alur-permainan)
6. [Mengambil dari Tumpukan Buangan](#mengambil-dari-tumpukan-buangan)
7. [Nilai Poin Kartu](#nilai-poin-kartu)
8. [Kondisi Menang](#kondisi-menang)
9. [Tips Strategi](#tips-strategi)

---

## Komponen Permainan

### Kartu

- **1 set kartu standar** (52 kartu, tanpa kartu Joker terpisah)
- **4 jenis (suit):** Spade (Sekop), Heart (Hati), Diamond (Wajik), Club (Keriting)
- **13 peringkat (rank) per suit:**
  - **As (A)** — peringkat 1
  - **2 sampai 10** — kartu angka
  - **Jack (J)** — peringkat 11
  - **Queen (Q)** — peringkat 12
  - **King (K)** — peringkat 13

### Pemain

- Jumlah pemain: **4 orang** (default, dapat disesuaikan)

---

## Persiapan Permainan

Persiapan dilakukan dalam beberapa langkah:

### 1. Pembagian Kartu

Setiap pemain menerima **7 kartu** yang hanya diketahui oleh pemain tersebut.

### 2. Pembentukan Tumpukan Buangan Awal

Setiap pemain membuang **1 kartu** secara terbuka (menghadap ke atas). Kartu-kartu ini membentuk tumpukan buangan awal. Contoh: untuk 4 pemain, tumpukan buangan awal berisi 4 kartu.

### 3. Penentuan Joker

Salah satu pemain mengambil **1 kartu secara acak** dari sisa tumpukan. Kartu ini diletakkan terbuka dan terlihat oleh semua pemain. **Peringkat (rank) dari kartu ini menentukan joker untuk seluruh permainan.**

> **Contoh:** Jika kartu yang terambil adalah 7 Hati, maka SEMUA kartu berperingkat 7 (7 Sekop, 7 Hati, 7 Wajik, 7 Keriting) menjadi joker.

Setelah langkah ini selesai, permainan dimulai.

---

## Sistem Joker

Sistem joker pada Remi berbeda dari permainan kartu lainnya:

- **Bukan kartu terpisah** — joker ditentukan berdasarkan peringkat kartu indikator yang diambil saat setup
- **Semua 4 kartu** dengan peringkat tersebut menjadi wildcard (joker)
- Joker dapat **menggantikan kartu apapun** untuk melengkapi sebuah meld
- Joker **sangat berharga** — tidak boleh dibuang
- Sebuah meld **harus memiliki minimal 1 kartu biasa** (non-joker) sebagai anchor; meld tidak bisa terdiri dari joker semua
- Kartu indikator yang diambil saat setup **dikeluarkan dari permainan** (tidak bisa diambil siapapun)

---

## Meld (Kombinasi Kartu)

Meld adalah kombinasi kartu yang valid. Ada dua jenis meld:

### Set (Kelompok)

**3 atau 4 kartu dengan peringkat sama tetapi suit berbeda.**

| Contoh Valid | Keterangan |
|---|---|
| 7♠ 7♥ 7♦ | Set 3 kartu |
| 9♠ 9♥ 9♦ 9♣ | Set 4 kartu (lengkap) |
| 7♠ 7♥ [Joker] | Set dengan joker menggantikan 7♦ atau 7♣ |

**Aturan Set:**
- Minimal 3 kartu, maksimal 4 kartu (satu per suit)
- Setiap kartu harus memiliki suit yang berbeda
- Joker boleh mengisi posisi yang kosong
- Minimal 1 kartu biasa (non-joker) diperlukan

### Sequence (Urutan)

**3 atau lebih kartu berurutan dengan suit yang sama.**

| Contoh Valid | Keterangan |
|---|---|
| 5♠ 6♠ 7♠ | Urutan 3 kartu |
| 3♥ 4♥ 5♥ 6♥ | Urutan 4 kartu |
| 11♣ 12♣ 13♣ | J-Q-K (urutan kartu wajah) |
| 5♠ [Joker] 7♠ | Joker mengisi posisi 6♠ |

**Aturan Sequence — PENTING:**

Ada **batas transisi yang dilarang** dalam urutan:

| Transisi | Status | Penjelasan |
|---|---|---|
| As (1) → 2 | **DILARANG** | As tidak bisa menyambung ke 2 |
| 10 → Jack (11) | **DILARANG** | 10 tidak bisa menyambung ke J |

Artinya, kelompok urutan yang valid hanya:

1. **Peringkat 2 sampai 10** — contoh: 2-3-4, 5-6-7-8, 8-9-10
2. **Peringkat 11 sampai 13** — hanya: J-Q-K

**Contoh TIDAK VALID:**

| Contoh | Alasan |
|---|---|
| A-2-3 | As tidak bisa menyambung ke 2 |
| 10-J-Q | 10 tidak bisa menyambung ke J |
| 9-10-J | Melintasi batas 10→J |
| K-A-2 | Tidak ada wrap-around |

> **Catatan:** Kartu As hanya bisa membentuk **Set** (misalnya A♠ A♥ A♦). As tidak pernah berpartisipasi dalam sequence.

---

## Alur Permainan

Setiap giliran pemain terdiri dari langkah-langkah berikut:

### 1. Mengambil Kartu

Pemain memilih salah satu:
- **Ambil dari tumpukan tertutup** (draw) — mengambil 1 kartu dari atas tumpukan sisa
- **Ambil dari tumpukan buangan** (pickup) — mengambil kartu dari tumpukan buangan dengan aturan khusus (lihat bagian berikutnya)

### 2. Menyusun Kartu (Opsional)

Pemain dapat meletakkan (lay down) meld yang valid dari tangan ke meja. Meld yang diletakkan terlihat oleh semua pemain.

- Minimal **3 kartu** untuk meletakkan meld
- Meld yang sudah diletakkan tidak bisa ditarik kembali

### 3. Membuang Kartu

Pemain **wajib membuang 1 kartu** ke tumpukan buangan untuk mengakhiri giliran.

---

## Mengambil dari Tumpukan Buangan

Aturan mengambil kartu dari tumpukan buangan memiliki ketentuan khusus:

### Visibilitas

Hanya **7 kartu teratas** dari tumpukan buangan yang terlihat dan dapat diambil.

### Prosedur Pengambilan

1. Pemain memilih **kartu target** dari 7 kartu teratas
2. Pemain **harus mengambil SEMUA kartu** dari atas tumpukan hingga kartu target (inklusif)
3. Kartu target **harus langsung membentuk meld** dengan kartu di tangan pemain
4. Kartu-kartu di atas kartu target masuk ke tangan pemain sebagai kartu tambahan
5. Setelah mengambil, pemain tetap **wajib membuang 1 kartu**

### Batasan Sequence-First

- Jika pemain **belum memiliki sequence** yang diletakkan di meja, kartu target hanya boleh membentuk **sequence** (bukan set)
- Jika pemain **sudah memiliki minimal 1 sequence** di meja, kartu target boleh membentuk sequence ATAU set

> **Contoh:** Pemain belum punya meld di meja. Ia melihat 6♥ di tumpukan buangan. Jika ia punya 4♥ 5♥ di tangan, ia boleh mengambil 6♥ karena membentuk sequence 4♥-5♥-6♥. Tapi jika ia punya 6♠ 6♦, ia TIDAK boleh mengambil 6♥ untuk membentuk set karena belum punya sequence di meja.

---

## Nilai Poin Kartu

Poin kartu dihitung untuk menentukan penalti di akhir permainan. Kartu yang tidak membentuk meld dihitung sebagai penalti.

| Kartu | Nilai Poin |
|---|---|
| As (A) | **15 poin** (tertinggi) |
| 2 sampai 10 | **5 poin** masing-masing |
| Jack, Queen, King | **10 poin** masing-masing |

> **Catatan:** As memiliki poin tertinggi karena hanya bisa membentuk set (tidak bisa ikut sequence), sehingga lebih sulit untuk digunakan.

---

## Kondisi Menang

Pemain **menang** ketika **semua kartu di tangan membentuk meld yang valid** — tidak ada kartu sisa (dead card).

Artinya setiap kartu di tangan harus menjadi bagian dari set atau sequence yang lengkap.

---

## Tips Strategi

Berdasarkan sistem heuristik yang diimplementasikan di RemiSense:

### Prioritas Menyimpan Kartu

1. **Joker** — jangan pernah dibuang, bisa melengkapi meld apapun
2. **Kartu dalam meld lengkap** — sudah membentuk kombinasi valid
3. **Kartu dalam near-meld** — hanya butuh 1 kartu lagi untuk lengkap (contoh: punya 5♠ 6♠, butuh 4♠ atau 7♠)
4. **Kartu fleksibel** — bisa masuk ke banyak kombinasi potensial

### Prioritas Membuang Kartu

1. **Dead card** — kartu terisolasi yang tidak dekat dengan kombinasi apapun
2. **Kartu bernilai tinggi yang terisolasi** — As atau kartu wajah yang tidak punya pasangan
3. **Kartu dengan probabilitas rendah** — kartu yang kemungkinan melengkapi meld-nya kecil (karena kartu yang dibutuhkan sudah terlihat di buangan/meld lawan)

### Pertimbangan Lainnya

- **Perhatikan tumpukan buangan** — kartu yang sudah dibuang mengurangi peluang melengkapi meld tertentu
- **Perhatikan meld lawan** — kartu yang terlihat di meja lawan juga mengurangi pool kartu tersedia
- **Hitung kartu tersisa** — semakin sedikit kartu yang belum terlihat, semakin akurat estimasi probabilitas
- **Pertimbangkan pickup** — kadang mengambil dari tumpukan buangan lebih menguntungkan daripada draw acak, terutama jika kartu target langsung melengkapi meld

---

## Glosarium

| Istilah | Definisi |
|---|---|
| **Meld** | Kombinasi kartu yang valid (set atau sequence) |
| **Set** | 3-4 kartu peringkat sama, suit berbeda |
| **Sequence** | 3+ kartu berurutan, suit sama |
| **Joker** | Kartu wildcard (ditentukan oleh peringkat kartu indikator) |
| **Dead Card** | Kartu terisolasi yang tidak dekat dengan kombinasi apapun |
| **Near-Meld** | Kombinasi parsial yang butuh 1 kartu lagi untuk lengkap |
| **Draw** | Mengambil kartu dari tumpukan tertutup |
| **Pickup** | Mengambil kartu dari tumpukan buangan |
| **Lay Down** | Meletakkan meld dari tangan ke meja |
| **Discard** | Membuang 1 kartu ke tumpukan buangan |

---

*Dokumen ini dibuat berdasarkan aturan yang diimplementasikan pada aplikasi RemiSense.*
