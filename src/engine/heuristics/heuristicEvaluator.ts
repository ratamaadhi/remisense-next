import type { Card, GameContext } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"
import { isJoker, detectSets, detectSequences, detectNearMelds } from "@/engine/melds/meldDetector"

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
  const { hand, jokerRank } = context

  // Joker cards get maximum score — never discard a joker
  if (isJoker(card, jokerRank)) {
    return 100
  }

  const allSets = detectSets(hand, jokerRank)
  const allSequences = detectSequences(hand, jokerRank)
  const allMelds = [...allSets, ...allSequences]
  const nearMelds = detectNearMelds(hand, jokerRank)

  // comboPotential: fraction of detected melds this card participates in (0-1)
  const meldsWithCard = allMelds.filter((m) =>
    m.cards.some((c) => cardEquals(c, card))
  )
  const comboPotential = allMelds.length > 0
    ? Math.min(meldsWithCard.length / allMelds.length, 1.0)
    : 0

  // completionChance: average completionProbability of near-melds involving this card (0-1)
  const nearMeldsWithCard = nearMelds.filter((nm) =>
    nm.cards.some((c) => cardEquals(c, card))
  )
  const completionChance = nearMeldsWithCard.length > 0
    ? nearMeldsWithCard.reduce((sum, nm) => sum + nm.completionProbability, 0) / nearMeldsWithCard.length
    : 0

  // flexibility: normalized count of combos (melds + near-melds) this card can form (0-1)
  const totalCombos = meldsWithCard.length + nearMeldsWithCard.length
  const flexibility = Math.min(totalCombos / 4, 1.0)

  // deadRisk: 1.0 if isolated, 0.3 if only in near-meld, 0.0 if in completed meld
  const isInMeld = meldsWithCard.length > 0
  const isInNearMeld = nearMeldsWithCard.length > 0
  const deadRisk = isInMeld ? 0 : isInNearMeld ? 0.3 : 1.0

  // highPointPenalty: normalized rank penalty (0-1), higher for face cards
  const highPointPenalty = card.rank >= 10 ? card.rank / 13 : card.rank / 26

  const score =
    (comboPotential * 40) +
    (completionChance * 30) +
    (flexibility * 20) -
    (deadRisk * 25) -
    (highPointPenalty * 10)

  return Math.max(0, Math.min(100, score))
}
