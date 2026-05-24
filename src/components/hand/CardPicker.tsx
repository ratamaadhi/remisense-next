"use client";

import { useState } from "react";
import type { Card, Suit } from "@/types";
import { formatCard, cardEquals } from "@/engine/cards/cardUtils";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CardPickerProps = {
  onSelect: (card: Card) => void;
  onClose: () => void;
  multiSelect?: boolean;
  onMultiSelect?: (cards: Card[]) => void;
  autoClose?: boolean;
};

const SUIT_ORDER: Suit[] = ["spade", "heart", "club", "diamond"];
const SUIT_LABELS: Record<Suit, string> = {
  spade: "\u2660 Sekop",
  heart: "\u2665 Hati",
  diamond: "\u2666 Wajik",
  club: "\u2663 Keriting",
};

const RANK_LABELS: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
};

export function CardPicker({
  onSelect,
  onClose,
  multiSelect = false,
  onMultiSelect,
  autoClose = true,
}: CardPickerProps) {
  const { hand, discardPile, visibleMelds, jokerIndicator } = useGameStore();
  const [selected, setSelected] = useState<Card[]>([]);

  const usedCards: Card[] = [
    ...hand,
    ...discardPile,
    ...visibleMelds.flat(),
    ...(jokerIndicator ? [jokerIndicator] : []),
  ];

  function isUsed(card: Card): boolean {
    return usedCards.some((c) => cardEquals(c, card));
  }

  function isSelected(card: Card): boolean {
    return selected.some((s) => cardEquals(s, card));
  }

  function handleCardClick(card: Card) {
    if (isUsed(card)) return;

    if (multiSelect) {
      if (isSelected(card)) {
        setSelected(selected.filter((s) => !cardEquals(s, card)));
      } else {
        setSelected([...selected, card]);
      }
    } else {
      onSelect(card);
      if (autoClose) {
        onClose();
      }
    }
  }

  function handleConfirmMulti() {
    if (onMultiSelect && selected.length >= 3) {
      onMultiSelect(selected);
      onClose();
    }
  }

  return (
    <div>
      {SUIT_ORDER.map((suit) => {
        const isRed = suit === "heart" || suit === "diamond";
        return (
          <div key={suit} className="mb-3">
            <div
              className={cn("text-sm font-medium mb-1", isRed ? "text-red-600" : "text-foreground")}
            >
              {SUIT_LABELS[suit]}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 13 }, (_, i) => i + 1).map((rank) => {
                const card: Card = { suit, rank };
                const used = isUsed(card);
                const sel = isSelected(card);
                const label = RANK_LABELS[rank] ?? String(rank);

                return (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => handleCardClick(card)}
                    disabled={used}
                    aria-label={formatCard(card)}
                    className={cn(
                      "w-8 h-10 text-xs font-mono font-bold rounded-md border transition-all",
                      used
                        ? "opacity-30 cursor-not-allowed bg-muted border-border text-muted-foreground"
                        : sel
                          ? cn(
                              "bg-blue-100 border-blue-400 ring-2 ring-blue-300",
                              isRed ? "text-red-600" : "text-foreground",
                            )
                          : isRed
                            ? "text-red-600 border-red-200 hover:bg-red-50 bg-white"
                            : "text-foreground border-border hover:bg-muted bg-white",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {multiSelect && (
        <div className="mt-4 flex justify-between items-center border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {selected.length} kartu dipilih
            {selected.length < 3 && " (min. 3)"}
          </span>
          <Button onClick={handleConfirmMulti} disabled={selected.length < 3}>
            Konfirmasi
          </Button>
        </div>
      )}
    </div>
  );
}
