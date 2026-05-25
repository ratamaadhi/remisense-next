"use client"

import { useState, useMemo } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { analyzeDiscardPickup } from "@/engine/recommendation/recommendationEngine"
import { getTopNDiscards } from "@/engine/probability/probabilityTracker"
import { cardEquals } from "@/engine/cards/cardUtils"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import type { Card as CardType, DiscardPickupOption } from "@/types"

type DiscardPickupFlowProps = {
  mode: "self" | "opponent"
  onClose: () => void
}

export function DiscardPickupFlow({ mode, onClose }: DiscardPickupFlowProps) {
  const {
    hand,
    discardPile,
    visibleMelds,
    jokerRank,
    jokerIndicator,
    pickupFromDiscard,
    opponentPickupFromDiscard,
  } = useGameStore()

  const [step, setStep] = useState(1)
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number | null>(null)
  const [opponentMeld, setOpponentMeld] = useState<CardType[]>([])

  const top7 = useMemo(() => getTopNDiscards(discardPile, 7), [discardPile])

  // For "self" mode: compute recommendation
  const recommendation = useMemo(() => {
    if (mode !== "self") return null
    return analyzeDiscardPickup(hand, discardPile, visibleMelds, jokerRank, jokerIndicator)
  }, [hand, discardPile, visibleMelds, jokerRank, jokerIndicator, mode])

  // Selected option based on target
  const selectedOption: DiscardPickupOption | null = useMemo(() => {
    if (!recommendation || selectedTargetIndex === null) return null
    return recommendation.options.find((o) => o.targetIndex === selectedTargetIndex) ?? null
  }, [recommendation, selectedTargetIndex])

  // Cards that will be taken (from target to top)
  const cardsTaken = useMemo(() => {
    if (selectedTargetIndex === null) return []
    const startIdx = top7.length - selectedTargetIndex
    return top7.slice(startIdx)
  }, [top7, selectedTargetIndex])

  function handleTargetSelect(index: number) {
    setSelectedTargetIndex(index)
    if (mode === "opponent") {
      setStep(2)
    }
  }

  function handleSelfConfirm() {
    setStep(3)
  }

  function handleSelfDiscard(card: CardType) {
    if (!selectedOption) return
    pickupFromDiscard(cardsTaken, selectedOption.formedMeld.cards, card)
    onClose()
  }

  function handleOpponentMeldConfirm(cards: CardType[]) {
    setOpponentMeld(cards)
    setStep(3)
  }

  function handleOpponentDiscard(card: CardType) {
    opponentPickupFromDiscard(cardsTaken, opponentMeld, card)
    onClose()
  }

  return (
    <ResponsiveDialog
      open={true}
      onOpenChange={() => onClose()}
      title={mode === "self" ? "Ambil dari Buangan" : "Catat Ambil Pemain Lain"}
      description={`Langkah ${step} dari 3`}
    >

        {/* Step 1: Pick Target */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih kartu target dari 7 teratas tumpukan buangan:
            </p>
            <div className="flex flex-wrap gap-2">
              {top7.map((card, i) => {
                const targetIdx = top7.length - i
                const isSelected = selectedTargetIndex === targetIdx
                const willBeTaken = selectedTargetIndex !== null && targetIdx <= selectedTargetIndex
                return (
                  <div key={`${card.suit}-${card.rank}`} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">#{targetIdx}</span>
                    <CardChip
                      card={card}
                      jokerRank={jokerRank}
                      onClick={() => handleTargetSelect(targetIdx)}
                      highlighted={isSelected || willBeTaken}
                      variant={isSelected ? "success" : "default"}
                    />
                  </div>
                )
              })}
            </div>

            {/* Self mode: show recommendation */}
            {mode === "self" && selectedOption && (
              <div className="mt-3 p-3 rounded-md border bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedOption.worthIt ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {selectedOption.worthIt ? "Worth It" : "Tidak Disarankan"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {selectedOption.netScore.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  {selectedOption.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>&bull;</span><span>{r}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={handleSelfConfirm} className="mt-2">
                  Lanjut &rarr;
                </Button>
              </div>
            )}

            {/* Self mode: no option found for this target */}
            {mode === "self" && selectedTargetIndex !== null && !selectedOption && (
              <div className="mt-3 p-3 rounded-md border bg-orange-50 text-sm text-orange-700">
                Tidak ada meld yang bisa dibentuk dengan kartu ini.
              </div>
            )}
          </div>
        )}

        {/* Step 2 (self): Confirmation */}
        {step === 2 && mode === "self" && selectedOption && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Konfirmasi pengambilan:</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Kartu diambil:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cardsTaken.map((c) => (
                    <CardChip key={`${c.suit}-${c.rank}`} card={c} jokerRank={jokerRank} disabled />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Meld terbentuk:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedOption.formedMeld.cards.map((c) => (
                    <CardChip key={`${c.suit}-${c.rank}`} card={c} jokerRank={jokerRank} variant="success" disabled />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                &larr; Kembali
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Konfirmasi &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 (opponent): Record Meld */}
        {step === 2 && mode === "opponent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Catat meld yang dibentuk pemain lain (min. 3 kartu):
            </p>
            <CardPicker
              onSelect={() => {}}
              onClose={() => {}}
              multiSelect={true}
              onMultiSelect={handleOpponentMeldConfirm}
              autoClose={false}
            />
          </div>
        )}

        {/* Step 3 (self): Pick discard */}
        {step === 3 && mode === "self" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih 1 kartu untuk dibuang:
            </p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const meldCards = selectedOption?.formedMeld.cards ?? []
                const handAfterPickup = [...hand, ...cardsTaken].filter(
                  (c) => !meldCards.some((m) => cardEquals(m, c))
                )
                return handAfterPickup.map((card) => (
                  <CardChip
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    jokerRank={jokerRank}
                    onClick={() => handleSelfDiscard(card)}
                    highlighted={selectedOption?.suggestedDiscard ? cardEquals(card, selectedOption.suggestedDiscard) : false}
                  />
                ))
              })()}
            </div>
            {selectedOption?.suggestedDiscard && (
              <p className="text-xs text-blue-600">
                Kartu yang di-highlight adalah rekomendasi AI untuk dibuang.
              </p>
            )}
          </div>
        )}

        {/* Step 3 (opponent): Record new discard */}
        {step === 3 && mode === "opponent" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kartu apa yang dibuang pemain lain setelah mengambil?
            </p>
            <CardPicker
              onSelect={handleOpponentDiscard}
              onClose={() => {}}
              autoClose={false}
            />
          </div>
        )}
    </ResponsiveDialog>
  )
}
