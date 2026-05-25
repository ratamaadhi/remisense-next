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

  it("extends a valid 3-card set to 4-card set using joker", () => {
    // KH, KD, KC already form a valid set — joker (JS, rank 11) should extend to 4-card set
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "spade", rank: 4 },
      { suit: "heart", rank: 13 },   // KH
      { suit: "diamond", rank: 13 }, // KD
      { suit: "club", rank: 13 },    // KC
      { suit: "spade", rank: 11 },   // JS — joker rank = 11
    ]
    const sets = detectSets(hand, 11)
    // Should detect both the 3-card set AND the 4-card set with joker
    const fourCardSet = sets.find((s) => s.cards.length === 4)
    expect(fourCardSet).toBeDefined()
    expect(fourCardSet!.type).toBe("set")
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
    // Sub-sequence enumeration: [3,4,5], [4,5,6], [3,4,5,6] — at least one with length >= 4
    expect(seqs.length).toBeGreaterThanOrEqual(1)
    expect(seqs.some((s) => s.cards.length >= 4)).toBe(true)
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
      { suit: "club", rank: 3 }, // joker rank = 3, fills gap as 6♠
      { suit: "spade", rank: 7 },
    ]
    const seqs = detectSequences(hand, 3)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].cards).toHaveLength(3)
  })

  it("does not detect A-2-3 as a valid sequence", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 1 }, // A
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs).toHaveLength(0)
  })

  it("does not detect 10-J-Q as a valid sequence", () => {
    const hand: Card[] = [
      { suit: "heart", rank: 10 },
      { suit: "heart", rank: 11 }, // J
      { suit: "heart", rank: 12 }, // Q
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs).toHaveLength(0)
  })

  it("does not detect 8-9-10-J crossing as valid", () => {
    const hand: Card[] = [
      { suit: "diamond", rank: 8 },
      { suit: "diamond", rank: 9 },
      { suit: "diamond", rank: 10 },
      { suit: "diamond", rank: 11 }, // J
    ]
    const seqs = detectSequences(hand, null)
    // 8-9-10 is valid, but no sequence may cross into J
    expect(seqs.every((s) => s.cards.every((c) => c.rank <= 10))).toBe(true)
  })

  it("still detects J-Q-K as a valid sequence", () => {
    const hand: Card[] = [
      { suit: "club", rank: 11 }, // J
      { suit: "club", rank: 12 }, // Q
      { suit: "club", rank: 13 }, // K
    ]
    const seqs = detectSequences(hand, null)
    expect(seqs).toHaveLength(1)
    expect(seqs[0].cards).toHaveLength(3)
  })

  it("does not use joker to bridge A-2 forbidden boundary", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 1 },  // A
      { suit: "club", rank: 5 },   // joker rank = 5, would fill rank 2
      { suit: "spade", rank: 3 },
    ]
    const seqs = detectSequences(hand, 5)
    expect(seqs).toHaveLength(0)
  })

  it("does not use joker to bridge 10-J forbidden boundary", () => {
    const hand: Card[] = [
      { suit: "heart", rank: 9 },
      { suit: "club", rank: 5 },   // joker rank = 5, would fill rank 10
      { suit: "heart", rank: 11 }, // J
    ]
    const seqs = detectSequences(hand, 5)
    expect(seqs).toHaveLength(0)
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

describe("isJoker", () => {
  it("returns true when card rank matches jokerRank", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, 7)).toBe(true)
  })
  it("returns false when jokerRank is null", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, null)).toBe(false)
  })
})

describe("edge cases", () => {
  it("returns empty for empty hand", () => {
    expect(detectSets([], null)).toHaveLength(0)
    expect(detectSequences([], null)).toHaveLength(0)
    expect(detectNearMelds([], null)).toHaveLength(0)
  })

  it("returns empty sets and sequences for all-joker hand", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
    ]
    // All cards are jokers — no non-joker cards to form melds
    expect(detectSets(hand, 7)).toHaveLength(0)
    expect(detectSequences(hand, 7)).toHaveLength(0)
  })
})
