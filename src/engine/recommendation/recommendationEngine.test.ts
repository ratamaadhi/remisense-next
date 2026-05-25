import { describe, it, expect } from "vitest"
import { analyze, analyzeDiscardPickup } from "./recommendationEngine"
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
    expect(result.discard?.rank).toBe(13)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it("never recommends discarding a joker", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 3 },   // joker
      { suit: "heart", rank: 3 },   // joker
      { suit: "diamond", rank: 3 }, // joker
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 12 },
      { suit: "heart", rank: 11 },
      { suit: "diamond", rank: 10 },
    ]
    const result = analyze(hand, [], [], 3, null)
    expect(result.discard?.rank).not.toBe(3)
  })

  it("returns null discard for empty hand", () => {
    const result = analyze([], [], [], null, null)
    expect(result.discard).toBeNull()
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
    const hasIndonesian = result.reasons.some(
      (r) => r.includes("Kartu") || r.includes("terisolasi") || r.includes("tinggi") || r.includes("rendah") || r.includes("strategis")
    )
    expect(hasIndonesian).toBe(true)
  })

  it("accounts for discard pile in probability", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "club", rank: 13 },
      { suit: "heart", rank: 12 },
      { suit: "diamond", rank: 11 },
      { suit: "club", rank: 10 },
      { suit: "heart", rank: 2 },
    ]
    // 7S is in discard pile — near-seq 5S,6S has lower completion chance
    const discardPile: Card[] = [{ suit: "spade", rank: 7 }]
    const result = analyze(hand, discardPile, [], null, null)
    expect(result).toBeDefined()
    expect(result.discard).not.toBeNull()
  })
})

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

  it("blocks set opportunity when player has no sequence meld", () => {
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
    // No visibleMelds → set pickup blocked
    const result = analyzeDiscardPickup(hand, discardPile, [], null, null)
    expect(result.bestOption).toBeNull()
  })

  it("allows set opportunity when player already has a sequence meld", () => {
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
    // Player has a sequence meld → set pickup allowed
    const visibleMelds: Card[][] = [
      [{ suit: "heart", rank: 4 }, { suit: "heart", rank: 5 }, { suit: "heart", rank: 6 }],
    ]
    const result = analyzeDiscardPickup(hand, discardPile, visibleMelds, null, null)
    expect(result.bestOption).not.toBeNull()
    expect(result.bestOption!.targetCard).toEqual({ suit: "club", rank: 7 })
    expect(result.bestOption!.formedMeld.type).toBe("set")
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

describe("joker meld extension bug fixes", () => {
  it("recommends null discard when joker completes all cards into melds (2S 3S 4S KH KD KC JS★)", () => {
    // Hand: 2S 3S 4S KH KD KC JS★ (joker rank=11)
    // Expected: JS joins King set → all 7 cards in melds → discard null
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "spade", rank: 4 },
      { suit: "heart", rank: 13 },
      { suit: "diamond", rank: 13 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 11 }, // joker rank = 11
    ]
    const result = analyze(hand, [], [], 11, null)
    expect(result.discard).toBeNull()
  })

  it("does not recommend discarding a King when joker can join the King set", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "spade", rank: 4 },
      { suit: "heart", rank: 13 },
      { suit: "diamond", rank: 13 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 11 }, // joker rank = 11
    ]
    const result = analyze(hand, [], [], 11, null)
    expect(result.discard?.rank).not.toBe(13)
  })

  it("all 7 cards are in completed melds when joker extends a meld", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "spade", rank: 4 },
      { suit: "heart", rank: 13 },
      { suit: "diamond", rank: 13 },
      { suit: "club", rank: 13 },
      { suit: "spade", rank: 11 }, // joker rank = 11
    ]
    const result = analyze(hand, [], [], 11, null)
    const totalMeldCards = result.strongestCombos.reduce((sum, m) => sum + m.cards.length, 0)
    expect(totalMeldCards).toBe(7)
  })
})
