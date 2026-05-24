"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import type { Card } from "@/types"

export function MeldTable() {
  const { visibleMelds, jokerRank, addMeldGroup, removeMeldGroup } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          Meld di Meja ({visibleMelds.length})
        </h2>
      </div>

      <div className="space-y-2 min-h-[40px]">
        {visibleMelds.length === 0 && (
          <span className="text-sm text-gray-400">Belum ada meld di meja</span>
        )}
        {visibleMelds.map((meld, i) => (
          <div key={i} className="flex items-center gap-1 p-2 bg-gray-50 rounded">
            {meld.map((card) => (
              <CardChip
                key={`${card.suit}-${card.rank}`}
                card={card}
                jokerRank={jokerRank}
                disabled
              />
            ))}
            <button
              onClick={() => removeMeldGroup(i)}
              className="ml-auto text-red-400 hover:text-red-600 text-sm px-1"
              title="Hapus meld"
              aria-label="Hapus meld"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Tambah Grup Meld
      </button>

      {showPicker && (
        <CardPicker
          onSelect={() => {}}
          onClose={() => setShowPicker(false)}
          multiSelect={true}
          onMultiSelect={(cards: Card[]) => addMeldGroup(cards)}
        />
      )}
    </div>
  )
}
