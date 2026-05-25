"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { CardPicker } from "@/components/hand/CardPicker";
import { CardChip } from "@/components/hand/CardChip";
import { formatCard } from "@/engine/cards/cardUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { Card as CardType } from "@/types";

type SetupStep = "playerCount" | "hand" | "initialDiscard" | "joker" | "done";

const STEP_MAP: Record<SetupStep, number> = {
  playerCount: 1,
  hand: 2,
  initialDiscard: 3,
  joker: 4,
  done: 5,
};

export function GameSetup() {
  const {
    playerCount,
    hand,
    discardPile,
    jokerIndicator,
    jokerRank,
    setPlayerCount,
    addToHand,
    undoAddToHand,
    addInitialDiscard,
    removeInitialDiscard,
    setJokerIndicator,
    startGame,
  } = useGameStore();

  const [step, setStep] = useState<SetupStep>("playerCount");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"hand" | "discard" | "joker">("hand");

  function openPicker(target: "hand" | "discard" | "joker") {
    setPickerTarget(target);
    setShowPicker(true);
  }

  function handlePickerSelect(card: CardType) {
    if (pickerTarget === "hand") {
      addToHand(card)
      // Auto-close when 7 cards reached (hand.length is pre-update, so check for 6)
      if (hand.length >= 6) {
        setShowPicker(false)
      }
    } else if (pickerTarget === "discard") {
      addInitialDiscard(card)
      // Auto-close when playerCount reached
      if (discardPile.length >= playerCount - 1) {
        setShowPicker(false)
      }
    } else if (pickerTarget === "joker") {
      setJokerIndicator(card)
      setStep("done")
      setShowPicker(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Setup Permainan</CardTitle>
        <Progress value={(STEP_MAP[step] / 5) * 100} className="mt-3" />
        <p className="text-xs text-muted-foreground mt-2">Langkah {STEP_MAP[step]} dari 5</p>
      </CardHeader>
      <CardContent>
        {/* Step 1: Player Count */}
        {step === "playerCount" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Berapa jumlah pemain?</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  className="w-10 h-10"
                  onClick={() => {
                    setPlayerCount(n);
                    setStep("hand");
                  }}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Hand Input */}
        {step === "hand" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Masukkan 7 kartu di tangan Anda ({hand.length}/7)
            </p>
            <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
              {hand.map((card) => (
                <CardChip
                  key={`${card.suit}-${card.rank}`}
                  card={card}
                  onClick={() => undoAddToHand(card)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPicker("hand")}
                disabled={hand.length >= 7}
              >
                + Tambah Kartu
              </Button>
              {hand.length >= 7 && (
                <Button size="sm" onClick={() => setStep("initialDiscard")}>
                  Lanjut &rarr;
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Initial Discard */}
        {step === "initialDiscard" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Masukkan kartu buangan awal dari semua pemain ({discardPile.length}/{playerCount})
            </p>
            <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
              {discardPile.map((card, i) => (
                <CardChip key={`${card.suit}-${card.rank}-${i}`} card={card} disabled />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPicker("discard")}
                disabled={discardPile.length >= playerCount}
              >
                + Tambah Buangan
              </Button>
              {discardPile.length >= playerCount && (
                <Button size="sm" onClick={() => setStep("joker")}>
                  Lanjut &rarr;
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Joker Determination */}
        {step === "joker" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Kartu apa yang ditarik untuk menentukan joker?
            </p>
            {jokerIndicator ? (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <CardChip card={jokerIndicator} />
                <span className="text-sm text-purple-600">
                  &rarr; Semua kartu rank {jokerRank} menjadi joker ★
                </span>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => openPicker("joker")}>
                + Pilih Kartu Penentu Joker
              </Button>
            )}
          </div>
        )}

        {/* Step 5: Done */}
        {step === "done" && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Setup selesai! Siap bermain.</p>
            <div className="text-xs text-muted-foreground space-y-1 mb-4 bg-muted/50 rounded-md p-3">
              <div>Pemain: {playerCount}</div>
              <div>Kartu di tangan: {hand.length}</div>
              <div>Buangan awal: {discardPile.length}</div>
              <div>
                Joker: rank {jokerRank}
                {jokerIndicator && ` (${formatCard(jokerIndicator)})`}
              </div>
            </div>
            <Button className="w-full" onClick={startGame}>
              Mulai Permainan
            </Button>
          </div>
        )}

        <ResponsiveDialog open={showPicker} onOpenChange={setShowPicker} title="Pilih Kartu">
            <CardPicker
              onSelect={handlePickerSelect}
              onClose={() => setShowPicker(false)}
              autoClose={pickerTarget === "joker"}
              onDeselect={
                pickerTarget === "hand"
                  ? undoAddToHand
                  : pickerTarget === "discard"
                    ? removeInitialDiscard
                    : undefined
              }
              deselectableCards={
                pickerTarget === "hand"
                  ? hand
                  : pickerTarget === "discard"
                    ? discardPile
                    : undefined
              }
            />
        </ResponsiveDialog>
      </CardContent>
    </Card>
  );
}
