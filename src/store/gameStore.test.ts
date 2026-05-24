import { describe, it, expect, beforeEach } from "vitest"
import { useGameStore } from "./gameStore"

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe("setup phase", () => {
    it("starts in setup phase", () => {
      expect(useGameStore.getState().gamePhase).toBe("setup")
    })

    it("sets player count", () => {
      useGameStore.getState().setPlayerCount(3)
      expect(useGameStore.getState().playerCount).toBe(3)
    })

    it("sets joker indicator and derives jokerRank", () => {
      useGameStore.getState().setJokerIndicator({ suit: "heart", rank: 7 })
      const state = useGameStore.getState()
      expect(state.jokerIndicator).toEqual({ suit: "heart", rank: 7 })
      expect(state.jokerRank).toBe(7)
    })

    it("adds initial discard cards", () => {
      useGameStore.getState().addInitialDiscard({ suit: "spade", rank: 3 })
      useGameStore.getState().addInitialDiscard({ suit: "heart", rank: 10 })
      expect(useGameStore.getState().discardPile).toHaveLength(2)
    })

    it("transitions to playing phase on startGame", () => {
      useGameStore.getState().startGame()
      expect(useGameStore.getState().gamePhase).toBe("playing")
    })
  })

  describe("playing phase", () => {
    beforeEach(() => {
      useGameStore.getState().startGame()
    })

    it("adds card to hand", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(1)
    })

    it("prevents duplicate card in hand", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(1)
    })

    it("removes card from hand and adds to discard pile", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().removeFromHand({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().hand).toHaveLength(0)
      expect(useGameStore.getState().discardPile).toContainEqual({ suit: "spade", rank: 7 })
    })

    it("adds card to discard pile (other player discard)", () => {
      useGameStore.getState().addToDiscardPile({ suit: "heart", rank: 10 })
      expect(useGameStore.getState().discardPile).toContainEqual({ suit: "heart", rank: 10 })
    })

    it("prevents adding card already in hand to discard", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().addToDiscardPile({ suit: "spade", rank: 7 })
      expect(useGameStore.getState().discardPile).not.toContainEqual({ suit: "spade", rank: 7 })
    })

    it("adds meld group", () => {
      const meld = [
        { suit: "spade" as const, rank: 9 },
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      expect(useGameStore.getState().visibleMelds).toHaveLength(1)
      expect(useGameStore.getState().visibleMelds[0]).toHaveLength(3)
    })

    it("removes meld group by index", () => {
      const meld = [
        { suit: "spade" as const, rank: 9 },
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      useGameStore.getState().removeMeldGroup(0)
      expect(useGameStore.getState().visibleMelds).toHaveLength(0)
    })

    it("does not add to discard when removing card not in hand", () => {
      const card = { suit: "spade" as const, rank: 7 }
      useGameStore.getState().removeFromHand(card) // card not in hand
      expect(useGameStore.getState().discardPile).not.toContainEqual(card)
      expect(useGameStore.getState().hand).toHaveLength(0)
    })

    it("prevents adding meld with card already in hand", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 9 })
      const meld = [
        { suit: "spade" as const, rank: 9 }, // already in hand
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      expect(useGameStore.getState().visibleMelds).toHaveLength(0)
    })

    it("rejects empty meld group", () => {
      useGameStore.getState().addMeldGroup([])
      expect(useGameStore.getState().visibleMelds).toHaveLength(0)
    })

    it("freed meld cards can be re-added to hand", () => {
      const meld = [
        { suit: "spade" as const, rank: 9 },
        { suit: "heart" as const, rank: 9 },
        { suit: "diamond" as const, rank: 9 },
      ]
      useGameStore.getState().addMeldGroup(meld)
      useGameStore.getState().removeMeldGroup(0)
      // After removal, card should be addable to hand again
      useGameStore.getState().addToHand({ suit: "spade", rank: 9 })
      expect(useGameStore.getState().hand).toContainEqual({ suit: "spade", rank: 9 })
    })
  })

  describe("pickupFromDiscard", () => {
    beforeEach(() => {
      useGameStore.setState({
        hand: [],
        discardPile: [],
        visibleMelds: [],
        jokerRank: null,
        jokerIndicator: null,
        gamePhase: "playing",
        playerCount: 4,
        recommendation: null,
      })
    })

    it("moves cards correctly across all zones", () => {
      useGameStore.setState({
        hand: [
          { suit: "spade", rank: 2 },
          { suit: "spade", rank: 3 },
          { suit: "diamond", rank: 9 },
        ],
        discardPile: [
          { suit: "heart", rank: 5 },
          { suit: "spade", rank: 4 },
        ],
      })

      useGameStore.getState().pickupFromDiscard(
        [{ suit: "spade", rank: 4 }],
        [{ suit: "spade", rank: 2 }, { suit: "spade", rank: 3 }, { suit: "spade", rank: 4 }],
        { suit: "diamond", rank: 9 }
      )

      const state = useGameStore.getState()
      expect(state.hand).toEqual([])
      expect(state.visibleMelds).toEqual([
        [{ suit: "spade", rank: 2 }, { suit: "spade", rank: 3 }, { suit: "spade", rank: 4 }],
      ])
      expect(state.discardPile).toEqual([
        { suit: "heart", rank: 5 },
        { suit: "diamond", rank: 9 },
      ])
    })

    it("does not leave duplicate cards in any zone", () => {
      useGameStore.setState({
        hand: [
          { suit: "heart", rank: 7 },
          { suit: "diamond", rank: 7 },
          { suit: "club", rank: 12 },
          { suit: "spade", rank: 1 },
        ],
        discardPile: [
          { suit: "spade", rank: 10 },
          { suit: "club", rank: 7 },
        ],
      })

      useGameStore.getState().pickupFromDiscard(
        [{ suit: "club", rank: 7 }],
        [{ suit: "heart", rank: 7 }, { suit: "diamond", rank: 7 }, { suit: "club", rank: 7 }],
        { suit: "club", rank: 12 }
      )

      const state = useGameStore.getState()
      const allCards = [
        ...state.hand,
        ...state.discardPile,
        ...state.visibleMelds.flat(),
      ]
      const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`))
      expect(uniqueKeys.size).toBe(allCards.length)
    })
  })

  describe("opponentPickupFromDiscard", () => {
    beforeEach(() => {
      useGameStore.setState({
        hand: [],
        discardPile: [],
        visibleMelds: [],
        jokerRank: null,
        jokerIndicator: null,
        gamePhase: "playing",
        playerCount: 4,
        recommendation: null,
      })
    })

    it("updates discardPile and visibleMelds correctly", () => {
      useGameStore.setState({
        discardPile: [
          { suit: "heart", rank: 1 },
          { suit: "diamond", rank: 5 },
          { suit: "club", rank: 8 },
        ],
      })

      useGameStore.getState().opponentPickupFromDiscard(
        [{ suit: "diamond", rank: 5 }, { suit: "club", rank: 8 }],
        [{ suit: "club", rank: 6 }, { suit: "club", rank: 7 }, { suit: "club", rank: 8 }],
        { suit: "spade", rank: 11 }
      )

      const state = useGameStore.getState()
      expect(state.discardPile).toEqual([
        { suit: "heart", rank: 1 },
        { suit: "spade", rank: 11 },
      ])
      expect(state.visibleMelds).toEqual([
        [{ suit: "club", rank: 6 }, { suit: "club", rank: 7 }, { suit: "club", rank: 8 }],
      ])
    })

    it("does not leave duplicate cards", () => {
      useGameStore.setState({
        discardPile: [
          { suit: "spade", rank: 3 },
          { suit: "heart", rank: 9 },
        ],
      })

      useGameStore.getState().opponentPickupFromDiscard(
        [{ suit: "heart", rank: 9 }],
        [{ suit: "heart", rank: 9 }, { suit: "heart", rank: 10 }, { suit: "heart", rank: 11 }],
        { suit: "diamond", rank: 2 }
      )

      const state = useGameStore.getState()
      const allCards = [
        ...state.discardPile,
        ...state.visibleMelds.flat(),
      ]
      const uniqueKeys = new Set(allCards.map((c) => `${c.suit}-${c.rank}`))
      expect(uniqueKeys.size).toBe(allCards.length)
    })
  })

  describe("resetGame", () => {
    it("resets all state to initial values", () => {
      useGameStore.getState().addToHand({ suit: "spade", rank: 7 })
      useGameStore.getState().setJokerIndicator({ suit: "heart", rank: 3 })
      useGameStore.getState().resetGame()
      const state = useGameStore.getState()
      expect(state.hand).toHaveLength(0)
      expect(state.discardPile).toHaveLength(0)
      expect(state.visibleMelds).toHaveLength(0)
      expect(state.jokerRank).toBeNull()
      expect(state.jokerIndicator).toBeNull()
      expect(state.gamePhase).toBe("setup")
      expect(state.recommendation).toBeNull()
    })
  })
})
