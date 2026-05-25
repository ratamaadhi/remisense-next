import { describe, it, expect } from "vitest"
import { parseCard, formatCard, cardEquals, getRankValue, isJoker, SUITS, ALL_CARDS } from "./cardUtils"

describe("parseCard", () => {
  it("parses 7S to spade rank 7", () => {
    expect(parseCard("7S")).toEqual({ suit: "spade", rank: 7 })
  })
  it("parses KH to heart rank 13", () => {
    expect(parseCard("KH")).toEqual({ suit: "heart", rank: 13 })
  })
  it("parses AD to diamond rank 1", () => {
    expect(parseCard("AD")).toEqual({ suit: "diamond", rank: 1 })
  })
  it("parses 10C to club rank 10", () => {
    expect(parseCard("10C")).toEqual({ suit: "club", rank: 10 })
  })
  it("throws on invalid notation", () => {
    expect(() => parseCard("7X")).toThrow("Invalid card notation")
    expect(() => parseCard("??S")).toThrow("Invalid card notation")
  })
})

describe("formatCard", () => {
  it("formats spade 7 to 7♠", () => {
    expect(formatCard({ suit: "spade", rank: 7 })).toBe("7♠")
  })
  it("formats heart K to K♥", () => {
    expect(formatCard({ suit: "heart", rank: 13 })).toBe("K♥")
  })
  it("formats diamond A to A♦", () => {
    expect(formatCard({ suit: "diamond", rank: 1 })).toBe("A♦")
  })
  it("formats club 10 to 10♣", () => {
    expect(formatCard({ suit: "club", rank: 10 })).toBe("10♣")
  })
})

describe("cardEquals", () => {
  it("returns true for same card", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "spade", rank: 7 })).toBe(true)
  })
  it("returns false for different suit", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "heart", rank: 7 })).toBe(false)
  })
  it("returns false for different rank", () => {
    expect(cardEquals({ suit: "spade", rank: 7 }, { suit: "spade", rank: 8 })).toBe(false)
  })
})

describe("getRankValue", () => {
  it("returns 15 for Ace", () => {
    expect(getRankValue({ suit: "spade", rank: 1 })).toBe(15)
  })
  it("returns 5 for number cards (2-10)", () => {
    expect(getRankValue({ suit: "spade", rank: 2 })).toBe(5)
    expect(getRankValue({ suit: "spade", rank: 7 })).toBe(5)
    expect(getRankValue({ suit: "spade", rank: 10 })).toBe(5)
  })
  it("returns 10 for J", () => {
    expect(getRankValue({ suit: "spade", rank: 11 })).toBe(10)
  })
  it("returns 10 for Q", () => {
    expect(getRankValue({ suit: "spade", rank: 12 })).toBe(10)
  })
  it("returns 10 for K", () => {
    expect(getRankValue({ suit: "spade", rank: 13 })).toBe(10)
  })
})

describe("isJoker", () => {
  it("returns true when card rank matches jokerRank", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, 7)).toBe(true)
  })
  it("returns false when card rank does not match", () => {
    expect(isJoker({ suit: "spade", rank: 8 }, 7)).toBe(false)
  })
  it("returns false when jokerRank is null", () => {
    expect(isJoker({ suit: "spade", rank: 7 }, null)).toBe(false)
  })
})

describe("ALL_CARDS", () => {
  it("contains 52 cards", () => {
    expect(ALL_CARDS).toHaveLength(52)
  })
})
