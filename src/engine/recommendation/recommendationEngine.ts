import type { Card, Recommendation, GameContext, NearMeld, DiscardPickupOption, DiscardPickupRecommendation } from "@/types"
import { cardEquals, isMeldSequence } from "@/engine/cards/cardUtils"
import { isJoker, detectNearMelds } from "@/engine/melds/meldDetector"
import { solveOptimalMelds } from "@/engine/solver/combinationSolver"
import { getRemainingCards, getCompletionProbability, getTopNDiscards } from "@/engine/probability/probabilityTracker"
import { scoreCard } from "@/engine/heuristics/heuristicEvaluator"

/**
 * Main recommendation engine.
 * Analyzes the current game state and returns the best discard recommendation
 * along with combo analysis and risk assessment.
 */
export function analyze(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerRank: number | null,
  jokerIndicator: Card | null
): Recommendation {
  if (hand.length === 0) {
    return {
      discard: null,
      reasons: ["Tidak ada kartu di tangan"],
      strongestCombos: [],
      nearMelds: [],
      riskyCards: [],
    }
  }

  // Compute unseen cards for probability tracking
  const unseenCards = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)

  // Build game context
  const context: GameContext = {
    hand,
    discardPile,
    visibleMelds,
    unseenCards,
    jokerRank,
  }

  // Solve optimal meld allocation
  const allocation = solveOptimalMelds(hand, jokerRank)

  // Compute near-melds with actual completion probabilities
  const nearMelds: NearMeld[] = detectNearMelds(hand, jokerRank).map((nm) => ({
    ...nm,
    completionProbability: getCompletionProbability(nm.neededCards, unseenCards, jokerRank),
  }))

  // Score each card — lower score = better discard candidate
  const cardScores = hand.map((card) => ({
    card,
    score: scoreCard(card, context),
  }))

  // Sort ascending — lowest score first (best discard candidate)
  cardScores.sort((a, b) => a.score - b.score)

  // If all cards are in completed melds, no discard needed
  const allCardsInMelds =
    allocation.completedMelds.flatMap((m) => m.cards).length === hand.length

  // Pick discard: lowest score card that is NOT a joker, unless hand is complete
  const discardCandidate = allCardsInMelds
    ? null
    : cardScores.find((cs) => !isJoker(cs.card, jokerRank))
  const discard = discardCandidate ? discardCandidate.card : null

  // Generate reasons in Indonesian
  const reasons = discard
    ? generateReasons(discard, context, allocation, nearMelds)
    : ["Semua kartu adalah joker"]

  // Identify risky cards: high-rank cards with low strategic value (score < 15 and rank >= 10)
  // Note: score < 15 captures cards that are isolated OR in near-melds with very low completion probability
  // Reuse cardScores already computed above to avoid redundant scoreCard calls
  const riskyCards = cardScores
    .filter(({ card, score }) => !isJoker(card, jokerRank) && score < 15 && card.rank >= 10)
    .map(({ card }) => card)

  return {
    discard,
    reasons,
    strongestCombos: allocation.completedMelds,
    nearMelds,
    riskyCards,
  }
}

/**
 * Analyzes all pickup opportunities from the discard pile.
 * For each card in the top 7, checks if it can form a meld with the hand.
 */
export function analyzeDiscardPickup(
  hand: Card[],
  discardPile: Card[],
  visibleMelds: Card[][],
  jokerRank: number | null,
  jokerIndicator: Card | null
): DiscardPickupRecommendation {
  const top7 = getTopNDiscards(discardPile, 7)

  if (top7.length === 0) {
    return { options: [], bestOption: null, drawDeckScore: 0 }
  }

  // Check if player already has a sequence meld in visibleMelds
  // If not, only sequence melds are allowed for pickup from discard
  const hasSequenceMeld = visibleMelds.some((meld) => isMeldSequence(meld, jokerRank))

  // Compute drawDeckScore baseline
  const unseenCards = getRemainingCards(hand, discardPile, visibleMelds, jokerIndicator)
  const nearMelds = detectNearMelds(hand, jokerRank).map((nm) => ({
    ...nm,
    completionProbability: getCompletionProbability(nm.neededCards, unseenCards, jokerRank),
  }))
  const drawDeckScore = nearMelds.length > 0
    ? (nearMelds.reduce((sum, nm) => sum + nm.completionProbability, 0) / nearMelds.length) * 30
    : 0

  const options: DiscardPickupOption[] = []

  // top7 is ordered oldest-to-newest (index 0 = deepest, last = top)
  // targetIndex 1 = top card = top7[top7.length - 1]
  for (let i = 0; i < top7.length; i++) {
    const targetCard = top7[i]
    const targetIndex = top7.length - i // 1 = top, 7 = deepest
    const cardsTaken = top7.slice(i) // from target to top (inclusive)

    // Simulate hand after pickup
    const simulatedHand = [...hand, ...cardsTaken]

    // Check if targetCard participates in a completed meld
    const allocation = solveOptimalMelds(simulatedHand, jokerRank)
    const meldWithTarget = allocation.completedMelds.find((m) =>
      m.cards.some((c) => cardEquals(c, targetCard))
    )

    if (!meldWithTarget) continue

    // Enforce sequence-only constraint:
    // If player doesn't have a sequence meld yet, only sequence pickups are allowed
    if (!hasSequenceMeld && meldWithTarget.type === "set") continue

    // Calculate netScore
    const meldValue = meldWithTarget.cards.length * 10
    const costOfExtras = (cardsTaken.length - 1) * 5
    const netScore = meldValue - costOfExtras
    const worthIt = netScore > drawDeckScore

    // Find suggested discard from simulated hand (excluding meld cards)
    const handAfterMeld = simulatedHand.filter(
      (c) => !meldWithTarget.cards.some((mc) => cardEquals(mc, c))
    )
    const context: GameContext = {
      hand: handAfterMeld,
      discardPile: discardPile.filter((c) => !cardsTaken.some((t) => cardEquals(t, c))),
      visibleMelds: [...visibleMelds, meldWithTarget.cards],
      unseenCards,
      jokerRank,
    }
    const cardScores = handAfterMeld.map((card) => ({
      card,
      score: scoreCard(card, context),
    }))
    cardScores.sort((a, b) => a.score - b.score)
    const suggestedDiscard = cardScores[0]?.card ?? hand[0]

    // Generate reasons
    const reasons: string[] = []
    reasons.push(`Membentuk ${meldWithTarget.type === "set" ? "set" : "sequence"} dengan ${meldWithTarget.cards.length} kartu`)
    if (cardsTaken.length > 1) {
      reasons.push(`Mengambil ${cardsTaken.length} kartu (${cardsTaken.length - 1} kartu bonus)`)
    }
    if (worthIt) {
      reasons.push("Lebih menguntungkan daripada draw dari deck")
    } else {
      reasons.push("Biaya kartu bonus terlalu tinggi — draw dari deck mungkin lebih baik")
    }

    options.push({
      targetCard,
      targetIndex,
      cardsTaken,
      formedMeld: meldWithTarget,
      suggestedDiscard,
      netScore,
      worthIt,
      reasons,
    })
  }

  options.sort((a, b) => b.netScore - a.netScore)
  const bestOption = options.length > 0 ? options[0] : null

  return { options, bestOption, drawDeckScore }
}

// Note: allocation.nearMelds is not used here because nearMelds parameter
// already contains near-melds with real completionProbability values
// (allocation.nearMelds has completionProbability=0)
function generateReasons(
  discard: Card,
  context: GameContext,
  allocation: ReturnType<typeof solveOptimalMelds>,
  nearMelds: NearMeld[]
): string[] {
  const reasons: string[] = []

  const isInMeld = allocation.completedMelds.some((m) =>
    m.cards.some((c) => cardEquals(c, discard))
  )
  const isInNearMeld = nearMelds.some((nm) =>
    nm.cards.some((c) => cardEquals(c, discard))
  )

  if (!isInMeld && !isInNearMeld) {
    reasons.push("Kartu terisolasi — tidak masuk kombinasi apapun")
  }

  if (discard.rank >= 10) {
    reasons.push("Kartu bernilai tinggi — risiko poin besar jika kalah")
  }

  if (isInNearMeld) {
    const relevantNearMelds = nearMelds.filter((nm) =>
      nm.cards.some((c) => cardEquals(c, discard))
    )
    const avgProb =
      relevantNearMelds.reduce((sum, nm) => sum + nm.completionProbability, 0) /
      relevantNearMelds.length
    if (avgProb < 0.15) {
      reasons.push(
        `Probabilitas melengkapi kombinasi rendah (${Math.round(avgProb * 100)}%)`
      )
    } else {
      reasons.push(
        `Peluang melengkapi kombinasi tidak cukup tinggi (${Math.round(avgProb * 100)}%)`
      )
    }
  }

  const score = scoreCard(discard, context)
  if (score < 10) {
    reasons.push("Sinergi rendah dengan kartu lain di tangan")
  }

  if (reasons.length === 0) {
    reasons.push("Kartu dengan nilai strategis terendah di tangan")
  }

  return reasons
}
