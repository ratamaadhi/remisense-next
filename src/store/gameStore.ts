import { create } from "zustand"
import type { Card, Recommendation, GamePhase } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"

type UndoableAction =
  | { type: "removeFromHand"; card: Card }
  | { type: "addToDiscardPile"; card: Card }

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
  lastAction: UndoableAction | null

  // setup actions
  setPlayerCount: (count: number) => void
  setJokerIndicator: (card: Card) => void
  addInitialDiscard: (card: Card) => void
  removeInitialDiscard: (card: Card) => void
  startGame: () => void

  // playing actions
  addToHand: (card: Card) => void
  removeFromHand: (card: Card) => void
  undoAddToHand: (card: Card) => void
  addToDiscardPile: (card: Card) => void
  addMeldGroup: (cards: Card[]) => void
  removeMeldGroup: (index: number) => void
  pickupFromDiscard: (cardsTaken: Card[], formedMeld: Card[], discardAfter: Card) => void
  opponentPickupFromDiscard: (cardsTaken: Card[], formedMeld: Card[], newDiscard: Card) => void
  layDownMeld: (cards: Card[]) => void
  setRecommendation: (rec: Recommendation | null) => void
  undo: () => void
  clearLastAction: () => void
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
  lastAction: null as UndoableAction | null,
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

  removeInitialDiscard: (card) => {
    const state = get()
    set({ discardPile: state.discardPile.filter((c) => !cardEquals(c, card)) })
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
    if (newHand.length === state.hand.length) return // card wasn't in hand
    set({ hand: newHand, discardPile: [...state.discardPile, card], lastAction: { type: "removeFromHand", card } })
  },

  undoAddToHand: (card) => {
    const state = get()
    set({ hand: state.hand.filter((c) => !cardEquals(c, card)) })
  },

  addToDiscardPile: (card) => {
    const state = get()
    if (isCardUsed(card, state)) return
    set({ discardPile: [...state.discardPile, card], lastAction: { type: "addToDiscardPile", card } })
  },

  addMeldGroup: (cards) => {
    if (cards.length === 0) return
    const state = get()
    const anyUsed = cards.some((card) => isCardUsed(card, state))
    if (anyUsed) return
    set({ visibleMelds: [...state.visibleMelds, cards] })
  },

  removeMeldGroup: (index) => {
    const state = get()
    set({ visibleMelds: state.visibleMelds.filter((_, i) => i !== index) })
  },

  pickupFromDiscard: (cardsTaken, formedMeld, discardAfter) => {
    const state = get()
    // 1. Remove cardsTaken from discardPile
    const newDiscardPile = state.discardPile.filter(
      (c) => !cardsTaken.some((t) => cardEquals(t, c))
    )
    // 2. Add cardsTaken to hand
    let newHand = [...state.hand, ...cardsTaken]
    // 3. Remove formedMeld cards from hand
    newHand = newHand.filter(
      (c) => !formedMeld.some((m) => cardEquals(m, c))
    )
    // 4. Remove discardAfter from hand
    newHand = newHand.filter((c) => !cardEquals(c, discardAfter))

    set({
      hand: newHand,
      discardPile: [...newDiscardPile, discardAfter],
      visibleMelds: [...state.visibleMelds, formedMeld],
    })
  },

  opponentPickupFromDiscard: (cardsTaken, formedMeld, newDiscard) => {
    const state = get()
    const newDiscardPile = state.discardPile.filter(
      (c) => !cardsTaken.some((t) => cardEquals(t, c))
    )

    set({
      discardPile: [...newDiscardPile, newDiscard],
      visibleMelds: [...state.visibleMelds, formedMeld],
    })
  },

  layDownMeld: (cards) => {
    if (cards.length < 3) return
    const state = get()
    const newHand = state.hand.filter(
      (c) => !cards.some((m) => cardEquals(m, c))
    )
    set({
      hand: newHand,
      visibleMelds: [...state.visibleMelds, cards],
    })
  },

  setRecommendation: (rec) => set({ recommendation: rec }),

  undo: () => {
    const state = get()
    if (!state.lastAction) return
    const { type, card } = state.lastAction
    if (type === "removeFromHand") {
      // Move card back from discard to hand
      set({
        hand: [...state.hand, card],
        discardPile: state.discardPile.filter((c) => !cardEquals(c, card)),
        lastAction: null,
      })
    } else if (type === "addToDiscardPile") {
      // Remove card from discard pile
      set({
        discardPile: state.discardPile.filter((c) => !cardEquals(c, card)),
        lastAction: null,
      })
    }
  },

  clearLastAction: () => set({ lastAction: null }),

  resetGame: () => set({ ...initialState }),
}))
