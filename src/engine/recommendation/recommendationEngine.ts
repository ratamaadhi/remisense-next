import type { Card, Recommendation, GameContext, NearMeld } from "@/types"
import { cardEquals } from "@/engine/cards/cardUtils"
import { isJoker, detectNearMelds } from "@/engine/melds/meldDetector"
import { solveOptimalMelds } from "@/engine/solver/combinationSolver"
import { getRemainingCards, getCompletionProbability } from "@/engine/probability/probabilityTracker"
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

  // Pick discard: lowest score card that is NOT a joker
  const discardCandidate = cardScores.find((cs) => !isJoker(cs.card, jokerRank))
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
