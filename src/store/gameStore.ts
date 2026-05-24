import { create } from "zustand"
import type { Card, Recommendation, GamePhase } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"

type GameState = {
  // setup state
  playerCount: number
  jokerRank: number | null
  jokerIndicator: Card | null
  gamePhase: GamePhase

  // playing state
  hand: Card[]
  discardPile: Card[]
  visibleMelds: Card[][]
  recommendation: Recommendation | null

  // setup actions
  setPlayerCount: (count: number) => void
  setJokerIndicator: (card: Card) => void
  addInitialDiscard: (card: Card) => void
  startGame: () => void

  // playing actions
  addToHand: (card: Card) => void
  removeFromHand: (card: Card) => void
  addToDiscardPile: (card: Card) => void
  addMeldGroup: (cards: Card[]) => void
  removeMeldGroup: (index: number) => void
  setRecommendation: (rec: Recommendation | null) => void
  resetGame: () => void
}

/** Returns true if the card is already used in any game zone */
function isCardUsed(
  card: Card,
  state: Pick<GameState, "hand" | "discardPile" | "visibleMelds" | "jokerIndicator">
): boolean {
  const allUsed: Card[] = [
    ...state.hand,
    ...state.discardPile,
    ...state.visibleMelds.flat(),
    ...(state.jokerIndicator ? [state.jokerIndicator] : []),
  ]
  return allUsed.some((c) => cardEquals(c, card))
}

const initialState = {
  playerCount: 4,
  jokerRank: null as number | null,
  jokerIndicator: null as Card | null,
  gamePhase: "setup" as GamePhase,
  hand: [] as Card[],
  discardPile: [] as Card[],
  visibleMelds: [] as Card[][],
  recommendation: null as Recommendation | null,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setPlayerCount: (count) => set({ playerCount: count }),

  setJokerIndicator: (card) =>
    set({ jokerIndicator: card, jokerRank: card.rank }),

  addInitialDiscard: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ discardPile: [...state.discardPile, card] })
  },

  startGame: () => set({ gamePhase: "playing" }),

  addToHand: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ hand: [...state.hand, card] })
  },

  removeFromHand: (card) => {
    const state = get()
    const newHand = state.hand.filter((c) => !cardEquals(c, card))
    set({
      hand: newHand,
      discardPile: [...state.discardPile, card],
    })
  },

  addToDiscardPile: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ discardPile: [...state.discardPile, card] })
  },

  addMeldGroup: (cards) => {
    const state = get()
    const anyUsed = cards.some((card) => isCardUsed(card, state))
    if (anyUsed) return
    set({ visibleMelds: [...state.visibleMelds, cards] })
  },

  removeMeldGroup: (index) => {
    const state = get()
    set({ visibleMelds: state.visibleMelds.filter((_, i) => i !== index) })
  },

  setRecommendation: (rec) => set({ recommendation: rec }),

  resetGame: () => set({ ...initialState }),
}))
