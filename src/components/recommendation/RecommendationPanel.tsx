"use client";

import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { CardChip } from "@/components/hand/CardChip";
import { analyze, analyzeDiscardPickup } from "@/engine/recommendation/recommendationEngine";
import type { DiscardPickupRecommendation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  } = useGameStore();

  useEffect(() => {
    if (gamePhase !== "playing" || hand.length === 0) {
      setRecommendation(null);
      return;
    }
    const result = analyze(hand, discardPile, visibleMelds, jokerRank, jokerIndicator);
    setRecommendation(result);
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, gamePhase]);

  const pickupRec: DiscardPickupRecommendation | null = useMemo(() => {
    if (gamePhase !== "playing" || hand.length === 0 || discardPile.length === 0) return null;
    return analyzeDiscardPickup(hand, discardPile, visibleMelds, jokerRank, jokerIndicator);
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, gamePhase]);

  if (gamePhase !== "playing") {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selesaikan setup permainan untuk melihat rekomendasi.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation || hand.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rekomendasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tambahkan kartu ke tangan untuk melihat rekomendasi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rekomendasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discard pickup opportunity */}
        {pickupRec?.bestOption && pickupRec.bestOption.worthIt && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                Worth It ✓
              </span>
              <span className="text-sm font-medium text-blue-800">Peluang Ambil Buangan</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-muted-foreground">Target:</span>
                <CardChip
                  card={pickupRec.bestOption.targetCard}
                  jokerRank={jokerRank}
                  disabled
                  highlighted
                />
                <span className="text-muted-foreground ml-1">
                  (posisi #{pickupRec.bestOption.targetIndex}, ambil{" "}
                  {pickupRec.bestOption.cardsTaken.length} kartu)
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-muted-foreground">Meld:</span>
                {pickupRec.bestOption.formedMeld.cards.map((c) => (
                  <CardChip
                    key={`${c.suit}-${c.rank}`}
                    card={c}
                    jokerRank={jokerRank}
                    variant="success"
                    disabled
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-muted-foreground">Buang setelahnya:</span>
                <CardChip
                  card={pickupRec.bestOption.suggestedDiscard}
                  jokerRank={jokerRank}
                  variant="danger"
                  disabled
                />
              </div>
              <div className="mt-1 space-y-0.5">
                {pickupRec.bestOption.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1 text-blue-700">
                    <span>&bull;</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            <div className="space-y-1">
              {recommendation.reasons.map((reason, i) => (
                <p key={i} className="text-sm text-red-700">{reason}</p>
              ))}
            </div>
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
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Check className="text-green-600 size-4" />
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
  );
}
