"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import type { Card } from "@/types"

export function DiscardPile() {
  const { discardPile, jokerRank, addToDiscardPile } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Tumpukan Buangan ({discardPile.length})
        </h2>
      </div>

      <div className="flex flex-wrap gap-1 min-h-[40px] items-center">
        {discardPile.length === 0 && (
          <span className="text-sm text-gray-400">Belum ada kartu buangan</span>
        )}
        {discardPile.map((card, i) => (
          <span key={`${card.suit}-${card.rank}-${i}`} className="flex items-center">
            <CardChip card={card} jokerRank={jokerRank} disabled />
            {i < discardPile.length - 1 && (
              <span className="mx-0.5 text-gray-300 text-xs">→</span>
            )}
          </span>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Buangan Pemain Lain
      </button>

      {showPicker && (
        <CardPicker
          onSelect={(card: Card) => addToDiscardPile(card)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
