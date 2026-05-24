import { describe, it, expect } from "vitest"
import { getRemainingCards, getCompletionProbability } from "./probabilityTracker"
import type { Card } from "@/types"

describe("getRemainingCards", () => {
  it("returns 52 when no cards are known", () => {
    const remaining = getRemainingCards([], [], [], null)
    expect(remaining).toHaveLength(52)
  })

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
    const jokerIndicator: Card = { suit: "diamond", rank: 5 }
    const remaining = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)
    // 52 - 2 (hand) - 1 (discard) - 3 (melds) - 1 (jokerIndicator) = 45
    expect(remaining).toHaveLength(45)
  })

  it("excludes jokerIndicator from remaining", () => {
    const jokerIndicator: Card = { suit: "heart", rank: 3 }
    const remaining = getRemainingCards([], [], [], jokerIndicator)
    expect(remaining).toHaveLength(51)
    expect(remaining.some((c) => c.suit === "heart" && c.rank === 3)).toBe(false)
  })

  it("returns correct cards when hand is full", () => {
    const hand: Card[] = [
      { suit: "spade", rank: 1 },
      { suit: "spade", rank: 2 },
      { suit: "spade", rank: 3 },
      { suit: "spade", rank: 4 },
      { suit: "spade", rank: 5 },
      { suit: "spade", rank: 6 },
      { suit: "spade", rank: 7 },
    ]
    const remaining = getRemainingCards(hand, [], [], null)
    expect(remaining).toHaveLength(45)
    expect(remaining.some((c) => c.suit === "spade" && c.rank === 1)).toBe(false)
  })
})

describe("getCompletionProbability", () => {
  it("returns 0 when remaining is empty", () => {
    const prob = getCompletionProbability([{ suit: "spade", rank: 7 }], [])
    expect(prob).toBe(0)
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
    const prob = getCompletionProbability(neededCards, remaining)
    expect(prob).toBeCloseTo(2 / 4, 2)
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

  it("returns 0 when neededCards is empty", () => {
    const remaining: Card[] = [{ suit: "spade", rank: 7 }]
    const prob = getCompletionProbability([], remaining)
    expect(prob).toBe(0)
  })

  it("counts jokers in remaining as additional matches", () => {
    const neededCards: Card[] = [{ suit: "spade", rank: 8 }]
    const remaining: Card[] = [
      { suit: "spade", rank: 8 },   // direct match
      { suit: "heart", rank: 3 },   // joker (jokerRank=3)
      { suit: "diamond", rank: 5 },
      { suit: "club", rank: 10 },
    ]
    // 1 direct match + 1 joker = 2 matches out of 4
    const prob = getCompletionProbability(neededCards, remaining, 3)
    expect(prob).toBeCloseTo(2 / 4, 2)
  })

  it("returns same result when jokerRank is null (no jokers)", () => {
    const neededCards: Card[] = [{ suit: "spade", rank: 7 }]
    const remaining: Card[] = [
      { suit: "spade", rank: 7 },
      { suit: "heart", rank: 3 },
    ]
    const prob = getCompletionProbability(neededCards, remaining, null)
    expect(prob).toBeCloseTo(1 / 2, 2)
  })
})
