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
      { suit: "club", rank: 3 }, // joker rank = 3, fills gap as 6♠
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

describe("isJoker", () => {
  it("returns true when card rank matches jokerRank", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, 7)).toBe(true)
  })
  it("returns false when jokerRank is null", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, null)).toBe(false)
  })
})
