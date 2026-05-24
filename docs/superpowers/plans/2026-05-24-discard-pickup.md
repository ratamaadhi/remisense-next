# Discard Pickup Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ability for users to pick up cards from the discard pile (for themselves with AI recommendation, or record opponent pickups) to keep game state accurate and provide strategic advice.

**Architecture:** Pure function engine additions (getTopNDiscards, analyzeDiscardPickup) feed into a new UI flow (DiscardPickupFlow dialog). Two new Zustand store actions handle state transitions for self-pickup and opponent-pickup scenarios.

**Tech Stack:** TypeScript, Zustand, React, Shadcn UI (Dialog, Button), Vitest

---

## Task 1: Add Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add DiscardPickupOption and DiscardPickupRecommendation types**

Add at the end of `src/types/index.ts`:

```ts
/** Satu peluang pengambilan kartu dari tumpukan buangan */
export type DiscardPickupOption = {
  targetCard: Card
  targetIndex: number
  cardsTaken: Card[]
  formedMeld: Meld
  suggestedDiscard: Card
  netScore: number
  worthIt: boolean
  reasons: string[]
}

/** Hasil analisis semua peluang pengambilan dari tumpukan buangan */
export type DiscardPickupRecommendation = {
  options: DiscardPickupOption[]
  bestOption: DiscardPickupOption | null
  drawDeckScore: number
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add DiscardPickupOption and DiscardPickupRecommendation types"
```

---

## Task 2: Add getTopNDiscards to Probability Tracker

**Files:**
- Modify: `src/engine/probability/probabilityTracker.ts`
- Modify: `src/engine/probability/probabilityTracker.test.ts`

- [ ] **Step 1: Write failing tests for getTopNDiscards**

Add to `src/engine/probability/probabilityTracker.test.ts`:

```ts
import { getTopNDiscards } from "./probabilityTracker"

describe("getTopNDiscards", () => {
  it("returns top N cards from discard pile (last = top)", () => {
    const pile: Card[] = [
      { suit: "spade", rank: 1 },
      { suit: "heart", rank: 2 },
      { suit: "diamond", rank: 3 },
      { suit: "club", rank: 4 },
      { suit: "spade", rank: 5 },
    ]
    const top3 = getTopNDiscards(pile, 3)
    expect(top3).toEqual([
      { suit: "diamond", rank: 3 },
      { suit: "club", rank: 4 },
      { suit: "spade", rank: 5 },
    ])
  })

  it("returns all cards if pile.length < n", () => {
    const pile: Card[] = [
      { suit: "spade", rank: 1 },
      { suit: "heart", rank: 2 },
    ]
    const top7 = getTopNDiscards(pile, 7)
    expect(top7).toEqual(pile)
  })

  it("returns empty array if pile is empty", () => {
    expect(getTopNDiscards([], 7)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/probability/probabilityTracker.test.ts`
Expected: FAIL — `getTopNDiscards` is not exported

- [ ] **Step 3: Implement getTopNDiscards**

Add to `src/engine/probability/probabilityTracker.ts`:

```ts
/**
 * Returns N kartu teratas dari tumpukan buangan.
 * Index terakhir array discardPile = kartu paling atas.
 * Returns semua kartu jika pile.length < n.
 */
export function getTopNDiscards(discardPile: Card[], n: number): Card[] {
  if (discardPile.length === 0) return []
  const startIndex = Math.max(0, discardPile.length - n)
  return discardPile.slice(startIndex)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/probability/probabilityTracker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/probability/probabilityTracker.ts src/engine/probability/probabilityTracker.test.ts
git commit -m "feat: add getTopNDiscards to probability tracker"
```

---

## Task 3: Add analyzeDiscardPickup to Recommendation Engine

**Files:**
- Modify: `src/engine/recommendation/recommendationEngine.ts`
- Modify: `src/engine/recommendation/recommendationEngine.test.ts`

- [ ] **Step 1: Write failing tests for analyzeDiscardPickup**

Add to `src/engine/recommendation/recommendationEngine.test.ts`:

```ts
import { analyzeDiscardPickup } from "./recommendationEngine"

describe("analyzeDiscardPickup", () => {
  it("detects sequence opportunity from discard pile", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "heart", rank: 10 },
      { suit: "heart", rank: 11 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 9 },
      { suit: "club", rank: 13 },
    ]
    const discardPile: Card[] = [
      { suit: "diamond", rank: 1 },
      { suit: "club", rank: 2 },
      { suit: "heart", rank: 5 },
      { suit: "spade", rank: 4 },
    ]
    const result = analyzeDiscardPickup(hand, discardPile, [], null, null)
    expect(result.bestOption).not.toBeNull()
    expect(result.bestOption!.targetCard).toEqual({ suit: "spade", rank: 4 })
    expect(result.bestOption!.formedMeld.type).toBe("sequence")
  })

  it("detects set opportunity from discard pile", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 3 },
      { suit: "club", rank: 9 },
      { suit: "club", rank: 13 },
      { suit: "heart", rank: 1 },
      { suit: "diamond", rank: 11 },
    ]
    const discardPile: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "club", rank: 7 },
    ]
    const result = analyzeDiscardPickup(hand, discardPile, [], null, null)
    expect(result.bestOption).not.toBeNull()
    expect(result.bestOption!.targetCard).toEqual({ suit: "club", rank: 7 })
    expect(result.bestOption!.formedMeld.type).toBe("set")
  })

  it("returns worthIt=false when cost of extra cards is too high", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "heart", rank: 10 },
      { suit: "heart", rank: 11 },
      { suit: "diamond", rank: 7 },
      { suit: "club", rank: 9 },
      { suit: "club", rank: 13 },
    ]
    const discardPile: Card[] = [
      { suit: "diamond", rank: 1 },
      { suit: "club", rank: 2 },
      { suit: "heart", rank: 5 },
      { suit: "heart", rank: 6 },
      { suit: "heart", rank: 8 },
      { suit: "diamond", rank: 12 },
      { suit: "spade", rank: 4 },
    ]
    const result = analyzeDiscardPickup(hand, discardPile, [], null, null)
    if (result.bestOption) {
      expect(result.bestOption.targetIndex).toBe(7)
      expect(result.bestOption.cardsTaken.length).toBe(7)
    }
  })

  it("returns bestOption=null when no meld opportunity exists", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 1 },
      { suit: "heart", rank: 5 },
      { suit: "diamond", rank: 9 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 3 },
      { suit: "diamond", rank: 11 },
    ]
    const discardPile: Card[] = [
      { suit: "club", rank: 2 },
      { suit: "club", rank: 6 },
      { suit: "club", rank: 10 },
    ]
    const result = analyzeDiscardPickup(hand, discardPile, [], null, null)
    expect(result.bestOption).toBeNull()
    expect(result.options).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/recommendation/recommendationEngine.test.ts`
Expected: FAIL — `analyzeDiscardPickup` is not exported

- [ ] **Step 3: Implement analyzeDiscardPickup**

Add to `src/engine/recommendation/recommendationEngine.ts`:

```ts
import type { DiscardPickupOption, DiscardPickupRecommendation } from "@/types"
import { getTopNDiscards, getCompletionProbability } from "@/engine/probability/probabilityTracker"

/**
 * Analyzes all pickup opportunities from the discard pile.
 * For each card in the top 7, checks if it can form a meld with the hand.
 */
export function analyzeDiscardPickup(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerRank: number | null,
  jokerIndicator: Card | null
): DiscardPickupRecommendation {
  const top7 = getTopNDiscards(discardPile, 7)

  if (top7.length === 0) {
    return { options: [], bestOption: null, drawDeckScore: 0 }
  }

  // Compute drawDeckScore baseline
  const unseenCards = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)
  const nearMelds = detectNearMelds(hand, jokerRank).map((nm) => ({
    ...nm,
    completionProbability: getCompletionProbability(nm.neededCards, unseenCards, jokerRank),
  }))
  const drawDeckScore = nearMelds.length > 0
    ? (nearMelds.reduce((sum, nm) => sum + nm.completionProbability, 0) / nearMelds.length) * 30
    : 0

  const options: DiscardPickupOption[] = []

  // top7 is ordered oldest-to-newest (index 0 = deepest, last = top)
  // targetIndex 1 = top card = top7[top7.length - 1]
  for (let i = 0; i < top7.length; i++) {
    const targetCard = top7[i]
    const targetIndex = top7.length - i // 1 = top, 7 = deepest
    const cardsTaken = top7.slice(i) // from target to top (inclusive)

    // Simulate hand after pickup
    const simulatedHand = [...hand, ...cardsTaken]

    // Check if targetCard participates in a completed meld
    const allocation = solveOptimalMelds(simulatedHand, jokerRank)
    const meldWithTarget = allocation.completedMelds.find((m) =>
      m.cards.some((c) => cardEquals(c, targetCard))
    )

    if (!meldWithTarget) continue

    // Calculate netScore
    const meldValue = meldWithTarget.cards.length * 10
    const costOfExtras = (cardsTaken.length - 1) * 5
    const netScore = meldValue - costOfExtras
    const worthIt = netScore > drawDeckScore

    // Find suggested discard from simulated hand (excluding meld cards)
    const handAfterMeld = simulatedHand.filter(
      (c) => !meldWithTarget.cards.some((mc) => cardEquals(mc, c))
    )
    const context: GameContext = {
      hand: handAfterMeld,
      discardPile: discardPile.filter((c) => !cardsTaken.some((t) => cardEquals(t, c))),
      visibleMelds: [...visibleMelds, meldWithTarget.cards],
      unseenCards,
      jokerRank,
    }
    const cardScores = handAfterMeld.map((card) => ({
      card,
      score: scoreCard(card, context),
    }))
    cardScores.sort((a, b) => a.score - b.score)
    const suggestedDiscard = cardScores[0]?.card ?? hand[0]

    // Generate reasons
    const reasons: string[] = []
    reasons.push(`Membentuk ${meldWithTarget.type === "set" ? "set" : "sequence"} dengan ${meldWithTarget.cards.length} kartu`)
    if (cardsTaken.length > 1) {
      reasons.push(`Mengambil ${cardsTaken.length} kartu (${cardsTaken.length - 1} kartu bonus)`)
    }
    if (worthIt) {
      reasons.push("Lebih menguntungkan daripada draw dari deck")
    } else {
      reasons.push("Biaya kartu bonus terlalu tinggi — draw dari deck mungkin lebih baik")
    }

    options.push({
      targetCard,
      targetIndex,
      cardsTaken,
      formedMeld: meldWithTarget,
      suggestedDiscard,
      netScore,
      worthIt,
      reasons,
    })
  }

  options.sort((a, b) => b.netScore - a.netScore)
  const bestOption = options.length > 0 ? options[0] : null

  return { options, bestOption, drawDeckScore }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/recommendation/recommendationEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/recommendation/recommendationEngine.ts src/engine/recommendation/recommendationEngine.test.ts
git commit -m "feat: add analyzeDiscardPickup to recommendation engine"
```

---

## Task 4: Add Store Actions

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/gameStore.test.ts`

- [ ] **Step 1: Write failing tests for pickupFromDiscard**

Add to `src/store/gameStore.test.ts`:

```ts
describe("pickupFromDiscard", () => {
  it("moves cards correctly across all zones", () => {
    const { addToHand, addToDiscardPile, pickupFromDiscard } = useGameStore.getState()

    // Setup: hand has 2S, 3S. Discard has 5H, 4S (4S is top)
    addToHand({ suit: "spade", rank: 2 })
    addToHand({ suit: "spade", rank: 3 })
    addToDiscardPile({ suit: "heart", rank: 5 })
    addToDiscardPile({ suit: "spade", rank: 4 })

    // Pickup: take 4S from discard, form meld 2S+3S+4S, discard 5H after
    // cardsTaken = [5H, 4S] (from deepest to top, since 5H is below 4S in top7 slice)
    // Wait - discardPile is [5H, 4S], top7 would be [5H, 4S]
    // If target is 5H (index 2 from top), cardsTaken = [5H, 4S]
    // If target is 4S (index 1 from top), cardsTaken = [4S]
    pickupFromDiscard(
      [{ suit: "spade", rank: 4 }],
      [{ suit: "spade", rank: 2 }, { suit: "spade", rank: 3 }, { suit: "spade", rank: 4 }],
      { suit: "heart", rank: 5 }
    )

    const state = useGameStore.getState()
    // Hand should NOT have 2S, 3S, 4S (they are in meld) but should NOT have 5H either (discarded)
    // Wait: cardsTaken=[4S] goes to hand first, then meld cards removed from hand, then 5H discarded
    // But 5H was never in hand... let me re-think

    // Actually the flow is:
    // 1. Remove cardsTaken [4S] from discardPile -> discardPile becomes [5H]
    // 2. Add cardsTaken to hand (minus meld cards) -> 4S is in meld, so nothing extra added
    //    Actually: add ALL cardsTaken to hand first, then remove meld cards
    //    hand = [2S, 3S] + [4S] = [2S, 3S, 4S]
    // 3. Add formedMeld to visibleMelds -> visibleMelds = [[2S, 3S, 4S]]
    // 4. Remove meld cards from hand -> hand = []
    // 5. Move discardAfter from hand to discardPile
    //    But hand is empty and 5H is not in hand!

    // Hmm, this test scenario is wrong. Let me fix:
    // The user must discard a card FROM THEIR HAND after pickup.
    // So let's say hand has [2S, 3S, 9D]. Discard has [5H, 4S].
    // User picks up [4S] (top card), forms meld [2S, 3S, 4S], discards 9D.
  })
})
```

Actually, let me rewrite this test properly:

```ts
describe("pickupFromDiscard", () => {
  beforeEach(() => {
    useGameStore.setState({
      hand: [],
      discardPile: [],
      visibleMelds: [],
      jokerRank: null,
      jokerIndicator: null,
      gamePhase: "playing",
      playerCount: 4,
      recommendation: null,
    })
  })

  it("moves cards correctly across all zones", () => {
    // Setup state directly
    useGameStore.setState({
      hand: [
        { suit: "spade", rank: 2 },
        { suit: "spade", rank: 3 },
        { suit: "diamond", rank: 9 },
      ],
      discardPile: [
        { suit: "heart", rank: 5 },
        { suit: "spade", rank: 4 },
      ],
    })

    useGameStore.getState().pickupFromDiscard(
      [{ suit: "spade", rank: 4 }], // cardsTaken (top card only)
      [{ suit: "spade", rank: 2 }, { suit: "spade", rank: 3 }, { suit: "spade", rank: 4 }], // formedMeld
      { suit: "diamond", rank: 9 } // discardAfter
    )

    const state = useGameStore.getState()
    expect(state.hand).toEqual([]) // all cards used in meld or discarded
    expect(state.visibleMelds).toEqual([
      [{ suit: "spade", rank: 2 }, { suit: "spade", rank: 3 }, { suit: "spade", rank: 4 }],
    ])
    expect(state.discardPile).toEqual([
      { suit: "heart", rank: 5 },
      { suit: "diamond", rank: 9 },
    ])
  })

  it("does not leave duplicate cards in any zone", () => {
    useGameStore.setState({
      hand: [
        { suit: "heart", rank: 7 },
        { suit: "diamond", rank: 7 },
        { suit: "club", rank: 12 },
        { suit: "spade", rank: 1 },
      ],
      discardPile: [
        { suit: "spade", rank: 10 },
        { suit: "club", rank: 7 },
      ],
    })

    useGameStore.getState().pickupFromDiscard(
      [{ suit: "club", rank: 7 }],
      [{ suit: "heart", rank: 7 }, { suit: "diamond", rank: 7 }, { suit: "club", rank: 7 }],
      { suit: "club", rank: 12 }
    )

    const state = useGameStore.getState()
    const allCards = [
      ...state.hand,
      ...state.discardPile,
      ...state.visibleMelds.flat(),
    ]
    const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`))
    expect(uniqueKeys.size).toBe(allCards.length)
  })
})
```

- [ ] **Step 2: Write failing tests for opponentPickupFromDiscard**

Add to `src/store/gameStore.test.ts`:

```ts
describe("opponentPickupFromDiscard", () => {
  beforeEach(() => {
    useGameStore.setState({
      hand: [],
      discardPile: [],
      visibleMelds: [],
      jokerRank: null,
      jokerIndicator: null,
      gamePhase: "playing",
      playerCount: 4,
      recommendation: null,
    })
  })

  it("updates discardPile and visibleMelds correctly", () => {
    useGameStore.setState({
      discardPile: [
        { suit: "heart", rank: 1 },
        { suit: "diamond", rank: 5 },
        { suit: "club", rank: 8 },
      ],
    })

    useGameStore.getState().opponentPickupFromDiscard(
      [{ suit: "diamond", rank: 5 }, { suit: "club", rank: 8 }], // cardsTaken
      [{ suit: "club", rank: 6 }, { suit: "club", rank: 7 }, { suit: "club", rank: 8 }], // formedMeld
      { suit: "spade", rank: 11 } // newDiscard
    )

    const state = useGameStore.getState()
    expect(state.discardPile).toEqual([
      { suit: "heart", rank: 1 },
      { suit: "spade", rank: 11 },
    ])
    expect(state.visibleMelds).toEqual([
      [{ suit: "club", rank: 6 }, { suit: "club", rank: 7 }, { suit: "club", rank: 8 }],
    ])
  })

  it("does not leave duplicate cards", () => {
    useGameStore.setState({
      discardPile: [
        { suit: "spade", rank: 3 },
        { suit: "heart", rank: 9 },
      ],
    })

    useGameStore.getState().opponentPickupFromDiscard(
      [{ suit: "heart", rank: 9 }],
      [{ suit: "heart", rank: 9 }, { suit: "heart", rank: 10 }, { suit: "heart", rank: 11 }],
      { suit: "diamond", rank: 2 }
    )

    const state = useGameStore.getState()
    const allCards = [
      ...state.discardPile,
      ...state.visibleMelds.flat(),
    ]
    const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`))
    expect(uniqueKeys.size).toBe(allCards.length)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: FAIL — `pickupFromDiscard` and `opponentPickupFromDiscard` are not defined

- [ ] **Step 4: Implement store actions**

Add to `src/store/gameStore.ts` inside the `create` callback:

```ts
pickupFromDiscard: (cardsTaken, formedMeld, discardAfter) => {
  const state = get()
  // 1. Remove cardsTaken from discardPile
  const newDiscardPile = state.discardPile.filter(
    (c) => !cardsTaken.some((t) => cardEquals(t, c))
  )
  // 2. Add cardsTaken to hand
  let newHand = [...state.hand, ...cardsTaken]
  // 3. Remove formedMeld cards from hand
  newHand = newHand.filter(
    (c) => !formedMeld.some((m) => cardEquals(m, c))
  )
  // 4. Remove discardAfter from hand
  newHand = newHand.filter((c) => !cardEquals(c, discardAfter))

  set({
    hand: newHand,
    discardPile: [...newDiscardPile, discardAfter],
    visibleMelds: [...state.visibleMelds, formedMeld],
  })
},

opponentPickupFromDiscard: (cardsTaken, formedMeld, newDiscard) => {
  const state = get()
  // 1. Remove cardsTaken from discardPile
  const newDiscardPile = state.discardPile.filter(
    (c) => !cardsTaken.some((t) => cardEquals(t, c))
  )

  set({
    discardPile: [...newDiscardPile, newDiscard],
    visibleMelds: [...state.visibleMelds, formedMeld],
  })
},
```

Also add to the `GameState` type definition:

```ts
pickupFromDiscard: (cardsTaken: Card[], formedMeld: Card[], discardAfter: Card) => void
opponentPickupFromDiscard: (cardsTaken: Card[], formedMeld: Card[], newDiscard: Card) => void
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: add pickupFromDiscard and opponentPickupFromDiscard store actions"
```

---

## Task 5: Update DiscardPile UI

**Files:**
- Modify: `src/components/discard/DiscardPile.tsx`

- [ ] **Step 1: Add highlight for top 7 cards and two new buttons**

Replace the content of `src/components/discard/DiscardPile.tsx` with:

```tsx
"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { DiscardPickupFlow } from "./DiscardPickupFlow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Card as CardType } from "@/types"

export function DiscardPile() {
  const { discardPile, jokerRank, addToDiscardPile } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)
  const [pickupMode, setPickupMode] = useState<"self" | "opponent" | null>(null)

  const top7StartIndex = Math.max(0, discardPile.length - 7)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Tumpukan Buangan ({discardPile.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 min-h-[40px] items-center">
          {discardPile.length === 0 && (
            <span className="text-sm text-muted-foreground">Belum ada kartu buangan</span>
          )}
          {discardPile.map((card, i) => {
            const isTop7 = i >= top7StartIndex
            return (
              <span key={`${card.suit}-${card.rank}-${i}`} className="flex items-center">
                <CardChip
                  card={card}
                  jokerRank={jokerRank}
                  disabled
                  highlighted={isTop7}
                />
                {i < discardPile.length - 1 && (
                  <span className="mx-0.5 text-muted-foreground text-xs">&rarr;</span>
                )}
              </span>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
          >
            + Buangan Pemain Lain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickupMode("self")}
            disabled={discardPile.length === 0}
          >
            Ambil dari Buangan (Saya)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickupMode("opponent")}
            disabled={discardPile.length === 0}
          >
            Catat Ambil Pemain Lain
          </Button>
        </div>

        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pilih Kartu</DialogTitle>
            </DialogHeader>
            <CardPicker
              onSelect={(card: CardType) => addToDiscardPile(card)}
              onClose={() => setShowPicker(false)}
            />
          </DialogContent>
        </Dialog>

        {pickupMode && (
          <DiscardPickupFlow
            mode={pickupMode}
            onClose={() => setPickupMode(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: Error about missing `DiscardPickupFlow` (expected — will be created in Task 6)

- [ ] **Step 3: Commit**

```bash
git add src/components/discard/DiscardPile.tsx
git commit -m "feat: update DiscardPile with top-7 highlight and pickup buttons"
```

---

## Task 6: Create DiscardPickupFlow Component

**Files:**
- Create: `src/components/discard/DiscardPickupFlow.tsx`

- [ ] **Step 1: Create the DiscardPickupFlow component**

Create `src/components/discard/DiscardPickupFlow.tsx`:

```tsx
"use client"

import { useState, useMemo } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { analyzeDiscardPickup } from "@/engine/recommendation/recommendationEngine"
import { getTopNDiscards } from "@/engine/probability/probabilityTracker"
import { cardEquals } from "@/engine/cards/cardUtils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Card as CardType, DiscardPickupOption } from "@/types"

type DiscardPickupFlowProps = {
  mode: "self" | "opponent"
  onClose: () => void
}

export function DiscardPickupFlow({ mode, onClose }: DiscardPickupFlowProps) {
  const {
    hand,
    discardPile,
    visibleMelds,
    jokerRank,
    jokerIndicator,
    pickupFromDiscard,
    opponentPickupFromDiscard,
  } = useGameStore()

  const [step, setStep] = useState(1)
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number | null>(null)
  const [opponentMeld, setOpponentMeld] = useState<CardType[]>([])

  const top7 = useMemo(() => getTopNDiscards(discardPile, 7), [discardPile])

  // For "self" mode: compute recommendation
  const recommendation = useMemo(() => {
    if (mode !== "self") return null
    return analyzeDiscardPickup(hand, discardPile, visibleMelds, jokerRank, jokerIndicator)
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, mode])

  // Selected option based on target
  const selectedOption: DiscardPickupOption | null = useMemo(() => {
    if (!recommendation || selectedTargetIndex === null) return null
    return recommendation.options.find((o) => o.targetIndex === selectedTargetIndex) ?? null
  }, [recommendation, selectedTargetIndex])

  // Cards that will be taken (from target to top)
  const cardsTaken = useMemo(() => {
    if (selectedTargetIndex === null) return []
    const startIdx = top7.length - selectedTargetIndex
    return top7.slice(startIdx)
  }, [top7, selectedTargetIndex])

  function handleTargetSelect(index: number) {
    setSelectedTargetIndex(index)
    if (mode === "opponent") {
      setStep(2)
    }
  }

  function handleSelfConfirm() {
    setStep(3)
  }

  function handleSelfDiscard(card: CardType) {
    if (!selectedOption) return
    pickupFromDiscard(cardsTaken, selectedOption.formedMeld.cards, card)
    onClose()
  }

  function handleOpponentMeldConfirm(cards: CardType[]) {
    setOpponentMeld(cards)
    setStep(3)
  }

  function handleOpponentDiscard(card: CardType) {
    opponentPickupFromDiscard(cardsTaken, opponentMeld, card)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "self" ? "Ambil dari Buangan" : "Catat Ambil Pemain Lain"}
          </DialogTitle>
          <DialogDescription>
            Langkah {step} dari 3
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Pick Target */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih kartu target dari 7 teratas tumpukan buangan:
            </p>
            <div className="flex flex-wrap gap-2">
              {top7.map((card, i) => {
                const targetIdx = top7.length - i
                const isSelected = selectedTargetIndex === targetIdx
                const willBeTaken = selectedTargetIndex !== null && targetIdx <= selectedTargetIndex
                return (
                  <div key={`${card.suit}-${card.rank}`} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">#{targetIdx}</span>
                    <CardChip
                      card={card}
                      jokerRank={jokerRank}
                      onClick={() => handleTargetSelect(targetIdx)}
                      highlighted={isSelected || willBeTaken}
                      variant={isSelected ? "success" : "default"}
                    />
                  </div>
                )
              })}
            </div>

            {/* Self mode: show recommendation */}
            {mode === "self" && selectedOption && (
              <div className="mt-3 p-3 rounded-md border bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedOption.worthIt ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {selectedOption.worthIt ? "Worth It ✓" : "Tidak Disarankan"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {selectedOption.netScore.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  {selectedOption.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>&bull;</span><span>{r}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={handleSelfConfirm} className="mt-2">
                  Lanjut &rarr;
                </Button>
              </div>
            )}

            {/* Self mode: no option found for this target */}
            {mode === "self" && selectedTargetIndex !== null && !selectedOption && (
              <div className="mt-3 p-3 rounded-md border bg-orange-50 text-sm text-orange-700">
                Tidak ada meld yang bisa dibentuk dengan kartu ini.
              </div>
            )}
          </div>
        )}

        {/* Step 2 (self): Confirmation */}
        {step === 2 && mode === "self" && selectedOption && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Konfirmasi pengambilan:</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Kartu diambil:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cardsTaken.map((c) => (
                    <CardChip key={`${c.suit}-${c.rank}`} card={c} jokerRank={jokerRank} disabled />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Meld terbentuk:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedOption.formedMeld.cards.map((c) => (
                    <CardChip key={`${c.suit}-${c.rank}`} card={c} jokerRank={jokerRank} variant="success" disabled />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                &larr; Kembali
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Konfirmasi &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 (opponent): Record Meld */}
        {step === 2 && mode === "opponent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Catat meld yang dibentuk pemain lain (min. 3 kartu):
            </p>
            <CardPicker
              onSelect={() => {}}
              onClose={() => {}}
              multiSelect={true}
              onMultiSelect={handleOpponentMeldConfirm}
              autoClose={false}
            />
          </div>
        )}

        {/* Step 3 (self): Pick discard */}
        {step === 3 && mode === "self" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih 1 kartu untuk dibuang:
              {selectedOption?.suggestedDiscard && (
                <span className="ml-1 text-blue-600">
                  (Disarankan: {selectedOption.suggestedDiscard.suit} {selectedOption.suggestedDiscard.rank})
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Show hand cards + bonus cards (not in meld) as discard options */}
              {(() => {
                const meldCards = selectedOption?.formedMeld.cards ?? []
                const handAfterPickup = [...hand, ...cardsTaken].filter(
                  (c) => !meldCards.some((m) => cardEquals(m, c))
                )
                return handAfterPickup.map((card) => (
                  <CardChip
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    jokerRank={jokerRank}
                    onClick={() => handleSelfDiscard(card)}
                    highlighted={selectedOption?.suggestedDiscard ? cardEquals(card, selectedOption.suggestedDiscard) : false}
                  />
                ))
              })()}
            </div>
          </div>
        )}

        {/* Step 3 (opponent): Record new discard */}
        {step === 3 && mode === "opponent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kartu apa yang dibuang pemain lain setelah mengambil?
            </p>
            <CardPicker
              onSelect={handleOpponentDiscard}
              onClose={() => {}}
              autoClose={false}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/discard/DiscardPickupFlow.tsx
git commit -m "feat: add DiscardPickupFlow multi-step dialog component"
```

---

## Task 7: Update RecommendationPanel

**Files:**
- Modify: `src/components/recommendation/RecommendationPanel.tsx`

- [ ] **Step 1: Add "Peluang Ambil Buangan" section**

Add the following imports at the top of `RecommendationPanel.tsx`:

```tsx
import { analyzeDiscardPickup } from "@/engine/recommendation/recommendationEngine"
import type { DiscardPickupRecommendation } from "@/types"
```

Add a `useMemo` inside the component to compute pickup recommendation:

```tsx
const pickupRec: DiscardPickupRecommendation | null = useMemo(() => {
  if (gamePhase !== "playing" || hand.length === 0 || discardPile.length === 0) return null
  return analyzeDiscardPickup(hand, discardPile, visibleMelds, jokerRank, jokerIndicator)
}, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, gamePhase])
```

Add the following JSX section inside the `CardContent` div, **before** the existing discard suggestion section:

```tsx
{/* Discard pickup opportunity */}
{pickupRec?.bestOption && pickupRec.bestOption.worthIt && (
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
        Worth It ✓
      </span>
      <span className="text-sm font-medium text-blue-800">Peluang Ambil Buangan</span>
    </div>
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-muted-foreground">Target:</span>
        <CardChip
          card={pickupRec.bestOption.targetCard}
          jokerRank={jokerRank}
          disabled
          highlighted
        />
        <span className="text-muted-foreground ml-1">
          (posisi #{pickupRec.bestOption.targetIndex}, ambil {pickupRec.bestOption.cardsTaken.length} kartu)
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-muted-foreground">Meld:</span>
        {pickupRec.bestOption.formedMeld.cards.map((c) => (
          <CardChip
            key={`${c.suit}-${c.rank}`}
            card={c}
            jokerRank={jokerRank}
            variant="success"
            disabled
          />
        ))}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-muted-foreground">Buang setelahnya:</span>
        <CardChip
          card={pickupRec.bestOption.suggestedDiscard}
          jokerRank={jokerRank}
          variant="danger"
          disabled
        />
      </div>
      <div className="mt-1 space-y-0.5">
        {pickupRec.bestOption.reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-1 text-blue-700">
            <span>&bull;</span><span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add useMemo import if not present**

Ensure `useMemo` is imported from React:

```tsx
import { useEffect, useMemo } from "react"
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/recommendation/RecommendationPanel.tsx
git commit -m "feat: add discard pickup opportunity section to RecommendationPanel"
```

---

## Task 8: Integration Test & Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run dev server and manually verify**

Run: `npm run dev`

Manual verification checklist:
1. Start a game (setup flow)
2. Add cards to hand
3. Add cards to discard pile
4. Verify top 7 cards in discard pile are highlighted
5. Click "Ambil dari Buangan (Saya)" — verify flow works
6. Click "Catat Ambil Pemain Lain" — verify flow works
7. Verify RecommendationPanel shows "Peluang Ambil Buangan" when opportunity exists

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration fixes for discard pickup feature"
```
