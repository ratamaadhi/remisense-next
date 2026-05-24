"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { CardChip } from "./CardChip";
import { CardPicker } from "./CardPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Card as CardType } from "@/types";

export function HandArea() {
  const { hand, jokerRank, addToHand, removeFromHand } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);

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

        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowPicker(true)}>
          + Tambah Kartu
        </Button>

        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pilih Kartu</DialogTitle>
              <DialogDescription>at least 3 cards</DialogDescription>
            </DialogHeader>
            <CardPicker
              onSelect={(card: CardType) => addToHand(card)}
              onClose={() => setShowPicker(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
