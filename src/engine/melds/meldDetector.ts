import type { Card, Meld, NearMeld } from "@/types"
import { isJoker, cardEquals } from "@/engine/cards/cardUtils"

export { isJoker }

/**
 * Detects all possible sets in the hand.
 * NOTE: Returned melds may share joker cards. The combination solver
 * handles conflict resolution.
 */
export function detectSets(hand: Card[], jokerRank: number | null): Meld[] {
  const melds: Meld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))
  const jokers = hand.filter((c) => isJoker(c, jokerRank))

  const byRank = new Map<number, Card[]>()
  for (const card of nonJokers) {
    const group = byRank.get(card.rank) || []
    group.push(card)
    byRank.set(card.rank, group)
  }

  for (const [, cards] of byRank) {
    if (cards.length >= 3) {
      melds.push({ cards: [...cards], type: "set" })
    } else if (cards.length === 2 && jokers.length > 0) {
      melds.push({ cards: [...cards, jokers[0]], type: "set" })
    }
  }

  return melds
}

/**
 * Detects all possible sequences in the hand.
 * NOTE: Returned melds may share joker cards when multiple sequences
 * are possible. The combination solver is responsible for allocating
 * jokers to non-overlapping melds.
 */
export function detectSequences(hand: Card[], jokerRank: number | null): Meld[] {
  const melds: Meld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))
  const jokers = hand.filter((c) => isJoker(c, jokerRank))

  const bySuit = new Map<string, Card[]>()
  for (const card of nonJokers) {
    const group = bySuit.get(card.suit) || []
    group.push(card)
    bySuit.set(card.suit, group)
  }

  for (const [, cards] of bySuit) {
    const sorted = [...cards].sort((a, b) => a.rank - b.rank)
    const jokersAvailable = jokers.length

    let i = 0
    while (i < sorted.length) {
      const sequence: Card[] = [sorted[i]]
      let currentRank = sorted[i].rank
      let j = i + 1
      let usedJokers = 0

      while (j < sorted.length) {
        const nextCard = sorted[j]

        if (nextCard.rank === currentRank + 1) {
          sequence.push(nextCard)
          currentRank = nextCard.rank
          j++
        } else if (nextCard.rank === currentRank + 2 && jokersAvailable - usedJokers > 0) {
          sequence.push(jokers[usedJokers])
          usedJokers++
          currentRank = currentRank + 1
          // don't advance j — re-check nextCard at new currentRank
        } else {
          break
        }
      }

      if (sequence.length >= 3) {
        melds.push({ cards: [...sequence], type: "sequence" })
      }
      i = j > i + 1 ? j : i + 1
    }
  }

  return melds
}

export function detectNearMelds(hand: Card[], jokerRank: number | null): NearMeld[] {
  const nearMelds: NearMeld[] = []
  const nonJokers = hand.filter((c) => !isJoker(c, jokerRank))
  const jokers = hand.filter((c) => isJoker(c, jokerRank))

  // Near-sets: 2 cards with same rank
  const byRank = new Map<number, Card[]>()
  for (const card of nonJokers) {
    const group = byRank.get(card.rank) || []
    group.push(card)
    byRank.set(card.rank, group)
  }

  for (const [rank, cards] of byRank) {
    if (cards.length === 2) {
      const usedSuits = cards.map((c) => c.suit)
      const neededCards: Card[] = (["spade", "heart", "diamond", "club"] as const)
        .filter((s) => !usedSuits.includes(s))
        .map((s) => ({ suit: s, rank }))

      nearMelds.push({
        cards: [...cards],
        type: "near-set",
        neededCards,
        completionProbability: 0,
      })
    }
  }

  // Near-sequences: 2 consecutive same-suit cards or gap of 1
  const bySuit = new Map<string, Card[]>()
  for (const card of nonJokers) {
    const group = bySuit.get(card.suit) || []
    group.push(card)
    bySuit.set(card.suit, group)
  }

  for (const [suit, cards] of bySuit) {
    const sorted = [...cards].sort((a, b) => a.rank - b.rank)

    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i + 1].rank - sorted[i].rank

      if (diff === 1) {
        const neededCards: Card[] = []
        if (sorted[i].rank > 1) {
          neededCards.push({ suit: suit as Card["suit"], rank: sorted[i].rank - 1 })
        }
        if (sorted[i + 1].rank < 13) {
          neededCards.push({ suit: suit as Card["suit"], rank: sorted[i + 1].rank + 1 })
        }
        nearMelds.push({
          cards: [sorted[i], sorted[i + 1]],
          type: "near-sequence",
          neededCards,
          completionProbability: 0,
        })
      } else if (diff === 2) {
        const neededCards: Card[] = [{ suit: suit as Card["suit"], rank: sorted[i].rank + 1 }]
        nearMelds.push({
          cards: [sorted[i], sorted[i + 1]],
          type: "near-sequence",
          neededCards,
          completionProbability: 0,
        })
      }
    }
  }

  // Joker-assisted near-melds: joker + 1 non-joker card = near-meld
  if (jokers.length > 0) {
    for (const card of nonJokers) {
      // joker + any card = near-set (needs 1 more of same rank)
      const usedSuits = [card.suit]
      const neededForSet: Card[] = (["spade", "heart", "diamond", "club"] as const)
        .filter((s) => !usedSuits.includes(s))
        .map((s) => ({ suit: s, rank: card.rank }))

      // Only add if not already covered by existing near-set
      const alreadyCovered = nearMelds.some(
        (nm) => nm.type === "near-set" && nm.cards.some((c) => cardEquals(c, card))
      )
      if (!alreadyCovered) {
        nearMelds.push({
          cards: [card, jokers[0]],
          type: "near-set",
          neededCards: neededForSet.slice(0, 1), // need 1 more
          // completionProbability is intentionally 0 here.
          // It will be calculated by probabilityTracker.getCompletionProbability()
          // when the recommendation engine builds the full GameContext.
          completionProbability: 0,
        })
      }
    }
  }

  return nearMelds
}
