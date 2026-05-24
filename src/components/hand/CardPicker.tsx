"use client"

import { useState } from "react"
import type { Card, Suit } from "@/types"
import { formatCard, cardEquals } from "@/engine/cards/cardUtils"
import { useGameStore } from "@/store/gameStore"

type CardPickerProps = {
  onSelect: (card: Card) => void
  onClose: () => void
  multiSelect?: boolean
  onMultiSelect?: (cards: Card[]) => void
}

const SUIT_ORDER: Suit[] = ["spade", "heart", "diamond", "club"]
const SUIT_LABELS: Record<Suit, string> = {
  spade: "♠ Sekop",
  heart: "♥ Hati",
  diamond: "♦ Wajik",
  club: "♣ Keriting",
}

const RANK_LABELS: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
}

export function CardPicker({ onSelect, onClose, multiSelect = false, onMultiSelect }: CardPickerProps) {
  const { hand, discardPile, visibleMelds, jokerIndicator } = useGameStore()
  const [selected, setSelected] = useState<Card[]>([])

  // All cards already used in any zone
  const usedCards: Card[] = [
    ...hand,
    ...discardPile,
    ...visibleMelds.flat(),
    ...(jokerIndicator ? [jokerIndicator] : []),
  ]

  function isUsed(card: Card): boolean {
    return usedCards.some((c) => cardEquals(c, card))
  }

  function isSelected(card: Card): boolean {
    return selected.some((s) => cardEquals(s, card))
  }

  function handleCardClick(card: Card) {
    if (isUsed(card)) return

    if (multiSelect) {
      if (isSelected(card)) {
        setSelected(selected.filter((s) => !cardEquals(s, card)))
      } else {
        setSelected([...selected, card])
      }
    } else {
      onSelect(card)
      onClose()
    }
  }

  function handleConfirmMulti() {
    if (onMultiSelect && selected.length >= 3) {
      onMultiSelect(selected)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {multiSelect ? "Pilih Kartu (min. 3)" : "Pilih Kartu"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {SUIT_ORDER.map((suit) => {
          const isRed = suit === "heart" || suit === "diamond"
          return (
            <div key={suit} className="mb-3">
              <div className={`text-sm font-medium mb-1 ${isRed ? "text-red-600" : "text-gray-800"}`}>
                {SUIT_LABELS[suit]}
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 13 }, (_, i) => i + 1).map((rank) => {
                  const card: Card = { suit, rank }
                  const used = isUsed(card)
                  const sel = isSelected(card)
                  const label = RANK_LABELS[rank] ?? String(rank)

                  return (
                    <button
                      key={rank}
                      type="button"
                      onClick={() => handleCardClick(card)}
                      disabled={used}
                      aria-label={formatCard(card)}
                      className={[
                        "w-8 h-10 text-xs font-mono font-bold rounded border transition-all",
                        used
                          ? "opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                          : sel
                            ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300 " + (isRed ? "text-red-600" : "text-gray-900")
                            : isRed
                              ? "text-red-600 border-red-200 hover:bg-red-50 bg-white"
                              : "text-gray-900 border-gray-300 hover:bg-gray-50 bg-white",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {multiSelect && (
          <div className="mt-4 flex justify-between items-center border-t pt-3">
            <span className="text-sm text-gray-600">
              {selected.length} kartu dipilih
              {selected.length < 3 && " (min. 3)"}
            </span>
            <button
              onClick={handleConfirmMulti}
              disabled={selected.length < 3}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-sm font-medium"
            >
              Konfirmasi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
