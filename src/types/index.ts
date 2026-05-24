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

/** Result of optimal meld allocation via backtracking solver */
export type MeldAllocation = {
  completedMelds: Meld[]
  nearMelds: NearMeld[]
  deadCards: Card[]
}

/** Result of the AI recommendation engine for the current hand */
export type Recommendation = {
  discard: Card | null  // null if hand is already complete or empty
  reasons: string[]
  strongestCombos: Meld[]
  nearMelds: NearMeld[]
  riskyCards: Card[]
}

/** All game state needed by the engine to compute recommendations */
export type GameContext = {
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  /** Cards not yet seen by the player — inferred from 52 minus all known cards */
  unseenCards: Card[]
  jokerRank: number | null
}

export type GameSetup = {
  playerCount: number
  jokerRank: number | null
  jokerIndicator: Card | null
}

export type GamePhase = "setup" | "playing"
