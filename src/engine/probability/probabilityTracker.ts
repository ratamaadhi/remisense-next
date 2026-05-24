import type { Card } from "@/types"
import { ALL_CARDS, cardEquals } from "@/engine/cards/cardUtils"

/**
 * Returns all cards not yet seen by the player.
 * Excludes: hand, discard pile, visible melds, and the joker indicator card.
 * These are the cards that could potentially be drawn from the deck.
 */
export function getRemainingCards(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerIndicator: Card | null
): Card[] {
  const knownCards: Card[] = [
    ...hand,
    ...discardPile,
    ...visibleMelds.flat(),
    ...(jokerIndicator ? [jokerIndicator] : []),
  ]

  return ALL_CARDS.filter(
    (card) => !knownCards.some((known) => cardEquals(card, known))
  )
}

/**
 * Estimates the probability of drawing at least one needed card on the next draw.
 * Formula: count of needed cards available in remaining pool / total remaining cards.
 *
 * Note: This is a simplified single-draw probability, not a multi-draw calculation.
 */
export function getCompletionProbability(
  neededCards: Card[],
  remaining: Card[]
): number {
  if (remaining.length === 0 || neededCards.length === 0) return 0

  const availableNeeded = neededCards.filter((needed) =>
    remaining.some((r) => cardEquals(r, needed))
  )

  return availableNeeded.length / remaining.length
}
