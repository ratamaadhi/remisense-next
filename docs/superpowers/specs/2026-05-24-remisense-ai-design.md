# Design Doc: RemiSense AI — MVP

**Tanggal:** 2026-05-24  
**Status:** Approved  
**Sumber PRD:** PRD.md

---

## 1. Ringkasan Produk

RemiSense AI adalah aplikasi web decision-support untuk permainan kartu Remi. Aplikasi membantu pemain membuat keputusan lebih baik dengan menganalisis kartu di tangan, tumpukan buangan, dan meld yang terlihat di meja, lalu memberikan rekomendasi buangan terbaik dan kombinasi terkuat.

**Bukan** autonomous AI player — ini adalah "AI Recommendation Assistant".

---

## 2. Keputusan Desain dari Brainstorming

| Topik | Keputusan |
|---|---|
| Target pengguna | Semua level: beginner hingga advanced |
| Input kartu | Klik dari grid 52 kartu (minimalis) |
| Camera/OCR | Tidak di MVP, masuk roadmap post-MVP |
| Tampilan kartu | Minimalis — teks dengan warna suit (♠♣ hitam, ♥♦ merah) |
| Layout rekomendasi | Side panel kanan |
| Trigger rekomendasi | Otomatis setiap hand berubah |
| Bahasa UI | Bahasa Indonesia |
| Hand awal | 7 kartu |
| Discard pile | Auto dari hand + manual input buangan pemain lain |
| Input meld | Per grup (3+ kartu sekaligus) |
| Tech stack | Next.js + Zustand + pure TypeScript engine |
| Arsitektur | Pure client-side SPA (Opsi A) |

---

## 3. Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Engine:** Pure TypeScript functions (zero framework dependency)
- **Testing:** Jest (unit test engine modules)

---

## 4. Struktur Folder

```
src/
├── app/
│   └── page.tsx                    ← single page app
├── components/
│   ├── hand/
│   │   ├── HandArea.tsx            ← area kartu di tangan
│   │   ├── CardPicker.tsx          ← grid 52 kartu untuk input (modal)
│   │   └── CardChip.tsx            ← tampilan satu kartu (minimalis)
│   ├── discard/
│   │   └── DiscardPile.tsx         ← urutan kartu buangan
│   ├── melds/
│   │   └── MeldTable.tsx           ← grup meld di meja
│   └── recommendation/
│       └── RecommendationPanel.tsx ← side panel AI
├── engine/
│   ├── cards/
│   │   └── cardUtils.ts            ← helpers: parse, compare, format
│   ├── melds/
│   │   └── meldDetector.ts         ← detect sets, sequences, near-melds
│   ├── probability/
│   │   └── probabilityTracker.ts   ← remaining cards, completion %
│   ├── heuristics/
│   │   └── heuristicEvaluator.ts   ← card score formula
│   ├── recommendation/
│   │   └── recommendationEngine.ts ← main output: discard + combos
│   └── solver/
│       └── combinationSolver.ts    ← optimal meld allocation (backtracking)
├── store/
│   └── gameStore.ts                ← Zustand store, single source of truth
└── types/
    └── index.ts                    ← Card, Suit, Meld, Recommendation types
```

---

## 5. Tipe Data

```typescript
// types/index.ts

type Suit = "spade" | "heart" | "diamond" | "club"

type Card = {
  suit: Suit
  rank: number  // 1=A, 2-10, 11=J, 12=Q, 13=K
}

type Meld = {
  cards: Card[]
  type: "set" | "sequence"
}

type NearMeld = {
  cards: Card[]
  type: "near-set" | "near-sequence"
  neededCards: Card[]       // kartu yang dibutuhkan untuk complete
  completionProbability: number
}

type MeldAllocation = {
  completedMelds: Meld[]
  nearMelds: NearMeld[]
  deadCards: Card[]
}

type Recommendation = {
  discard: Card
  reasons: string[]           // dalam Bahasa Indonesia
  strongestCombos: Meld[]
  nearMelds: NearMeld[]
  riskyCards: Card[]
}

type GameContext = {
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  remainingCards: Card[]
  jokerRank: number | null
}

type GameSetup = {
  playerCount: number          // jumlah pemain (untuk track discard awal)
  jokerRank: number | null     // rank yang jadi wildcard (null sebelum ditentukan)
  jokerIndicator: Card | null  // kartu yang ditarik untuk menentukan joker
}
```

---

## 6. State Management (Zustand)

```typescript
// store/gameStore.ts

type GameState = {
  // game setup
  playerCount: number        // jumlah pemain (default 4)
  jokerRank: number | null   // rank yang jadi wildcard
  jokerIndicator: Card | null // kartu penentu joker (terpisah, bukan milik siapapun)
  gamePhase: "setup" | "playing"  // fase permainan

  // game state
  hand: Card[]           // max 7 kartu awal, bisa bertambah saat draw
  discardPile: Card[]    // urutan kartu buangan (auto + manual)
  visibleMelds: Card[][] // grup meld di meja, per grup
  recommendation: Recommendation | null

  // setup actions
  setPlayerCount: (count: number) => void
  setJokerIndicator: (card: Card) => void  // set kartu penentu + jokerRank
  addInitialDiscard: (card: Card) => void   // discard awal dari semua pemain
  startGame: () => void                     // transition ke phase "playing"

  // playing actions
  addToHand: (card: Card) => void
  removeFromHand: (card: Card) => void   // otomatis push ke discardPile
  addToDiscardPile: (card: Card) => void // kartu buangan pemain lain
  addMeldGroup: (cards: Card[]) => void
  removeMeldGroup: (index: number) => void
  resetGame: () => void
}
```

**Aturan validasi di store:**
- Kartu yang sama tidak bisa ada di dua tempat (hand, discard, visibleMelds, jokerIndicator harus mutually exclusive)
- Validasi duplikat sebelum add
- `removeFromHand` otomatis append ke `discardPile`
- `jokerIndicator` keluar dari pool kartu yang tersedia

---

## 7. Auto-Update Flow

```
User action (tambah/hapus kartu)
    ↓
Zustand store update
    ↓
useEffect subscribe di RecommendationPanel
    ↓
recommendationEngine.analyze(hand, discardPile, visibleMelds, jokerRank)
    ↓
Update recommendation state
    ↓
UI re-render (<200ms)
```

---

## 7.1 Game Setup Flow

```
Mulai Game Baru
    ↓
Input jumlah pemain (default 4)
    ↓
Input 7 kartu di tangan
    ↓
Input kartu discard awal dari semua pemain (termasuk user)
    ↓
Input kartu penentu joker (ditarik dari deck)
    ↓
jokerRank = rank kartu penentu
    ↓
gamePhase = "playing"
    ↓
Rekomendasi mulai aktif
```

---

## 8. Engine Modules

### 8.1 Card Utils (`engine/cards/cardUtils.ts`)

```typescript
parseCard(notation: string): Card        // "7S" → {suit:"spade", rank:7}
formatCard(card: Card): string           // {suit:"spade", rank:7} → "7♠"
cardEquals(a: Card, b: Card): boolean
getRankValue(card: Card): number         // untuk heuristic penalty
```

### 8.2 Meld Detector (`engine/melds/meldDetector.ts`)

```typescript
detectSets(hand: Card[], jokerRank: number | null): Meld[]
// Set: 3-4 kartu rank sama, suit berbeda
// Joker cards (matching jokerRank) dapat menggantikan kartu apapun dalam set

detectSequences(hand: Card[], jokerRank: number | null): Meld[]
// Sequence: 3+ kartu suit sama, rank berurutan
// Joker cards dapat mengisi gap dalam sequence

detectNearMelds(hand: Card[], jokerRank: number | null): NearMeld[]
// Near-set: 2 kartu rank sama (atau 1 kartu + 1 joker)
// Near-sequence: 2 kartu suit sama rank berurutan/gap 1 (atau 1 kartu + 1 joker)

isJoker(card: Card, jokerRank: number | null): boolean
// Cek apakah kartu adalah joker berdasarkan rank
```

**Joker handling di meld detection:**
- Kartu dengan rank === jokerRank bisa menggantikan kartu apapun
- Satu joker bisa masuk ke banyak kandidat meld (solver yang memutuskan alokasi optimal)
- Near-meld yang melibatkan joker punya completionProbability lebih tinggi

### 8.3 Combination Solver (`engine/solver/combinationSolver.ts`)

```typescript
solveOptimalMelds(hand: Card[], jokerRank: number | null): MeldAllocation
```

Menggunakan backtracking untuk menemukan alokasi meld optimal. Satu kartu bisa masuk ke beberapa kandidat kombinasi — solver memilih alokasi yang memaksimalkan jumlah kartu dalam completed melds.

**Joker allocation:** Joker cards sangat fleksibel — solver harus mempertimbangkan di mana joker paling berharga (melengkapi meld yang paling sulit dicapai tanpa joker).

### 8.4 Probability Tracker (`engine/probability/probabilityTracker.ts`)

```typescript
getRemainingCards(hand: Card[], discardPile: Card[], visibleMelds: Card[][], jokerIndicator: Card | null): Card[]
// Total kartu tersisa = 52 - hand - discard - visibleMelds - jokerIndicator

getCompletionProbability(neededCards: Card[], remaining: Card[]): number
// Probabilitas mendapat minimal satu kartu yang dibutuhkan
```

### 8.5 Heuristic Evaluator (`engine/heuristics/heuristicEvaluator.ts`)

```typescript
scoreCard(card: Card, context: GameContext): number
```

Formula dari PRD:
```
Card Score =
  (comboPotential    × 40)
+ (completionChance  × 30)
+ (flexibility       × 20)
- (deadRisk          × 25)
- (highPointPenalty  × 10)
```

- `comboPotential`: seberapa banyak meld yang melibatkan kartu ini
- `completionChance`: rata-rata probabilitas near-meld yang melibatkan kartu ini
- `flexibility`: jumlah kombinasi berbeda yang bisa dibentuk kartu ini
- `deadRisk`: 1.0 jika kartu terisolasi, 0.0 jika dalam meld
- `highPointPenalty`: nilai rank kartu (J=11, Q=12, K=13 diberi penalti lebih tinggi)

**Joker scoring:**
- Kartu joker (rank === jokerRank) mendapat comboPotential = 1.0 (maksimum)
- Kartu joker mendapat flexibility = 1.0 (bisa masuk kombinasi apapun)
- Kartu joker mendapat deadRisk = 0.0 (tidak pernah dead)
- Efektif: joker hampir tidak pernah direkomendasikan untuk dibuang

### 8.6 Recommendation Engine (`engine/recommendation/recommendationEngine.ts`)

```typescript
analyze(hand: Card[], discardPile: Card[], visibleMelds: Card[][], jokerRank: number | null, jokerIndicator: Card | null): Recommendation
```

**Prioritas rekomendasi (sesuai PRD):**
1. Pertahankan completed melds
2. Pertahankan kartu joker (hampir tidak pernah dibuang)
3. Pertahankan near-meld probabilitas tinggi
4. Buang kartu dead dengan nilai tinggi
5. Buang kartu low synergy
6. Minimasi penalti masa depan

**Output reasons dalam Bahasa Indonesia**, contoh:
- "Kartu terisolasi — tidak masuk kombinasi apapun"
- "Probabilitas sequence rendah (12%)"
- "Kartu bernilai tinggi — risiko poin besar"
- "Kartu joker — sangat fleksibel, jangan dibuang"

---

## 9. UI Layout

### Layout Utama (dua kolom)

```
┌──────────────────────┬─────────────────────────┐
│   KOLOM KIRI         │   KOLOM KANAN           │
│   (Input Area)       │   (Rekomendasi AI)      │
│                      │                         │
│  🃏 Kartu di Tangan  │  🤖 Rekomendasi         │
│  [7♠][K♥][3♦][9♣].. │                         │
│  [+ Tambah Kartu]    │  Buang: K♥              │
│                      │  ─────────────────      │
│  🗑 Tumpukan Buangan │  Alasan:                │
│  K♥ → 3♦ → 9♣ → ... │  • Kartu terisolasi     │
│  [+ Buangan Lain]    │  • Probabilitas rendah  │
│                      │  • Risiko poin tinggi   │
│  🎴 Meld di Meja     │                         │
│  [7♠ 7♦ 7♣]         │  Kombinasi Terkuat:     │
│  [5♠ 6♠ 7♠]         │  ✅ 7♠ 7♦ 7♣ (Set)     │
│  [+ Tambah Meld]     │  🔶 5♠ 6♠ (Near Seq)   │
│                      │                         │
│                      │  Kartu Berisiko:        │
│                      │  ⚠️ K♥  ⚠️ Q♦          │
└──────────────────────┴─────────────────────────┘
```

**Responsive:** di mobile (< 768px) stack vertikal — rekomendasi di bawah input area.

### CardPicker (modal)

- Grid 52 kartu dikelompokkan per suit
- Warna: ♥♦ merah, ♠♣ hitam/gelap
- Kartu yang sudah dipakai (hand/discard/meld) di-disable otomatis
- Tampilan minimalis: teks rank + suit symbol

### CardChip

- Komponen kecil: `7♠` dengan background subtle
- Warna teks sesuai suit
- Klik untuk remove (di hand area)

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Response time rekomendasi | < 200ms |
| Akurasi deteksi kombinasi | > 90% |
| Offline capable | Ya (pure client-side) |
| Deterministic | Ya (pure functions) |

---

## 11. Fase Pengembangan

### Phase 1 — Core Foundation
- Setup Next.js + Tailwind + Zustand
- Types definition (termasuk GameSetup, jokerRank)
- Card system + cardUtils (termasuk isJoker helper)
- Game setup flow UI (player count, initial discard, joker determination)
- HandArea + CardPicker + CardChip components
- Meld Detector (sets + sequences + near-melds + joker wildcard handling)
- Zustand store (hand management + game setup state)

### Phase 2 — Engine & Recommendation
- Combination Solver (backtracking)
- Heuristic Evaluator
- Recommendation Engine
- RecommendationPanel component
- Auto-update flow

### Phase 3 — Probability & Tracking
- Probability Tracker
- Discard Pile component + tracking
- Meld Table component
- Reasons generation (Bahasa Indonesia)

### Phase 4 — Polish
- Responsive layout
- CardPicker disable logic (mutual exclusion)
- Reset game
- Performance optimization
- Unit tests engine modules

---

## 12. Batasan MVP

- Tidak ada multiplayer
- Tidak ada camera/OCR
- Tidak ada user accounts
- Tidak ada machine learning atau LLM
- Tidak ada Monte Carlo simulation
- Joker system: **termasuk MVP** — rank-based wildcard yang ditentukan di awal permainan

---

## 13. Prinsip Engineering

**DO:**
- Pure functions untuk semua engine modules
- Engine bebas dari framework dependency
- Pisahkan UI dari game logic
- Deterministic heuristics

**DO NOT:**
- Gunakan LLM untuk core recommendation logic
- Couple engine ke frontend
- Over-engineer search system
- Mulai dengan machine learning
