"use client"

import { useEffect } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { analyze } from "@/engine/recommendation/recommendationEngine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Selesaikan setup permainan untuk melihat rekomendasi.</p>
        </CardContent>
      </Card>
    )
  }

  if (!recommendation || hand.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Tambahkan kartu ke tangan untuk melihat rekomendasi.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rekomendasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discard suggestion */}
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-800 mb-2">Buang:</div>
          {recommendation.discard ? (
            <>
              <CardChip card={recommendation.discard} jokerRank={jokerRank} variant="danger" />
              <div className="mt-2 space-y-1">
                {recommendation.reasons.map((reason, i) => (
                  <div key={i} className="text-xs text-red-700 flex items-start gap-1">
                    <span className="mt-0.5">&bull;</span>
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
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Kombinasi Terkuat:</div>
              <div className="space-y-1">
                {recommendation.strongestCombos.map((combo, i) => (
                  <div key={i} className="flex items-center gap-1 flex-wrap">
                    <span className="text-green-600 text-xs">&check;</span>
                    {combo.cards.map((card) => (
                      <CardChip
                        key={`${card.suit}-${card.rank}`}
                        card={card}
                        jokerRank={jokerRank}
                        variant="success"
                        disabled
                      />
                    ))}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({combo.type === "set" ? "Set" : "Sequence"})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Near melds */}
        {recommendation.nearMelds.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Hampir Lengkap:</div>
              <div className="space-y-1">
                {recommendation.nearMelds.map((nm, i) => (
                  <div key={i} className="flex items-center gap-1 flex-wrap">
                    <span className="text-yellow-500 text-xs">&diams;</span>
                    {nm.cards.map((card) => (
                      <CardChip
                        key={`${card.suit}-${card.rank}`}
                        card={card}
                        jokerRank={jokerRank}
                        disabled
                      />
                    ))}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({Math.round(nm.completionProbability * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Risky cards */}
        {recommendation.riskyCards.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Kartu Berisiko:</div>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
