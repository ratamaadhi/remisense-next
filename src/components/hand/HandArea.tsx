"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "./CardChip"
import { CardPicker } from "./CardPicker"
import type { Card } from "@/types"

export function HandArea() {
  const { hand, jokerRank, addToHand, removeFromHand } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Kartu di Tangan ({hand.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {hand.length === 0 && (
          <span className="text-sm text-gray-400 self-center">Belum ada kartu</span>
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

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Tambah Kartu
      </button>

      {showPicker && (
        <CardPicker
          onSelect={(card: Card) => addToHand(card)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
