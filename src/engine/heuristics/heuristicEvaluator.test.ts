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
  unseenCards: [],
  jokerRank: null,
}

describe("scoreCard", () => {
  it("gives high score to card in a completed set", () => {
    const card: Card = { suit: "spade", rank: 7 }
    const score = scoreCard(card, baseContext)
    // Card is in a completed set — should score well above an isolated card
    // comboPotential=1.0, flexibility=1/4, deadRisk=0, highPointPenalty≈0.054 → ~44.5
    expect(score).toBeGreaterThan(30)
  })

  it("gives low score to isolated high card", () => {
    const card: Card = { suit: "club", rank: 13 }
    const score = scoreCard(card, baseContext)
    expect(score).toBeLessThan(20)
  })

  it("gives maximum score to joker card", () => {
    const contextWithJoker: GameContext = { ...baseContext, jokerRank: 5 }
    const jokerCard: Card = { suit: "spade", rank: 5 }
    const score = scoreCard(jokerCard, contextWithJoker)
    expect(score).toBe(100)
  })

  it("gives higher score to card in near-meld than isolated card", () => {
    const nearMeldCard: Card = { suit: "spade", rank: 5 } // part of 5S,6S near-seq
    const isolatedCard: Card = { suit: "club", rank: 13 }
    const scoreNear = scoreCard(nearMeldCard, baseContext)
    const scoreIsolated = scoreCard(isolatedCard, baseContext)
    expect(scoreNear).toBeGreaterThan(scoreIsolated)
  })

  it("score is always between 0 and 100", () => {
    for (const card of baseContext.hand) {
      const score = scoreCard(card, baseContext)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it("gives higher score to card in completed meld than near-meld card", () => {
    const inMeld: Card = { suit: "spade", rank: 7 }    // in set 7S,7H,7D
    const inNearMeld: Card = { suit: "spade", rank: 5 } // in near-seq 5S,6S
    const scoreMeld = scoreCard(inMeld, baseContext)
    const scoreNear = scoreCard(inNearMeld, baseContext)
    expect(scoreMeld).toBeGreaterThan(scoreNear)
  })

  it("gives higher score when near-meld has high completion probability", () => {
    // Create context with unseenCards that include the needed card
    const contextWithUnseen: GameContext = {
      hand: [
        { suit: "spade", rank: 5 },
        { suit: "spade", rank: 6 },
        { suit: "club", rank: 13 },
      ],
      discardPile: [],
      visibleMelds: [],
      unseenCards: [
        { suit: "spade", rank: 4 },
        { suit: "spade", rank: 7 },
        { suit: "heart", rank: 2 },
      ],
      jokerRank: null,
    }
    const nearMeldCard: Card = { suit: "spade", rank: 5 }
    const isolatedCard: Card = { suit: "club", rank: 13 }
    const scoreNear = scoreCard(nearMeldCard, contextWithUnseen)
    const scoreIsolated = scoreCard(isolatedCard, contextWithUnseen)
    expect(scoreNear).toBeGreaterThan(scoreIsolated)
  })
})
