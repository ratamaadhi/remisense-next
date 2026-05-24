export type Suit = "spade" | "heart" | "diamond" | "club"

export type Card = {
  suit: Suit
  rank: number // 1=A, 2-10, 11=J, 12=Q, 13=K
}

export type Meld = {
  cards: Card[]
  type: "set" | "sequence"
}

export type NearMeld = {
  cards: Card[]
  type: "near-set" | "near-sequence"
  neededCards: Card[]
  completionProbability: number
}

export type MeldAllocation = {
  completedMelds: Meld[]
  nearMelds: NearMeld[]
  deadCards: Card[]
}

export type Recommendation = {
  discard: Card
  reasons: string[]
  strongestCombos: Meld[]
  nearMelds: NearMeld[]
  riskyCards: Card[]
}

export type GameContext = {
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  remainingCards: Card[]
  jokerRank: number | null
}

export type GameSetup = {
  playerCount: number
  jokerRank: number | null
  jokerIndicator: Card | null
}

export type GamePhase = "setup" | "playing"
