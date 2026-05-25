"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { CardChip } from "./CardChip";
import { CardPicker } from "./CardPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cardEquals, formatCard } from "@/engine/cards/cardUtils";
import type { Card as CardType } from "@/types";

export function HandArea() {
  const { hand, jokerRank, addToHand, removeFromHand, undoAddToHand, layDownMeld, lastAction, undo, clearLastAction } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);
  const [showLayDown, setShowLayDown] = useState(false);
  const [selectedMeld, setSelectedMeld] = useState<CardType[]>([]);

  // Auto-dismiss undo after 5 seconds
  useEffect(() => {
    if (lastAction?.type === "removeFromHand") {
      const timer = setTimeout(clearLastAction, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAction, clearLastAction]);

  function toggleMeldCard(card: CardType) {
    setSelectedMeld((prev) =>
      prev.some((c) => cardEquals(c, card))
        ? prev.filter((c) => !cardEquals(c, card))
        : [...prev, card]
    )
  }

  function handleLayDownConfirm() {
    if (selectedMeld.length < 3) return
    layDownMeld(selectedMeld)
    setSelectedMeld([])
    setShowLayDown(false)
  }

  function handleLayDownClose() {
    setSelectedMeld([])
    setShowLayDown(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Kartu di Tangan ({hand.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {hand.length === 0 && (
            <span className="text-sm text-muted-foreground self-center">Belum ada kartu</span>
          )}
          {hand.map((card) => (
            <CardChip
              key={`${card.suit}-${card.rank}`}
              card={card}
              jokerRank={jokerRank}
              onClick={() => removeFromHand(card)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => setShowPicker(true)}>
            + Tambah Kartu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayDown(true)}
            disabled={hand.length < 3}
          >
            Turun Meld
          </Button>
        </div>

        {lastAction?.type === "removeFromHand" && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <span className="text-sm text-amber-800">
              {formatCard(lastAction.card)} dibuang
            </span>
            <Button variant="outline" size="sm" className="ml-auto text-amber-700 border-amber-300 hover:bg-amber-100" onClick={undo}>
              Undo
            </Button>
          </div>
        )}

        {/* Add card dialog */}
        <ResponsiveDialog
          open={showPicker}
          onOpenChange={setShowPicker}
          title="Pilih Kartu"
          description="Pilih kartu untuk ditambahkan ke tangan"
        >
            <CardPicker
              onSelect={(card: CardType) => addToHand(card)}
              onClose={() => setShowPicker(false)}
              onDeselect={undoAddToHand}
              deselectableCards={hand}
            />
        </ResponsiveDialog>

        {/* Lay down meld dialog */}
        <ResponsiveDialog
          open={showLayDown}
          onOpenChange={handleLayDownClose}
          title="Turun Meld"
          description="Pilih min. 3 kartu dari tangan untuk diturunkan sebagai meld"
        >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {hand.map((card) => {
                  const isSelected = selectedMeld.some((c) => cardEquals(c, card))
                  return (
                    <CardChip
                      key={`${card.suit}-${card.rank}`}
                      card={card}
                      jokerRank={jokerRank}
                      onClick={() => toggleMeldCard(card)}
                      highlighted={isSelected}
                      variant={isSelected ? "success" : "default"}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedMeld.length} kartu dipilih
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleLayDownClose}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLayDownConfirm}
                    disabled={selectedMeld.length < 3}
                  >
                    Turunkan
                  </Button>
                </div>
              </div>
            </div>
        </ResponsiveDialog>
      </CardContent>
    </Card>
  );
}
