"use client"

import { useEffect } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { analyze } from "@/engine/recommendation/recommendationEngine"

export function RecommendationPanel() {
  const {
    hand,
    discardPile,
    visibleMelds,
    jokerRank,
    jokerIndicator,
    gamePhase,
    recommendation,
    setRecommendation,
  } = useGameStore()

  useEffect(() => {
    if (gamePhase !== "playing" || hand.length === 0) {
      setRecommendation(null)
      return
    }
    const result = analyze(hand, discardPile, visibleMelds, jokerRank, jokerIndicator)
    setRecommendation(result)
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, gamePhase])

  if (gamePhase !== "playing") {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Rekomendasi</h2>
        <p className="text-sm text-gray-400">Selesaikan setup permainan untuk melihat rekomendasi.</p>
      </div>
    )
  }

  if (!recommendation || hand.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Rekomendasi</h2>
        <p className="text-sm text-gray-400">Tambahkan kartu ke tangan untuk melihat rekomendasi.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Rekomendasi</h2>

      {/* Discard suggestion */}
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <div className="text-sm font-medium text-red-800 mb-2">Buang:</div>
        {recommendation.discard ? (
          <>
            <CardChip card={recommendation.discard} jokerRank={jokerRank} variant="danger" />
            <div className="mt-2 space-y-1">
              {recommendation.reasons.map((reason, i) => (
                <div key={i} className="text-xs text-red-700 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-red-700">Semua kartu adalah joker</p>
        )}
      </div>

      {/* Strongest combos */}
      {recommendation.strongestCombos.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Kombinasi Terkuat:</div>
          <div className="space-y-1">
            {recommendation.strongestCombos.map((combo, i) => (
              <div key={i} className="flex items-center gap-1 flex-wrap">
                <span className="text-green-600 text-xs">✓</span>
                {combo.cards.map((card) => (
                  <CardChip
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    jokerRank={jokerRank}
                    variant="success"
                    disabled
                  />
                ))}
                <span className="text-gray-500 text-xs ml-1">
                  ({combo.type === "set" ? "Set" : "Sequence"})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Near melds */}
      {recommendation.nearMelds.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Hampir Lengkap:</div>
          <div className="space-y-1">
            {recommendation.nearMelds.map((nm, i) => (
              <div key={i} className="flex items-center gap-1 flex-wrap">
                <span className="text-yellow-500 text-xs">◆</span>
                {nm.cards.map((card) => (
                  <CardChip
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    jokerRank={jokerRank}
                    disabled
                  />
                ))}
                <span className="text-gray-500 text-xs ml-1">
                  ({Math.round(nm.completionProbability * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risky cards */}
      {recommendation.riskyCards.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Kartu Berisiko:</div>
          <div className="flex flex-wrap gap-1">
            {recommendation.riskyCards.map((card) => (
              <CardChip
                key={`${card.suit}-${card.rank}`}
                card={card}
                jokerRank={jokerRank}
                variant="danger"
                disabled
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
