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
