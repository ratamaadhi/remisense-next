import type { Card, Suit } from "@/types"

export const SUITS: Suit[] = ["spade", "heart", "diamond", "club"]

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
}

const SUIT_CODES: Record<string, Suit> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
}

const RANK_NAMES: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
}

const RANK_CODES: Record<string, number> = {
  A: 1,
  J: 11,
  Q: 12,
  K: 13,
}

export const ALL_CARDS: Card[] = SUITS.flatMap((suit) =>
  Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1 }))
)

export function parseCard(notation: string): Card {
  const suitCode = notation.slice(-1)
  const rankStr = notation.slice(0, -1)
  const suit = SUIT_CODES[suitCode]
  const rank = RANK_CODES[rankStr] ?? parseInt(rankStr, 10)
  return { suit, rank }
}

export function formatCard(card: Card): string {
  const rankStr = RANK_NAMES[card.rank] ?? String(card.rank)
  return rankStr + SUIT_SYMBOLS[card.suit]
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function getRankValue(card: Card): number {
  if (card.rank >= 11) return 10
  return card.rank
}

export function isJoker(card: Card, jokerRank: number | null): boolean {
  if (jokerRank === null) return false
  return card.rank === jokerRank
}
