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
    const hand: Card[] = [
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
    ]
    const result = solveOptimalMelds(hand, null)
    const totalInMelds = result.completedMelds.reduce((sum, m) => sum + m.cards.length, 0)
    expect(totalInMelds).toBe(3)
    // The 2 leftover cards form a near-meld (near-set or near-sequence), not dead cards
    expect(result.completedMelds).toHaveLength(1)
    expect(result.nearMelds.length + result.deadCards.length).toBeGreaterThanOrEqual(1)
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

  it("handles empty hand", () => {
    const result = solveOptimalMelds([], null)
    expect(result.completedMelds).toHaveLength(0)
    expect(result.nearMelds).toHaveLength(0)
    expect(result.deadCards).toHaveLength(0)
  })

  it("correctly classifies nearMelds after allocation", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "diamond", rank: 7 },
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
    ]
    const result = solveOptimalMelds(hand, null)
    // Set(7S,7H,7D) is completed, 5S+6S should be near-sequence
    expect(result.completedMelds).toHaveLength(1)
    expect(result.nearMelds.length).toBeGreaterThanOrEqual(1)
    expect(result.deadCards).toHaveLength(0)
  })

  it("handles multiple jokers", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 3 },  // joker
      { suit: "heart", rank: 3 },  // joker
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 7 },
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
    ]
    // Two jokers: one can complete set(7S,7H,joker), other can extend sequence
    const result = solveOptimalMelds(hand, 3)
    const totalInMelds = result.completedMelds.reduce((sum, m) => sum + m.cards.length, 0)
    expect(totalInMelds).toBeGreaterThanOrEqual(3)
  })
})
