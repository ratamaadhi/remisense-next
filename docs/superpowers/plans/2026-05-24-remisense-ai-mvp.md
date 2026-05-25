# RemiSense MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a pure client-side Remi card game recommendation assistant with joker support.

**Architecture:** Single-page Next.js app with Zustand state management. All engine logic runs client-side as pure TypeScript functions. UI is two-column layout (input left, recommendations right).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Zustand, Vitest

---

## File Structure

| File | Responsibility |
|------|---------------|
| src/types/index.ts | All type definitions (Card, Suit, Meld, etc.) |
| src/engine/cards/cardUtils.ts | Card helpers: parse, format, compare, isJoker |
| src/engine/melds/meldDetector.ts | Detect sets, sequences, near-melds (with joker) |
| src/engine/solver/combinationSolver.ts | Backtracking optimal meld allocation |
| src/engine/probability/probabilityTracker.ts | Remaining cards, completion probability |
| src/engine/heuristics/heuristicEvaluator.ts | Card scoring formula |
| src/engine/recommendation/recommendationEngine.ts | Main recommendation output |
| src/store/gameStore.ts | Zustand store (game setup + playing state) |
| src/components/hand/CardChip.tsx | Single card display (minimalist) |
| src/components/hand/CardPicker.tsx | 52-card grid modal for input |
| src/components/hand/HandArea.tsx | Hand cards area |
| src/components/discard/DiscardPile.tsx | Discard pile display |
| src/components/melds/MeldTable.tsx | Visible melds on table |
| src/components/recommendation/RecommendationPanel.tsx | AI recommendation side panel |
| src/components/setup/GameSetup.tsx | Game setup flow UI |
| src/app/page.tsx | Main page layout |
| src/engine/cards/cardUtils.test.ts | Tests for card utils |
| src/engine/melds/meldDetector.test.ts | Tests for meld detector |
| src/engine/solver/combinationSolver.test.ts | Tests for solver |
| src/engine/probability/probabilityTracker.test.ts | Tests for probability |
| src/engine/heuristics/heuristicEvaluator.test.ts | Tests for heuristic |
| src/engine/recommendation/recommendationEngine.test.ts | Tests for recommendation |

---

## Task 1: Project Setup

**Files:**
- Create: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, vitest.config.ts
- Create: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Expected: Next.js project scaffolded with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 4: Add test script to package.json**

Add to scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Verify setup**

Run:
```bash
npm run dev
```

Expected: App runs on localhost:3000 without errors.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project with Tailwind, Zustand, Vitest"
```

---

## Task 2: Type Definitions

**Files:**
- Create: src/types/index.ts
- Test: src/types/index.test.ts (type-check only)

- [ ] **Step 1: Create type definitions**

Create src/types/index.ts:

```typescript
export type Suit = "spade" | "heart" | "diamond" | "club"

export type Card = {
  suit: Suit
  rank: number // 1=A, 2-10, 11=J, 12=Q, 13=K
}

export type Meld = {
  cards: Card[]
  type: "set" | "sequence"
}

export type NearMeld = {
  cards: Card[]
  type: "near-set" | "near-sequence"
  neededCards: Card[]
  completionProbability: number
}

export type MeldAllocation = {
  completedMelds: Meld[]
  nearMelds: NearMeld[]
  deadCards: Card[]
}

export type Recommendation = {
  discard: Card
  reasons: string[]
  strongestCombos: Meld[]
  nearMelds: NearMeld[]
  riskyCards: Card[]
}

export type GameContext = {
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  remainingCards: Card[]
  jokerRank: number | null
}

export type GameSetup = {
  playerCount: number
  jokerRank: number | null
  jokerIndicator: Card | null
}

export type GamePhase = "setup" | "playing"
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: Card Utils

**Files:**
- Create: src/engine/cards/cardUtils.ts
- Test: src/engine/cards/cardUtils.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/cards/cardUtils.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { parseCard, formatCard, cardEquals, getRankValue, isJoker, SUITS, ALL_CARDS } from "./cardUtils"

describe("parseCard", () => {
  it("parses 7S to spade rank 7", () => {
    expect(parseCard("7S")).toEqual({ suit: "spade", rank: 7 })
  })
  it("parses KH to heart rank 13", () => {
    expect(parseCard("KH")).toEqual({ suit: "heart", rank: 13 })
  })
  it("parses AD to diamond rank 1", () => {
    expect(parseCard("AD")).toEqual({ suit: "diamond", rank: 1 })
  })
  it("parses 10C to club rank 10", () => {
    expect(parseCard("10C")).toEqual({ suit: "club", rank: 10 })
  })
})

describe("formatCard", () => {
  it("formats spade 7 to 7 with spade symbol", () => {
    expect(formatCard({ suit: "spade", rank: 7 })).toBe("7♠")
  })
  it("formats heart K to K with heart symbol", () => {
    expect(formatCard({ suit: "heart", rank: 13 })).toBe("K♥")
  })
  it("formats diamond A to A with diamond symbol", () => {
    expect(formatCard({ suit: "diamond", rank: 1 })).toBe("A♦")
  })
})

describe("cardEquals", () => {
  it("returns true for same card", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "spade", rank: 7 })).toBe(true)
  })
  it("returns false for different suit", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "heart", rank: 7 })).toBe(false)
  })
  it("returns false for different rank", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "spade", rank: 8 })).toBe(false)
  })
})

describe("getRankValue", () => {
  it("returns rank value for number cards", () => {
    expect(getRankValue({ suit: "spade", rank: 7 })).toBe(7)
  })
  it("returns 10 for J", () => {
    expect(getRankValue({ suit: "spade", rank: 11 })).toBe(10)
  })
  it("returns 10 for Q", () => {
    expect(getRankValue({ suit: "spade", rank: 12 })).toBe(10)
  })
  it("returns 10 for K", () => {
    expect(getRankValue({ suit: "spade", rank: 13 })).toBe(10)
  })
})

describe("isJoker", () => {
  it("returns true when card rank matches jokerRank", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, 7)).toBe(true)
  })
  it("returns false when card rank does not match", () => {
    expect(isJoker({ suit: "spade", rank: 8 }, 7)).toBe(false)
  })
  it("returns false when jokerRank is null", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, null)).toBe(false)
  })
})

describe("ALL_CARDS", () => {
  it("contains 52 cards", () => {
    expect(ALL_CARDS).toHaveLength(52)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/cards/cardUtils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement cardUtils**

Create src/engine/cards/cardUtils.ts:

```typescript
import type { Card, Suit } from "@/types"

export const SUITS: Suit[] = ["spade", "heart", "diamond", "club"]

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
}

const SUIT_CODES: Record<string, Suit> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
}

const RANK_NAMES: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
}

const RANK_CODES: Record<string, number> = {
  A: 1,
  J: 11,
  Q: 12,
  K: 13,
}

export const ALL_CARDS: Card[] = SUITS.flatMap((suit) =>
  Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1 }))
)

export function parseCard(notation: string): Card {
  const suitCode = notation.slice(-1)
  const rankStr = notation.slice(0, -1)
  const suit = SUIT_CODES[suitCode]
  const rank = RANK_CODES[rankStr] ?? parseInt(rankStr, 10)
  return { suit, rank }
}

export function formatCard(card: Card): string {
  const rankStr = RANK_NAMES[card.rank] ?? String(card.rank)
  return rankStr + SUIT_SYMBOLS[card.suit]
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function getRankValue(card: Card): number {
  if (card.rank >= 11) return 10
  return card.rank
}

export function isJoker(card: Card, jokerRank: number | null): boolean {
  if (jokerRank === null) return false
  return card.rank === jokerRank
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/cards/cardUtils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/cards/
git commit -m "feat: add card utils with parse, format, compare, isJoker"
```

---

## Task 4: Meld Detector

**Files:**
- Create: src/engine/melds/meldDetector.ts
- Test: src/engine/melds/meldDetector.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/melds/meldDetector.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { detectSets, detectSequences, detectNearMelds, isJoker } from "./meldDetector"
import type { Card } from "@/types"

describe("detectSets", () => {
  it("detects a set of 3 same-rank cards", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 3 },
    ]
    const sets = detectSets(hand, null)
    expect(sets).toHaveLength(1)
    expect(sets[0].cards).toHaveLength(3)
    expect(sets[0].type).toBe("set")
  })

  it("detects a set of 4 same-rank cards", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 9 },
      { suit: "heart", rank: 9 },
      { suit: "diamond", rank: 9 },
      { suit: "club", rank: 9 },
    ]
    const sets = detectSets(hand, null)
    expect(sets).toHaveLength(1)
    expect(sets[0].cards).toHaveLength(4)
  })

  it("returns empty when no sets exist", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 8 },
      { suit: "diamond", rank: 9 },
    ]
    const sets = detectSets(hand, null)
    expect(sets).toHaveLength(0)
  })

  it("detects set using joker as wildcard", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 3 }, // joker rank = 3
    ]
    const sets = detectSets(hand, 3)
    expect(sets).toHaveLength(1)
    expect(sets[0].cards).toHaveLength(3)
  })
})

describe("detectSequences", () => {
  it("detects a sequence of 3 consecutive same-suit cards", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 2 },
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].cards).toHaveLength(3)
    expect(seqs[0].type).toBe("sequence")
  })

  it("detects longer sequences", () => {
    const hand: Card[] = [
      { suit: "heart", rank: 3 },
      { suit: "heart", rank: 4 },
      { suit: "heart", rank: 5 },
      { suit: "heart", rank: 6 },
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs.length).toBeGreaterThanOrEqual(1)
    expect(seqs[0].cards.length).toBeGreaterThanOrEqual(4)
  })

  it("returns empty when no sequences exist", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "heart", rank: 5 },
      { suit: "diamond", rank: 9 },
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs).toHaveLength(0)
  })

  it("detects sequence using joker to fill gap", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "club", rank: 3 }, // joker rank = 3, fills gap as 6 spade
      { suit: "spade", rank: 7 },
    ]
    const seqs = detectSequences(hand, 3)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].cards).toHaveLength(3)
  })
})

describe("detectNearMelds", () => {
  it("detects near-set (2 cards same rank)", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 9 },
      { suit: "heart", rank: 9 },
      { suit: "diamond", rank: 3 },
    ]
    const nearMelds = detectNearMelds(hand, null)
    const nearSets = nearMelds.filter((m) => m.type === "near-set")
    expect(nearSets.length).toBeGreaterThanOrEqual(1)
  })

  it("detects near-sequence (2 consecutive same-suit cards)", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "heart", rank: 10 },
    ]
    const nearMelds = detectNearMelds(hand, null)
    const nearSeqs = nearMelds.filter((m) => m.type === "near-sequence")
    expect(nearSeqs.length).toBeGreaterThanOrEqual(1)
  })

  it("detects near-sequence with gap of 1 (e.g. 5,7 same suit)", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 10 },
    ]
    const nearMelds = detectNearMelds(hand, null)
    const nearSeqs = nearMelds.filter((m) => m.type === "near-sequence")
    expect(nearSeqs.length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/melds/meldDetector.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement meldDetector**

Create src/engine/melds/meldDetector.ts:

```typescript
import type { Card, Meld, NearMeld } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"

export function isJoker(card: Card, jokerRank: number | null): boolean {
  if (jokerRank === null) return false
  return card.rank === jokerRank
}

export function detectSets(hand: Card[], jokerRank: number | null): Meld[] {
  const melds: Meld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))
  const jokers = hand.filter((c) => isJoker(c, jokerRank))

  // Group non-joker cards by rank
  const byRank = new Map<number, Card[]>()
  for (const card of nonJokers) {
    const group = byRank.get(card.rank) || []
    group.push(card)
    byRank.set(card.rank, group)
  }

  // Check each rank group
  for (const [rank, cards] of byRank) {
    if (cards.length >= 3) {
      melds.push({ cards: [...cards], type: "set" })
    } else if (cards.length === 2 && jokers.length > 0) {
      // Use one joker to complete the set
      melds.push({ cards: [...cards, jokers[0]], type: "set" })
    }
  }

  return melds
}

export function detectSequences(hand: Card[], jokerRank: number | null): Meld[] {
  const melds: Meld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))
  const jokers = hand.filter((c) => isJoker(c, jokerRank))

  // Group non-joker cards by suit
  const bySuit = new Map<string, Card[]>()
  for (const card of nonJokers) {
    const group = bySuit.get(card.suit) || []
    group.push(card)
    bySuit.set(card.suit, group)
  }

  for (const [suit, cards] of bySuit) {
    const sorted = [...cards].sort((a, b) => a.rank - b.rank)
    let jokersAvailable = jokers.length

    // Find consecutive sequences (with joker gap filling)
    let i = 0
    while (i < sorted.length) {
      const sequence: Card[] = [sorted[i]]
      let currentRank = sorted[i].rank
      let j = i + 1
      let usedJokers = 0

      while (j < sorted.length || jokersAvailable - usedJokers > 0) {
        const nextCard = j < sorted.length ? sorted[j] : null

        if (nextCard && nextCard.rank === currentRank + 1) {
          sequence.push(nextCard)
          currentRank = nextCard.rank
          j++
        } else if (nextCard && nextCard.rank === currentRank + 2 && jokersAvailable - usedJokers > 0) {
          // Gap of 1, fill with joker
          sequence.push(jokers[usedJokers])
          usedJokers++
          currentRank = currentRank + 1
          // Don't advance j, check this card again
        } else {
          break
        }
      }

      if (sequence.length >= 3) {
        melds.push({ cards: [...sequence], type: "sequence" })
      }
      i = j > i + 1 ? j : i + 1
    }
  }

  return melds
}

export function detectNearMelds(hand: Card[], jokerRank: number | null): NearMeld[] {
  const nearMelds: NearMeld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))

  // Near-sets: 2 cards with same rank
  const byRank = new Map<number, Card[]>()
  for (const card of nonJokers) {
    const group = byRank.get(card.rank) || []
    group.push(card)
    byRank.set(card.rank, group)
  }

  for (const [rank, cards] of byRank) {
    if (cards.length === 2) {
      // Need one more card of same rank, different suit
      const usedSuits = cards.map((c) => c.suit)
      const neededCards: Card[] = (["spade", "heart", "diamond", "club"] as const)
        .filter((s) => !usedSuits.includes(s))
        .map((s) => ({ suit: s, rank }))

      nearMelds.push({
        cards: [...cards],
        type: "near-set",
        neededCards,
        completionProbability: 0, // calculated later by probability tracker
      })
    }
  }

  // Near-sequences: 2 consecutive same-suit cards or gap of 1
  const bySuit = new Map<string, Card[]>()
  for (const card of nonJokers) {
    const group = bySuit.get(card.suit) || []
    group.push(card)
    bySuit.set(card.suit, group)
  }

  for (const [suit, cards] of bySuit) {
    const sorted = [...cards].sort((a, b) => a.rank - b.rank)

    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i + 1].rank - sorted[i].rank

      if (diff === 1) {
        // Consecutive: need card before or after
        const neededCards: Card[] = []
        if (sorted[i].rank > 1) {
          neededCards.push({ suit: suit as any, rank: sorted[i].rank - 1 })
        }
        if (sorted[i + 1].rank < 13) {
          neededCards.push({ suit: suit as any, rank: sorted[i + 1].rank + 1 })
        }
        nearMelds.push({
          cards: [sorted[i], sorted[i + 1]],
          type: "near-sequence",
          neededCards,
          completionProbability: 0,
        })
      } else if (diff === 2) {
        // Gap of 1: need the middle card
        const neededCards: Card[] = [{ suit: suit as any, rank: sorted[i].rank + 1 }]
        nearMelds.push({
          cards: [sorted[i], sorted[i + 1]],
          type: "near-sequence",
          neededCards,
          completionProbability: 0,
        })
      }
    }
  }

  return nearMelds
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/melds/meldDetector.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/melds/
git commit -m "feat: add meld detector with joker wildcard support"
```

---

## Task 5: Combination Solver

**Files:**
- Create: src/engine/solver/combinationSolver.ts
- Test: src/engine/solver/combinationSolver.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/solver/combinationSolver.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { solveOptimalMelds } from "./combinationSolver"
import type { Card } from "@/types"

describe("solveOptimalMelds", () => {
  it("allocates a single set correctly", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 3 },
    ]
    const result = solveOptimalMelds(hand, null)
    expect(result.completedMelds).toHaveLength(1)
    expect(result.completedMelds[0].type).toBe("set")
    expect(result.deadCards).toHaveLength(1)
    expect(result.deadCards[0].rank).toBe(3)
  })

  it("allocates a single sequence correctly", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 10 },
    ]
    const result = solveOptimalMelds(hand, null)
    expect(result.completedMelds).toHaveLength(1)
    expect(result.completedMelds[0].type).toBe("sequence")
    expect(result.deadCards).toHaveLength(1)
  })

  it("maximizes cards in melds when overlap exists", () => {
    // 7S can be in set (7S,7H,7D) or sequence (5S,6S,7S)
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
    ]
    const result = solveOptimalMelds(hand, null)
    // Should find both: sequence 5S,6S,7S and... no, 7S can only be in one
    // Best allocation: either set(7S,7H,7D) leaving 5S,6S dead
    // or sequence(5S,6S,7S) leaving 7H,7D dead
    // Both use 3 cards, so either is valid
    const totalInMelds = result.completedMelds.reduce((sum, m) => sum + m.cards.length, 0)
    expect(totalInMelds).toBe(3)
    expect(result.deadCards).toHaveLength(2)
  })

  it("handles hand with no melds", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "heart", rank: 5 },
      { suit: "diamond", rank: 9 },
      { suit: "club", rank: 12 },
    ]
    const result = solveOptimalMelds(hand, null)
    expect(result.completedMelds).toHaveLength(0)
    expect(result.deadCards).toHaveLength(4)
  })

  it("uses joker to complete a meld", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 3 }, // joker rank = 3
      { suit: "club", rank: 10 },
    ]
    const result = solveOptimalMelds(hand, 3)
    expect(result.completedMelds).toHaveLength(1)
    expect(result.completedMelds[0].cards).toHaveLength(3)
    expect(result.deadCards).toHaveLength(1)
  })

  it("allocates joker to best position", () => {
    // Joker (rank 3) could complete set(7S,7H,joker) or sequence(5S,joker,7S)
    // Both valid, solver picks one that maximizes total cards in melds
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "club", rank: 3 }, // joker
      { suit: "diamond", rank: 12 },
    ]
    const result = solveOptimalMelds(hand, 3)
    expect(result.completedMelds).toHaveLength(1)
    expect(result.completedMelds[0].cards).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/solver/combinationSolver.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement combinationSolver**

Create src/engine/solver/combinationSolver.ts:

```typescript
import type { Card, Meld, NearMeld, MeldAllocation } from "@/types"
import { detectSets, detectSequences, detectNearMelds } from "@/engine/melds/meldDetector"
import { cardEquals } from "@/engine/cards/cardUtils"

export function solveOptimalMelds(hand: Card[], jokerRank: number | null): MeldAllocation {
  // Get all possible melds
  const allSets = detectSets(hand, jokerRank)
  const allSequences = detectSequences(hand, jokerRank)
  const allMelds = [...allSets, ...allSequences]

  // Backtracking to find optimal allocation
  let bestAllocation: Meld[] = []
  let bestCardCount = 0

  function backtrack(index: number, usedCards: Card[], currentMelds: Meld[]) {
    const currentCardCount = usedCards.length
    if (currentCardCount > bestCardCount) {
      bestCardCount = currentCardCount
      bestAllocation = [...currentMelds]
    }

    for (let i = index; i < allMelds.length; i++) {
      const meld = allMelds[i]
      // Check if any card in this meld is already used
      const hasConflict = meld.cards.some((card) =>
        usedCards.some((used) => cardEquals(card, used))
      )

      if (!hasConflict) {
        backtrack(
          i + 1,
          [...usedCards, ...meld.cards],
          [...currentMelds, meld]
        )
      }
    }
  }

  backtrack(0, [], [])

  // Determine dead cards (not in any completed meld)
  const usedInMelds = bestAllocation.flatMap((m) => m.cards)
  const deadCards = hand.filter(
    (card) => !usedInMelds.some((used) => cardEquals(card, used))
  )

  // Detect near-melds from dead cards
  const nearMelds = detectNearMelds(deadCards, jokerRank)

  return {
    completedMelds: bestAllocation,
    nearMelds,
    deadCards: deadCards.filter(
      (card) => !nearMelds.some((nm) => nm.cards.some((c) => cardEquals(c, card)))
    ),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/solver/combinationSolver.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/solver/
git commit -m "feat: add combination solver with backtracking and joker support"
```

---

## Task 6: Probability Tracker

**Files:**
- Create: src/engine/probability/probabilityTracker.ts
- Test: src/engine/probability/probabilityTracker.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/probability/probabilityTracker.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { getRemainingCards, getCompletionProbability } from "./probabilityTracker"
import type { Card } from "@/types"

describe("getRemainingCards", () => {
  it("returns 52 minus all known cards", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
    ]
    const discardPile: Card[] = [
      { suit: "diamond", rank: 3 },
    ]
    const visibleMelds: Card[][] = [
      [{ suit: "club", rank: 9 }, { suit: "spade", rank: 9 }, { suit: "heart", rank: 9 }],
    ]
    const jokerIndicator: Card | null = { suit: "diamond", rank: 5 }

    const remaining = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)
    // 52 - 2 (hand) - 1 (discard) - 3 (melds) - 1 (jokerIndicator) = 45
    expect(remaining).toHaveLength(45)
  })

  it("returns 52 when no cards are known", () => {
    const remaining = getRemainingCards([], [], [], null)
    expect(remaining).toHaveLength(52)
  })

  it("excludes jokerIndicator from remaining", () => {
    const jokerIndicator: Card = { suit: "heart", rank: 3 }
    const remaining = getRemainingCards([], [], [], jokerIndicator)
    expect(remaining).toHaveLength(51)
    expect(remaining.some((c) => c.suit === "heart" && c.rank === 3)).toBe(false)
  })
})

describe("getCompletionProbability", () => {
  it("returns probability based on needed cards in remaining pool", () => {
    const neededCards: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
    ]
    const remaining: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 3 },
      { suit: "club", rank: 10 },
    ]
    // 2 needed cards exist in 4 remaining = probability of drawing at least one
    // P(at least one) = 1 - P(none) = 1 - (2/4 * 1/3) = 1 - 1/6 ... 
    // Simpler: count of needed in remaining / total remaining
    const prob = getCompletionProbability(neededCards, remaining)
    expect(prob).toBeCloseTo(2 / 4, 2)
  })

  it("returns 0 when no needed cards are in remaining", () => {
    const neededCards: Card[] = [{ suit: "spade", rank: 7 }]
    const remaining: Card[] = [
      { suit: "heart", rank: 3 },
      { suit: "diamond", rank: 10 },
    ]
    const prob = getCompletionProbability(neededCards, remaining)
    expect(prob).toBe(0)
  })

  it("returns 1 when all remaining cards are needed", () => {
    const neededCards: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
    ]
    const remaining: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
    ]
    const prob = getCompletionProbability(neededCards, remaining)
    expect(prob).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/probability/probabilityTracker.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement probabilityTracker**

Create src/engine/probability/probabilityTracker.ts:

```typescript
import type { Card } from "@/types"
import { ALL_CARDS, cardEquals } from "@/engine/cards/cardUtils"

export function getRemainingCards(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerIndicator: Card | null
): Card[] {
  const knownCards: Card[] = [
    ...hand,
    ...discardPile,
    ...visibleMelds.flat(),
    ...(jokerIndicator ? [jokerIndicator] : []),
  ]

  return ALL_CARDS.filter(
    (card) => !knownCards.some((known) => cardEquals(card, known))
  )
}

export function getCompletionProbability(
  neededCards: Card[],
  remaining: Card[]
): number {
  if (remaining.length === 0) return 0

  const availableNeeded = neededCards.filter((needed) =>
    remaining.some((r) => cardEquals(r, needed))
  )

  return availableNeeded.length / remaining.length
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/probability/probabilityTracker.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/probability/
git commit -m "feat: add probability tracker for remaining cards and completion probability"
```

---

## Task 7: Heuristic Evaluator

**Files:**
- Create: src/engine/heuristics/heuristicEvaluator.ts
- Test: src/engine/heuristics/heuristicEvaluator.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/heuristics/heuristicEvaluator.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { scoreCard } from "./heuristicEvaluator"
import type { Card, GameContext } from "@/types"

const baseContext: GameContext = {
  hand: [
    { suit: "spade", rank: 7 },
    { suit: "heart", rank: 7 },
    { suit: "diamond", rank: 7 },
    { suit: "club", rank: 13 },
    { suit: "spade", rank: 5 },
    { suit: "spade", rank: 6 },
  ],
  discardPile: [],
  visibleMelds: [],
  remainingCards: [],
  jokerRank: null,
}

describe("scoreCard", () => {
  it("gives high score to card in a completed set", () => {
    const card: Card = { suit: "spade", rank: 7 }
    const score = scoreCard(card, baseContext)
    expect(score).toBeGreaterThan(50)
  })

  it("gives low score to isolated high card", () => {
    const card: Card = { suit: "club", rank: 13 }
    const score = scoreCard(card, baseContext)
    expect(score).toBeLessThan(20)
  })

  it("gives maximum score to joker card", () => {
    const contextWithJoker: GameContext = {
      ...baseContext,
      jokerRank: 5,
    }
    const jokerCard: Card = { suit: "spade", rank: 5 }
    const score = scoreCard(jokerCard, contextWithJoker)
    expect(score).toBeGreaterThan(80)
  })

  it("gives higher score to card in near-meld than isolated card", () => {
    const nearMeldCard: Card = { suit: "spade", rank: 5 } // part of 5S,6S near-seq
    const isolatedCard: Card = { suit: "club", rank: 13 }
    const scoreNear = scoreCard(nearMeldCard, baseContext)
    const scoreIsolated = scoreCard(isolatedCard, baseContext)
    expect(scoreNear).toBeGreaterThan(scoreIsolated)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/heuristics/heuristicEvaluator.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement heuristicEvaluator**

Create src/engine/heuristics/heuristicEvaluator.ts:

```typescript
import type { Card, GameContext } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"
import { isJoker, detectSets, detectSequences, detectNearMelds } from "@/engine/melds/meldDetector"

export function scoreCard(card: Card, context: GameContext): number {
  const { hand, jokerRank } = context

  // Joker cards get maximum score
  if (isJoker(card, jokerRank)) {
    return 100 // comboPotential=1, flexibility=1, deadRisk=0, no penalty
  }

  const allSets = detectSets(hand, jokerRank)
  const allSequences = detectSequences(hand, jokerRank)
  const allMelds = [...allSets, ...allSequences]
  const nearMelds = detectNearMelds(hand, jokerRank)

  // comboPotential: fraction of melds this card participates in (0-1)
  const meldsWithCard = allMelds.filter((m) =>
    m.cards.some((c) => cardEquals(c, card))
  )
  const comboPotential = allMelds.length > 0
    ? Math.min(meldsWithCard.length / allMelds.length, 1.0)
    : 0

  // completionChance: average probability of near-melds involving this card (0-1)
  const nearMeldsWithCard = nearMelds.filter((nm) =>
    nm.cards.some((c) => cardEquals(c, card))
  )
  const completionChance = nearMeldsWithCard.length > 0
    ? nearMeldsWithCard.reduce((sum, nm) => sum + nm.completionProbability, 0) / nearMeldsWithCard.length
    : 0

  // flexibility: number of different combos this card can form, normalized (0-1)
  const totalCombos = meldsWithCard.length + nearMeldsWithCard.length
  const flexibility = Math.min(totalCombos / 4, 1.0) // cap at 4 combos = 1.0

  // deadRisk: 1.0 if isolated, 0.0 if in meld or near-meld
  const isInMeld = meldsWithCard.length > 0
  const isInNearMeld = nearMeldsWithCard.length > 0
  const deadRisk = isInMeld ? 0 : isInNearMeld ? 0.3 : 1.0

  // highPointPenalty: normalized rank value (0-1), higher for face cards
  const highPointPenalty = card.rank >= 10 ? card.rank / 13 : card.rank / 26

  // Formula from PRD
  const score =
    (comboPotential * 40) +
    (completionChance * 30) +
    (flexibility * 20) -
    (deadRisk * 25) -
    (highPointPenalty * 10)

  return Math.max(0, Math.min(100, score))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/heuristics/heuristicEvaluator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/heuristics/
git commit -m "feat: add heuristic evaluator with card scoring formula"
```

---

## Task 8: Recommendation Engine

**Files:**
- Create: src/engine/recommendation/recommendationEngine.ts
- Test: src/engine/recommendation/recommendationEngine.test.ts

- [ ] **Step 1: Write failing tests**

Create src/engine/recommendation/recommendationEngine.test.ts:

```typescript
import { describe, it, expect } from "vitest"
import { analyze } from "./recommendationEngine"
import type { Card } from "@/types"

describe("analyze", () => {
  it("recommends discarding isolated high card", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 13 }, // isolated K
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "heart", rank: 2 },
    ]
    const result = analyze(hand, [], [], null, null)
    expect(result.discard.rank).toBe(13) // K should be discarded
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it("never recommends discarding a joker", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 3 }, // joker
      { suit: "heart", rank: 3 }, // joker
      { suit: "diamond", rank: 3 }, // joker
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 12 },
      { suit: "heart", rank: 11 },
      { suit: "diamond", rank: 10 },
    ]
    const result = analyze(hand, [], [], 3, null)
    expect(result.discard.rank).not.toBe(3)
  })

  it("returns strongest combos", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "heart", rank: 2 },
    ]
    const result = analyze(hand, [], [], null, null)
    expect(result.strongestCombos.length).toBeGreaterThan(0)
  })

  it("identifies risky cards", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "heart", rank: 5 },
      { suit: "diamond", rank: 9 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 12 },
      { suit: "heart", rank: 11 },
      { suit: "diamond", rank: 10 },
    ]
    const result = analyze(hand, [], [], null, null)
    expect(result.riskyCards.length).toBeGreaterThan(0)
    // High cards should be risky
    expect(result.riskyCards.some((c) => c.rank >= 10)).toBe(true)
  })

  it("provides reasons in Indonesian", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "heart", rank: 2 },
    ]
    const result = analyze(hand, [], [], null, null)
    // Check that reasons contain Indonesian text
    const hasIndonesian = result.reasons.some(
      (r) => r.includes("Kartu") || r.includes("terisolasi") || r.includes("tinggi") || r.includes("rendah")
    )
    expect(hasIndonesian).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/engine/recommendation/recommendationEngine.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement recommendationEngine**

Create src/engine/recommendation/recommendationEngine.ts:

```typescript
import type { Card, Recommendation } from "@/types"
import { cardEquals, formatCard } from "@/engine/cards/cardUtils"
import { isJoker, detectNearMelds } from "@/engine/melds/meldDetector"
import { solveOptimalMelds } from "@/engine/solver/combinationSolver"
import { getRemainingCards, getCompletionProbability } from "@/engine/probability/probabilityTracker"
import { scoreCard } from "@/engine/heuristics/heuristicEvaluator"

export function analyze(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerRank: number | null,
  jokerIndicator: Card | null
): Recommendation {
  if (hand.length === 0) {
    return {
      discard: { suit: "spade", rank: 1 },
      reasons: ["Tidak ada kartu di tangan"],
      strongestCombos: [],
      nearMelds: [],
      riskyCards: [],
    }
  }

  // Get remaining cards for probability calculation
  const remaining = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)

  // Solve optimal meld allocation
  const allocation = solveOptimalMelds(hand, jokerRank)

  // Update near-meld probabilities
  const nearMelds = detectNearMelds(hand, jokerRank).map((nm) => ({
    ...nm,
    completionProbability: getCompletionProbability(nm.neededCards, remaining),
  }))

  // Build game context for scoring
  const context = {
    hand,
    discardPile,
    visibleMelds,
    remainingCards: remaining,
    jokerRank,
  }

  // Score each card (lower score = better candidate for discard)
  const cardScores = hand.map((card) => ({
    card,
    score: scoreCard(card, context),
  }))

  // Sort by score ascending (lowest score = best discard candidate)
  cardScores.sort((a, b) => a.score - b.score)

  // Pick discard: lowest score card that is NOT a joker
  const discardCandidate = cardScores.find((cs) => !isJoker(cs.card, jokerRank))
  const discard = discardCandidate ? discardCandidate.card : cardScores[0].card

  // Generate reasons in Indonesian
  const reasons = generateReasons(discard, context, allocation, nearMelds)

  // Identify risky cards (high rank, isolated)
  const riskyCards = hand.filter((card) => {
    if (isJoker(card, jokerRank)) return false
    const score = scoreCard(card, context)
    return score < 30 && card.rank >= 10
  })

  return {
    discard,
    reasons,
    strongestCombos: allocation.completedMelds,
    nearMelds,
    riskyCards,
  }
}

function generateReasons(
  discard: Card,
  context: any,
  allocation: any,
  nearMelds: any[]
): string[] {
  const reasons: string[] = []
  const { jokerRank } = context

  // Check if isolated
  const isInMeld = allocation.completedMelds.some((m: any) =>
    m.cards.some((c: Card) => cardEquals(c, discard))
  )
  const isInNearMeld = nearMelds.some((nm: any) =>
    nm.cards.some((c: Card) => cardEquals(c, discard))
  )

  if (!isInMeld && !isInNearMeld) {
    reasons.push("Kartu terisolasi — tidak masuk kombinasi apapun")
  }

  // Check high point penalty
  if (discard.rank >= 10) {
    reasons.push("Kartu bernilai tinggi — risiko poin besar jika kalah")
  }

  // Check low completion probability
  if (isInNearMeld) {
    const relevantNearMelds = nearMelds.filter((nm: any) =>
      nm.cards.some((c: Card) => cardEquals(c, discard))
    )
    const avgProb = relevantNearMelds.reduce((sum: number, nm: any) => sum + nm.completionProbability, 0) / relevantNearMelds.length
    if (avgProb < 0.15) {
      reasons.push("Probabilitas melengkapi kombinasi rendah (" + Math.round(avgProb * 100) + "%)")
    }
  }

  // Check low synergy
  const score = scoreCard(discard, context)
  if (score < 20) {
    reasons.push("Sinergi rendah dengan kartu lain di tangan")
  }

  if (reasons.length === 0) {
    reasons.push("Kartu dengan nilai strategis terendah di tangan")
  }

  return reasons
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/engine/recommendation/recommendationEngine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/recommendation/
git commit -m "feat: add recommendation engine with Indonesian reasons"
```

---

## Task 9: Zustand Store

**Files:**
- Create: src/store/gameStore.ts
- Test: src/store/gameStore.test.ts

- [ ] **Step 1: Write failing tests**

Create src/store/gameStore.test.ts:

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { useGameStore } from "./gameStore"

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe("setup phase", () => {
    it("starts in setup phase", () => {
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe("setup")
    })

    it("sets player count", () => {
      useGameStore.getState().setPlayerCount(3)
      expect(useGameStore.getState().playerCount).toBe(3)
    })

    it("sets joker indicator and derives jokerRank", () => {
      useGameStore.getState().setJokerIndicator({ suit: "heart", rank: 7 })
      const state = useGameStore.getState()
      expect(state.jokerIndicator).toEqual({ suit: "heart", rank: 7 })
      expect(state.jokerRank).toBe(7)
    })

    it("adds initial discard cards", () => {
      useGameStore.getState().addInitialDiscard({ suit: "spade", rank: 3 })
      useGameStore.getState().addInitialDiscard({ suit: "heart", rank: 10 })
      expect(useGameStore.getState().discardPile).toHaveLength(2)
    })

    it("transitions to playing phase", () => {
      useGameStore.getState().startGame()
      expect(useGameStore.getState().gamePhase).toBe("playing")
    })
  })

  describe("playing phase", () => {
    beforeEach(() => {
      useGameStore.getState().startGame()
    })

    it("adds card to hand", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(1)
    })

    it("prevents duplicate card in hand", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(1)
    })

    it("removes card from hand and adds to discard pile", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().removeFromHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(0)
      expect(useGameStore.getState().discardPile).toContainEqual({ suit: "spade", rank: 7 })
    })

    it("adds card to discard pile (other player discard)", () => {
      useGameStore.getState().addToDiscardPile({ suit: "heart", rank: 10 })
      expect(useGameStore.getState().discardPile).toContainEqual({ suit: "heart", rank: 10 })
    })

    it("prevents adding card already in hand to discard", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().addToDiscardPile({ suit: "spade", rank: 7 })
      // Should not add duplicate
      expect(useGameStore.getState().discardPile).not.toContainEqual({ suit: "spade", rank: 7 })
    })

    it("adds meld group", () => {
      const meld = [
        { suit: "spade" as const, rank: 9 },
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      expect(useGameStore.getState().visibleMelds).toHaveLength(1)
      expect(useGameStore.getState().visibleMelds[0]).toHaveLength(3)
    })

    it("removes meld group by index", () => {
      const meld = [
        { suit: "spade" as const, rank: 9 },
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      useGameStore.getState().removeMeldGroup(0)
      expect(useGameStore.getState().visibleMelds).toHaveLength(0)
    })
  })

  describe("resetGame", () => {
    it("resets all state to initial values", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().setJokerIndicator({ suit: "heart", rank: 3 })
      useGameStore.getState().resetGame()
      const state = useGameStore.getState()
      expect(state.hand).toHaveLength(0)
      expect(state.discardPile).toHaveLength(0)
      expect(state.visibleMelds).toHaveLength(0)
      expect(state.jokerRank).toBeNull()
      expect(state.jokerIndicator).toBeNull()
      expect(state.gamePhase).toBe("setup")
      expect(state.recommendation).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/store/gameStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement gameStore**

Create src/store/gameStore.ts:

```typescript
import { create } from "zustand"
import type { Card, Recommendation, GamePhase } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"

type GameState = {
  // setup
  playerCount: number
  jokerRank: number | null
  jokerIndicator: Card | null
  gamePhase: GamePhase

  // game state
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  recommendation: Recommendation | null

  // setup actions
  setPlayerCount: (count: number) => void
  setJokerIndicator: (card: Card) => void
  addInitialDiscard: (card: Card) => void
  startGame: () => void

  // playing actions
  addToHand: (card: Card) => void
  removeFromHand: (card: Card) => void
  addToDiscardPile: (card: Card) => void
  addMeldGroup: (cards: Card[]) => void
  removeMeldGroup: (index: number) => void
  setRecommendation: (rec: Recommendation | null) => void
  resetGame: () => void
}

function isCardUsed(card: Card, state: Pick<GameState, "hand" | "discardPile" | "visibleMelds" | "jokerIndicator">): boolean {
  const allUsed = [
    ...state.hand,
    ...state.discardPile,
    ...state.visibleMelds.flat(),
    ...(state.jokerIndicator ? [state.jokerIndicator] : []),
  ]
  return allUsed.some((c) => cardEquals(c, card))
}

const initialState = {
  playerCount: 4,
  jokerRank: null,
  jokerIndicator: null,
  gamePhase: "setup" as GamePhase,
  hand: [],
  discardPile: [],
  visibleMelds: [],
  recommendation: null,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setPlayerCount: (count) => set({ playerCount: count }),

  setJokerIndicator: (card) => set({
    jokerIndicator: card,
    jokerRank: card.rank,
  }),

  addInitialDiscard: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ discardPile: [...state.discardPile, card] })
  },

  startGame: () => set({ gamePhase: "playing" }),

  addToHand: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ hand: [...state.hand, card] })
  },

  removeFromHand: (card) => {
    const state = get()
    const newHand = state.hand.filter((c) => !cardEquals(c, card))
    set({
      hand: newHand,
      discardPile: [...state.discardPile, card],
    })
  },

  addToDiscardPile: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ discardPile: [...state.discardPile, card] })
  },

  addMeldGroup: (cards) => {
    const state = get()
    // Validate no card is already used
    const anyUsed = cards.some((card) => isCardUsed(card, state))
    if (anyUsed) return
    set({ visibleMelds: [...state.visibleMelds, cards] })
  },

  removeMeldGroup: (index) => {
    const state = get()
    const newMelds = state.visibleMelds.filter((_, i) => i !== index)
    set({ visibleMelds: newMelds })
  },

  setRecommendation: (rec) => set({ recommendation: rec }),

  resetGame: () => set({ ...initialState }),
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run src/store/gameStore.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand game store with setup and playing phases"
```

---

## Task 10: CardChip Component

**Files:**
- Create: src/components/hand/CardChip.tsx

- [ ] **Step 1: Create CardChip component**

Create src/components/hand/CardChip.tsx:

```tsx
"use client"

import type { Card } from "@/types"
import { formatCard } from "@/engine/cards/cardUtils"
import { isJoker } from "@/engine/melds/meldDetector"

type CardChipProps = {
  card: Card
  jokerRank?: number | null
  onClick?: () => void
  disabled?: boolean
  highlighted?: boolean
  variant?: "default" | "danger" | "success"
}

export function CardChip({
  card,
  jokerRank = null,
  onClick,
  disabled = false,
  highlighted = false,
  variant = "default",
}: CardChipProps) {
  const isRed = card.suit === "heart" || card.suit === "diamond"
  const isWild = isJoker(card, jokerRank)

  const baseClasses = "inline-flex items-center px-2 py-1 rounded text-sm font-mono font-bold border cursor-pointer select-none transition-all"

  const colorClasses = isWild
    ? "text-purple-700 border-purple-300 bg-purple-50"
    : isRed
      ? "text-red-600 border-red-200 bg-white"
      : "text-gray-900 border-gray-300 bg-white"

  const variantClasses = {
    default: "",
    danger: "ring-2 ring-orange-400 bg-orange-50",
    success: "ring-2 ring-green-400 bg-green-50",
  }

  const disabledClasses = disabled
    ? "opacity-40 cursor-not-allowed"
    : "hover:shadow-md hover:scale-105"

  const highlightClasses = highlighted ? "ring-2 ring-blue-400" : ""

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses} ${variantClasses[variant]} ${disabledClasses} ${highlightClasses}`}
      title={isWild ? "Joker" : formatCard(card)}
    >
      {formatCard(card)}
      {isWild && <span className="ml-1 text-xs">★</span>}
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hand/CardChip.tsx
git commit -m "feat: add CardChip component with suit colors and joker indicator"
```

---

## Task 11: CardPicker Component

**Files:**
- Create: src/components/hand/CardPicker.tsx

- [ ] **Step 1: Create CardPicker component**

Create src/components/hand/CardPicker.tsx:

```tsx
"use client"

import { useState } from "react"
import type { Card, Suit } from "@/types"
import { ALL_CARDS, formatCard, cardEquals } from "@/engine/cards/cardUtils"
import { useGameStore } from "@/store/gameStore"

type CardPickerProps = {
  onSelect: (card: Card) => void
  onClose: () => void
  multiSelect?: boolean
  onMultiSelect?: (cards: Card[]) => void
}

const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"]
const SUIT_LABELS: Record<Suit, string> = {
  spade: "♠ Sekop",
  heart: "♥ Hati",
  diamond: "♦ Wajik",
  club: "♣ Keriting",
}

export function CardPicker({ onSelect, onClose, multiSelect = false, onMultiSelect }: CardPickerProps) {
  const { hand, discardPile, visibleMelds, jokerIndicator } = useGameStore()
  const [selected, setSelected] = useState<Card[]>([])

  // All cards that are already used somewhere
  const usedCards: Card[] = [
    ...hand,
    ...discardPile,
    ...visibleMelds.flat(),
    ...(jokerIndicator ? [jokerIndicator] : []),
  ]

  function isUsed(card: Card): boolean {
    return usedCards.some((c) => cardEquals(c, card))
  }

  function handleCardClick(card: Card) {
    if (isUsed(card)) return

    if (multiSelect) {
      const alreadySelected = selected.some((s) => cardEquals(s, card))
      if (alreadySelected) {
        setSelected(selected.filter((s) => !cardEquals(s, card)))
      } else {
        setSelected([...selected, card])
      }
    } else {
      onSelect(card)
      onClose()
    }
  }

  function handleConfirmMulti() {
    if (onMultiSelect && selected.length >= 3) {
      onMultiSelect(selected)
      onClose()
    }
  }

  function isSelected(card: Card): boolean {
    return selected.some((s) => cardEquals(s, card))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Pilih Kartu</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {SUIT_ORDER.map((suit) => {
          const isRed = suit === "heart" || suit === "diamond"
          return (
            <div key={suit} className="mb-3">
              <div className={`text-sm font-medium mb-1 ${isRed ? "text-red-600" : "text-gray-800"}`}>
                {SUIT_LABELS[suit]}
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 13 }, (_, i) => i + 1).map((rank) => {
                  const card: Card = { suit, rank }
                  const used = isUsed(card)
                  const sel = isSelected(card)
                  const rankLabel = rank === 1 ? "A" : rank === 11 ? "J" : rank === 12 ? "Q" : rank === 13 ? "K" : String(rank)

                  return (
                    <button
                      key={rank}
                      onClick={() => handleCardClick(card)}
                      disabled={used}
                      className={`
                        w-8 h-10 text-xs font-mono font-bold rounded border
                        ${used ? "opacity-30 cursor-not-allowed bg-gray-100 border-gray-200" : ""}
                        ${!used && !sel ? (isRed ? "text-red-600 border-red-200 hover:bg-red-50" : "text-gray-900 border-gray-300 hover:bg-gray-50") : ""}
                        ${sel ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300" : ""}
                        transition-all
                      `}
                    >
                      {rankLabel}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {multiSelect && (
          <div className="mt-4 flex justify-between items-center border-t pt-3">
            <span className="text-sm text-gray-600">
              {selected.length} kartu dipilih {selected.length < 3 && "(min. 3)"}
            </span>
            <button
              onClick={handleConfirmMulti}
              disabled={selected.length < 3}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Konfirmasi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hand/CardPicker.tsx
git commit -m "feat: add CardPicker modal with suit-grouped grid and disable logic"
```

---

## Task 12: HandArea Component

**Files:**
- Create: src/components/hand/HandArea.tsx

- [ ] **Step 1: Create HandArea component**

Create src/components/hand/HandArea.tsx:

```tsx
"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "./CardChip"
import { CardPicker } from "./CardPicker"
import type { Card } from "@/types"

export function HandArea() {
  const { hand, jokerRank, addToHand, removeFromHand } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  function handleAddCard(card: Card) {
    addToHand(card)
  }

  function handleRemoveCard(card: Card) {
    removeFromHand(card)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Kartu di Tangan ({hand.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {hand.length === 0 && (
          <span className="text-sm text-gray-400">Belum ada kartu</span>
        )}
        {hand.map((card, i) => (
          <CardChip
            key={`${card.suit}-${card.rank}`}
            card={card}
            jokerRank={jokerRank}
            onClick={() => handleRemoveCard(card)}
          />
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Tambah Kartu
      </button>

      {showPicker && (
        <CardPicker
          onSelect={handleAddCard}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hand/HandArea.tsx
git commit -m "feat: add HandArea component with card add/remove"
```

---

## Task 13: DiscardPile Component

**Files:**
- Create: src/components/discard/DiscardPile.tsx

- [ ] **Step 1: Create DiscardPile component**

Create src/components/discard/DiscardPile.tsx:

```tsx
"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import type { Card } from "@/types"

export function DiscardPile() {
  const { discardPile, jokerRank, addToDiscardPile } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  function handleAddDiscard(card: Card) {
    addToDiscardPile(card)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Tumpukan Buangan ({discardPile.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-1 min-h-[40px]">
        {discardPile.length === 0 && (
          <span className="text-sm text-gray-400">Belum ada kartu buangan</span>
        )}
        {discardPile.map((card, i) => (
          <span key={`${card.suit}-${card.rank}-${i}`} className="flex items-center">
            <CardChip card={card} jokerRank={jokerRank} disabled />
            {i < discardPile.length - 1 && (
              <span className="mx-0.5 text-gray-300 text-xs">→</span>
            )}
          </span>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Buangan Pemain Lain
      </button>

      {showPicker && (
        <CardPicker
          onSelect={handleAddDiscard}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/discard/DiscardPile.tsx
git commit -m "feat: add DiscardPile component with other player discard input"
```

---

## Task 14: MeldTable Component

**Files:**
- Create: src/components/melds/MeldTable.tsx

- [ ] **Step 1: Create MeldTable component**

Create src/components/melds/MeldTable.tsx:

```tsx
"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import type { Card } from "@/types"

export function MeldTable() {
  const { visibleMelds, jokerRank, addMeldGroup, removeMeldGroup } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  function handleAddMeld(cards: Card[]) {
    addMeldGroup(cards)
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Meld di Meja ({visibleMelds.length})
        </h2>
      </div>

      <div className="space-y-2 min-h-[40px]">
        {visibleMelds.length === 0 && (
          <span className="text-sm text-gray-400">Belum ada meld di meja</span>
        )}
        {visibleMelds.map((meld, i) => (
          <div key={i} className="flex items-center gap-1 p-2 bg-gray-50 rounded">
            {meld.map((card, j) => (
              <CardChip key={`${card.suit}-${card.rank}`} card={card} jokerRank={jokerRank} disabled />
            ))}
            <button
              onClick={() => removeMeldGroup(i)}
              className="ml-2 text-red-400 hover:text-red-600 text-sm"
              title="Hapus meld"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Tambah Grup Meld
      </button>

      {showPicker && (
        <CardPicker
          onSelect={() => {}}
          onClose={() => setShowPicker(false)}
          multiSelect={true}
          onMultiSelect={handleAddMeld}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/melds/MeldTable.tsx
git commit -m "feat: add MeldTable component with multi-select card picker"
```

---

## Task 15: RecommendationPanel Component

**Files:**
- Create: src/components/recommendation/RecommendationPanel.tsx

- [ ] **Step 1: Create RecommendationPanel component**

Create src/components/recommendation/RecommendationPanel.tsx:

```tsx
"use client"

import { useEffect } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { analyze } from "@/engine/recommendation/recommendationEngine"
import { formatCard } from "@/engine/cards/cardUtils"

export function RecommendationPanel() {
  const {
    hand,
    discardPile,
    visibleMelds,
    jokerRank,
    jokerIndicator,
    gamePhase,
    recommendation,
    setRecommendation,
  } = useGameStore()

  useEffect(() => {
    if (gamePhase !== "playing" || hand.length === 0) {
      setRecommendation(null)
      return
    }

    const result = analyze(hand, discardPile, visibleMelds, jokerRank, jokerIndicator)
    setRecommendation(result)
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, gamePhase])

  if (gamePhase !== "playing") {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Rekomendasi</h2>
        <p className="text-sm text-gray-400">Selesaikan setup permainan untuk melihat rekomendasi.</p>
      </div>
    )
  }

  if (!recommendation || hand.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Rekomendasi</h2>
        <p className="text-sm text-gray-400">Tambahkan kartu ke tangan untuk melihat rekomendasi.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Rekomendasi</h2>

      {/* Discard suggestion */}
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <div className="text-sm font-medium text-red-800 mb-1">Buang:</div>
        <CardChip card={recommendation.discard} jokerRank={jokerRank} variant="danger" />
        <div className="mt-2 space-y-1">
          {recommendation.reasons.map((reason, i) => (
            <div key={i} className="text-xs text-red-700 flex items-start gap-1">
              <span>•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strongest combos */}
      {recommendation.strongestCombos.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Kombinasi Terkuat:</div>
          <div className="space-y-1">
            {recommendation.strongestCombos.map((combo, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="text-green-600">✓</span>
                {combo.cards.map((card, j) => (
                  <CardChip key={`${card.suit}-${card.rank}`} card={card} jokerRank={jokerRank} variant="success" />
                ))}
                <span className="text-gray-500 ml-1">({combo.type === "set" ? "Set" : "Sequence"})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Near melds */}
      {recommendation.nearMelds.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Hampir Lengkap:</div>
          <div className="space-y-1">
            {recommendation.nearMelds.map((nm, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="text-yellow-600">◆</span>
                {nm.cards.map((card, j) => (
                  <CardChip key={`${card.suit}-${card.rank}`} card={card} jokerRank={jokerRank} />
                ))}
                <span className="text-gray-500 ml-1">
                  ({Math.round(nm.completionProbability * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risky cards */}
      {recommendation.riskyCards.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Kartu Berisiko:</div>
          <div className="flex flex-wrap gap-1">
            {recommendation.riskyCards.map((card, i) => (
              <CardChip key={`${card.suit}-${card.rank}`} card={card} jokerRank={jokerRank} variant="danger" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/recommendation/RecommendationPanel.tsx
git commit -m "feat: add RecommendationPanel with auto-update on hand change"
```

---

## Task 16: GameSetup Component

**Files:**
- Create: src/components/setup/GameSetup.tsx

- [ ] **Step 1: Create GameSetup component**

Create src/components/setup/GameSetup.tsx:

```tsx
"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardPicker } from "@/components/hand/CardPicker"
import { CardChip } from "@/components/hand/CardChip"
import { formatCard } from "@/engine/cards/cardUtils"
import type { Card } from "@/types"

type SetupStep = "playerCount" | "hand" | "initialDiscard" | "joker" | "done"

export function GameSetup() {
  const {
    playerCount,
    hand,
    discardPile,
    jokerIndicator,
    jokerRank,
    setPlayerCount,
    addToHand,
    addInitialDiscard,
    setJokerIndicator,
    startGame,
  } = useGameStore()

  const [step, setStep] = useState<SetupStep>("playerCount")
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<"hand" | "discard" | "joker">("hand")

  function handlePlayerCount(count: number) {
    setPlayerCount(count)
    setStep("hand")
  }

  function openPicker(target: "hand" | "discard" | "joker") {
    setPickerTarget(target)
    setShowPicker(true)
  }

  function handlePickerSelect(card: Card) {
    if (pickerTarget === "hand") {
      addToHand(card)
    } else if (pickerTarget === "discard") {
      addInitialDiscard(card)
    } else if (pickerTarget === "joker") {
      setJokerIndicator(card)
      setStep("done")
    }
  }

  function handleStartGame() {
    startGame()
  }

  return (
    <div className="border rounded-lg p-6 bg-white max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Setup Permainan</h2>

      {/* Step 1: Player Count */}
      {step === "playerCount" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Berapa jumlah pemain?</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => handlePlayerCount(n)}
                className="w-10 h-10 rounded border border-gray-300 hover:border-blue-400 hover:bg-blue-50 font-medium"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Hand Input */}
      {step === "hand" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Masukkan 7 kartu di tangan Anda ({hand.length}/7)
          </p>
          <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
            {hand.map((card) => (
              <CardChip key={`${card.suit}-${card.rank}`} card={card} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPicker("hand")}
              disabled={hand.length >= 7}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Tambah Kartu
            </button>
            {hand.length >= 7 && (
              <button
                onClick={() => setStep("initialDiscard")}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lanjut
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Initial Discard */}
      {step === "initialDiscard" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Masukkan kartu buangan awal dari semua pemain ({discardPile.length}/{playerCount})
          </p>
          <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
            {discardPile.map((card, i) => (
              <CardChip key={`${card.suit}-${card.rank}-${i}`} card={card} disabled />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPicker("discard")}
              disabled={discardPile.length >= playerCount}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Tambah Buangan
            </button>
            {discardPile.length >= playerCount && (
              <button
                onClick={() => setStep("joker")}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lanjut
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Joker Determination */}
      {step === "joker" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Kartu apa yang ditarik untuk menentukan joker?
          </p>
          {jokerIndicator && (
            <div className="mb-3 flex items-center gap-2">
              <CardChip card={jokerIndicator} />
              <span className="text-sm text-purple-600">
                → Semua kartu rank {jokerIndicator.rank} menjadi joker
              </span>
            </div>
          )}
          {!jokerIndicator && (
            <button
              onClick={() => openPicker("joker")}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600"
            >
              + Pilih Kartu Penentu Joker
            </button>
          )}
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Setup selesai! Siap bermain.</p>
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <div>Pemain: {playerCount}</div>
            <div>Kartu di tangan: {hand.length}</div>
            <div>Buangan awal: {discardPile.length}</div>
            <div>Joker: rank {jokerRank} ({jokerIndicator ? formatCard(jokerIndicator) : "-"})</div>
          </div>
          <button
            onClick={handleStartGame}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
          >
            Mulai Permainan
          </button>
        </div>
      )}

      {showPicker && (
        <CardPicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/setup/GameSetup.tsx
git commit -m "feat: add GameSetup component with step-by-step flow"
```

---

## Task 17: Main Page Layout

**Files:**
- Modify: src/app/page.tsx
- Modify: src/app/layout.tsx

- [ ] **Step 1: Update layout.tsx**

Modify src/app/layout.tsx:

```tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "RemiSense AI",
  description: "Recommendation Assistant untuk permainan kartu Remi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create main page**

Modify src/app/page.tsx:

```tsx
"use client"

import { useGameStore } from "@/store/gameStore"
import { GameSetup } from "@/components/setup/GameSetup"
import { HandArea } from "@/components/hand/HandArea"
import { DiscardPile } from "@/components/discard/DiscardPile"
import { MeldTable } from "@/components/melds/MeldTable"
import { RecommendationPanel } from "@/components/recommendation/RecommendationPanel"

export default function Home() {
  const { gamePhase, resetGame, jokerRank, jokerIndicator } = useGameStore()
  const { formatCard } = require("@/engine/cards/cardUtils")

  if (gamePhase === "setup") {
    return (
      <main className="max-w-2xl mx-auto p-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6">RemiSense AI</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          AI Recommendation Assistant untuk permainan kartu Remi
        </p>
        <GameSetup />
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">RemiSense AI</h1>
          {jokerRank && (
            <span className="text-xs text-purple-600">
              Joker: rank {jokerRank} ({jokerIndicator ? formatCard(jokerIndicator) : ""}) ★
            </span>
          )}
        </div>
        <button
          onClick={resetGame}
          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
        >
          Reset Permainan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Input area */}
        <div className="md:col-span-2 space-y-4">
          <HandArea />
          <DiscardPile />
          <MeldTable />
        </div>

        {/* Right column: Recommendation */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <RecommendationPanel />
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify app runs**

Run:
```bash
npm run dev
```

Expected: App runs on localhost:3000, shows setup screen.

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add main page layout with two-column responsive design"
```

---

## Task 18: Integration Testing & Polish

**Files:**
- Modify: src/app/page.tsx (fix import)
- Run all tests

- [ ] **Step 1: Fix dynamic require in page.tsx**

Replace the require in src/app/page.tsx with proper import:

```tsx
// At the top of the file, add:
import { formatCard } from "@/engine/cards/cardUtils"

// Remove the require line inside the component
```

- [ ] **Step 2: Run all engine tests**

Run:
```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run dev server and verify full flow**

Run:
```bash
npm run dev
```

Manual verification:
1. Setup screen shows with player count selection
2. Can input 7 cards to hand
3. Can input initial discards
4. Can select joker indicator card
5. Game starts, two-column layout appears
6. Adding/removing cards triggers recommendation update
7. Recommendation panel shows discard suggestion with reasons
8. Can add discard from other players
9. Can add meld groups
10. Reset button works

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: complete MVP integration with all components wired"
```

---

## Task 19: Responsive Layout & Final Polish

**Files:**
- Modify: src/app/globals.css
- Modify: src/app/page.tsx

- [ ] **Step 1: Add base styles to globals.css**

Ensure src/app/globals.css contains:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply text-gray-900 antialiased;
  }
}
```

- [ ] **Step 2: Verify responsive behavior**

Run:
```bash
npm run dev
```

Check at different viewport widths:
- Desktop (>768px): two-column layout
- Mobile (<768px): stacked vertically, recommendation below input

- [ ] **Step 3: Run final build**

Run:
```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: finalize MVP with responsive layout and polish"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project Setup | package.json, configs |
| 2 | Type Definitions | src/types/index.ts |
| 3 | Card Utils | src/engine/cards/cardUtils.ts |
| 4 | Meld Detector | src/engine/melds/meldDetector.ts |
| 5 | Combination Solver | src/engine/solver/combinationSolver.ts |
| 6 | Probability Tracker | src/engine/probability/probabilityTracker.ts |
| 7 | Heuristic Evaluator | src/engine/heuristics/heuristicEvaluator.ts |
| 8 | Recommendation Engine | src/engine/recommendation/recommendationEngine.ts |
| 9 | Zustand Store | src/store/gameStore.ts |
| 10 | CardChip Component | src/components/hand/CardChip.tsx |
| 11 | CardPicker Component | src/components/hand/CardPicker.tsx |
| 12 | HandArea Component | src/components/hand/HandArea.tsx |
| 13 | DiscardPile Component | src/components/discard/DiscardPile.tsx |
| 14 | MeldTable Component | src/components/melds/MeldTable.tsx |
| 15 | RecommendationPanel | src/components/recommendation/RecommendationPanel.tsx |
| 16 | GameSetup Component | src/components/setup/GameSetup.tsx |
| 17 | Main Page Layout | src/app/page.tsx |
| 18 | Integration Testing | All files |
| 19 | Responsive & Polish | CSS, layout |
