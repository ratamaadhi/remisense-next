import type { Card, GameContext } from "@/types"
import { cardEquals, getRankValue } from "@/engine/cards/cardUtils"
import { isJoker, detectSets, detectSequences, detectNearMelds } from "@/engine/melds/meldDetector"
import { getRemainingCards, getCompletionProbability } from "@/engine/probability/probabilityTracker"

/**
 * Scores a card based on its strategic value in the current hand.
 * Higher score = more valuable to keep.
 * Lower score = better candidate for discard.
 *
 * Formula:
 *   score = (comboPotential × 40) + (completionChance × 30) + (flexibility × 20)
 *           - (deadRisk × 25) - (highPointPenalty × 10)
 *
 * All components are normalized to [0, 1].
 * Final score is clamped to [0, 100].
 */
export function scoreCard(card: Card, context: GameContext): number {
  const { hand, discardPile, visibleMelds, unseenCards, jokerRank } = context

  // Joker cards get maximum score — never discard a joker
  if (isJoker(card, jokerRank)) {
    return 100
  }

  const allSets = detectSets(hand, jokerRank)
  const allSequences = detectSequences(hand, jokerRank)
  const allMelds = [...allSets, ...allSequences]
  const rawNearMelds = detectNearMelds(hand, jokerRank)

  // Populate completionProbability using probability tracker
  // Use unseenCards if available, otherwise compute from context
  const remaining = unseenCards.length > 0
    ? unseenCards
    : getRemainingCards(hand, discardPile, visibleMelds, null)

  const nearMelds = rawNearMelds.map((nm) => ({
    ...nm,
    completionProbability: getCompletionProbability(nm.neededCards, remaining, jokerRank),
  }))

  // comboPotential: how many completed melds this card participates in, normalized by cap of 3
  const meldsWithCard = allMelds.filter((m) =>
    m.cards.some((c) => cardEquals(c, card))
  )
  const comboPotential = Math.min(meldsWithCard.length / 3, 1.0)

  // completionChance: average completionProbability of near-melds involving this card (0-1)
  const nearMeldsWithCard = nearMelds.filter((nm) =>
    nm.cards.some((c) => cardEquals(c, card))
  )
  const completionChance = nearMeldsWithCard.length > 0
    ? nearMeldsWithCard.reduce((sum, nm) => sum + nm.completionProbability, 0) / nearMeldsWithCard.length
    : 0

  // flexibility: normalized count of combos this card can form
  // Cap of 4 = a card can realistically be in at most ~4 different meld combinations
  const totalCombos = meldsWithCard.length + nearMeldsWithCard.length
  const flexibility = Math.min(totalCombos / 4, 1.0)

  // deadRisk: 1.0 if isolated, 0.3 if only in near-meld, 0.0 if in completed meld
  const isInMeld = meldsWithCard.length > 0
  const isInNearMeld = nearMeldsWithCard.length > 0
  const deadRisk = isInMeld ? 0 : isInNearMeld ? 0.3 : 1.0

  // highPointPenalty: based on actual game point value via getRankValue, normalized to [0, 1]
  // getRankValue returns 1-10 for number cards, 10 for face cards
  const pointValue = getRankValue(card)
  const highPointPenalty = pointValue / 10

  const score =
    (comboPotential * 40) +
    (completionChance * 30) +
    (flexibility * 20) -
    (deadRisk * 25) -
    (highPointPenalty * 10)

  return Math.max(0, Math.min(100, score))
}
