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
