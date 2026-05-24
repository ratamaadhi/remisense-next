import type { Card } from "@/types"
import { ALL_CARDS, cardEquals } from "@/engine/cards/cardUtils"

/**
 * Returns all cards not yet seen by the player.
 * Excludes: hand, discard pile, visible melds, and the joker indicator card.
 * These are the cards that could potentially be drawn from the deck.
 *
 * Assumes: single standard 52-card deck.
 * Assumes: inputs are disjoint (same card should not appear in multiple inputs).
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
 * Formula: (needed cards + jokers available) / total remaining cards.
 *
 * Jokers (cards matching jokerRank) in the remaining pool can satisfy any needed card,
 * so they are counted as additional matches.
 *
 * Note: This is a simplified single-draw probability, not a multi-draw calculation.
 * Note: Assumes a single standard 52-card deck.
 */
export function getCompletionProbability(
  neededCards: Card[],
  remaining: Card[],
  jokerRank: number | null = null
): number {
  if (remaining.length === 0 || neededCards.length === 0) return 0

  // Deduplicate neededCards to avoid inflating count
  const uniqueNeeded = neededCards.filter(
    (card, index, self) => self.findIndex((c) => cardEquals(c, card)) === index
  )

  const availableNeeded = uniqueNeeded.filter((needed) =>
    remaining.some((r) => cardEquals(r, needed))
  )

  // Count jokers in remaining pool (they can substitute any needed card)
  const jokersInRemaining =
    jokerRank !== null
      ? remaining.filter((r) => r.rank === jokerRank).length
      : 0

  // Total matches = specific needed cards + jokers (capped at remaining.length)
  const totalMatches = Math.min(
    availableNeeded.length + jokersInRemaining,
    remaining.length
  )

  return totalMatches / remaining.length
}

/**
 * Returns N kartu teratas dari tumpukan buangan.
 * Index terakhir array discardPile = kartu paling atas.
 * Returns semua kartu jika pile.length < n.
 */
export function getTopNDiscards(discardPile: Card[], n: number): Card[] {
  if (discardPile.length === 0) return []
  const startIndex = Math.max(0, discardPile.length - n)
  return discardPile.slice(startIndex)
}
