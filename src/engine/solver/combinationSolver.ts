import type { Card, Meld, MeldAllocation } from "@/types"
import { detectSets, detectSequences, detectNearMelds } from "@/engine/melds/meldDetector"
import { cardEquals } from "@/engine/cards/cardUtils"

/**
 * Finds the optimal allocation of cards into melds using backtracking.
 * Maximizes the total number of cards in completed melds.
 *
 * NOTE: detectSets and detectSequences may return melds sharing joker cards.
 * This solver resolves conflicts by checking card overlap before allocating.
 */
export function solveOptimalMelds(hand: Card[], jokerRank: number | null): MeldAllocation {
  if (hand.length === 0) {
    return { completedMelds: [], nearMelds: [], deadCards: [] }
  }

  const allSets = detectSets(hand, jokerRank)
  const allSequences = detectSequences(hand, jokerRank)
  const allMelds = [...allSets, ...allSequences]

  let bestAllocation: Meld[] = []
  let bestCardCount = 0

  function backtrack(index: number, usedCards: Card[], currentMelds: Meld[]) {
    const currentCardCount = usedCards.length

    // Branch-and-bound: prune if remaining melds can't beat current best
    const remainingPotential = allMelds
      .slice(index)
      .reduce((sum, m) => sum + m.cards.length, 0)
    if (currentCardCount + remainingPotential <= bestCardCount) return

    if (currentCardCount > bestCardCount) {
      bestCardCount = currentCardCount
      bestAllocation = [...currentMelds]
    }

    for (let i = index; i < allMelds.length; i++) {
      const meld = allMelds[i]
      const hasConflict = meld.cards.some((card) =>
        usedCards.some((used) => cardEquals(card, used))
      )

      if (!hasConflict) {
        backtrack(
          i + 1,
          [...usedCards, ...meld.cards],
          [...currentMelds, meld]
        )
      }
    }
  }

  backtrack(0, [], [])

  const usedInMelds = bestAllocation.flatMap((m) => m.cards)
  const remainingCards = hand.filter(
    (card) => !usedInMelds.some((used) => cardEquals(card, used))
  )

  // Cards that appeared in any detected meld candidate (but weren't allocated)
  // are considered "contested" only if the entire meld was available but lost
  // conflict resolution (i.e., none of its cards were taken by the winning allocation).
  // If some cards in the unallocated meld were taken, the meld was broken by conflict —
  // the remaining cards are free for near-meld detection.
  const contestedCards = allMelds
    .filter((m) => !bestAllocation.includes(m))
    .filter((m) => m.cards.every((card) => !usedInMelds.some((used) => cardEquals(card, used))))
    .flatMap((m) => m.cards)

  const cardsForNearMelds = remainingCards.filter(
    (card) => !contestedCards.some((c) => cardEquals(c, card))
  )

  const nearMelds = detectNearMelds(cardsForNearMelds, jokerRank)

  // deadCards = remaining cards not part of any near-meld
  const nearMeldCards = nearMelds.flatMap((nm) => nm.cards)
  const deadCards = remainingCards.filter(
    (card) => !nearMeldCards.some((c) => cardEquals(c, card))
  )

  return {
    completedMelds: bestAllocation,
    nearMelds,
    deadCards,
  }
}
