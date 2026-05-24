"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardPicker } from "@/components/hand/CardPicker"
import { CardChip } from "@/components/hand/CardChip"
import { formatCard } from "@/engine/cards/cardUtils"
import type { Card } from "@/types"

type SetupStep = "playerCount" | "hand" | "initialDiscard" | "joker" | "done"

export function GameSetup() {
  const {
    playerCount,
    hand,
    discardPile,
    jokerIndicator,
    jokerRank,
    setPlayerCount,
    addToHand,
    removeFromHand,
    addInitialDiscard,
    setJokerIndicator,
    startGame,
  } = useGameStore()

  const [step, setStep] = useState<SetupStep>("playerCount")
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<"hand" | "discard" | "joker">("hand")

  function openPicker(target: "hand" | "discard" | "joker") {
    setPickerTarget(target)
    setShowPicker(true)
  }

  function handlePickerSelect(card: Card) {
    if (pickerTarget === "hand") {
      addToHand(card)
    } else if (pickerTarget === "discard") {
      addInitialDiscard(card)
    } else if (pickerTarget === "joker") {
      setJokerIndicator(card)
      setStep("done")
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-white max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Setup Permainan</h2>

      {/* Step 1: Player Count */}
      {step === "playerCount" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Berapa jumlah pemain?</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => { setPlayerCount(n); setStep("hand") }}
                className="w-10 h-10 rounded border border-gray-300 hover:border-blue-400 hover:bg-blue-50 font-medium transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Hand Input */}
      {step === "hand" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Masukkan 7 kartu di tangan Anda ({hand.length}/7)
          </p>
          <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
            {hand.map((card) => (
              <CardChip
                key={`${card.suit}-${card.rank}`}
                card={card}
                onClick={() => removeFromHand(card)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPicker("hand")}
              disabled={hand.length >= 7}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Tambah Kartu
            </button>
            {hand.length >= 7 && (
              <button
                onClick={() => setStep("initialDiscard")}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lanjut →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Initial Discard */}
      {step === "initialDiscard" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Masukkan kartu buangan awal dari semua pemain ({discardPile.length}/{playerCount})
          </p>
          <div className="flex flex-wrap gap-1 mb-3 min-h-[32px]">
            {discardPile.map((card, i) => (
              <CardChip key={`${card.suit}-${card.rank}-${i}`} card={card} disabled />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPicker("discard")}
              disabled={discardPile.length >= playerCount}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + Tambah Buangan
            </button>
            {discardPile.length >= playerCount && (
              <button
                onClick={() => setStep("joker")}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lanjut →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Joker Determination */}
      {step === "joker" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Kartu apa yang ditarik untuk menentukan joker?
          </p>
          {jokerIndicator ? (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <CardChip card={jokerIndicator} />
              <span className="text-sm text-purple-600">
                → Semua kartu rank {jokerRank} menjadi joker ★
              </span>
            </div>
          ) : (
            <button
              onClick={() => openPicker("joker")}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Pilih Kartu Penentu Joker
            </button>
          )}
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Setup selesai! Siap bermain.</p>
          <div className="text-xs text-gray-500 space-y-1 mb-4 bg-gray-50 rounded p-3">
            <div>Pemain: {playerCount}</div>
            <div>Kartu di tangan: {hand.length}</div>
            <div>Buangan awal: {discardPile.length}</div>
            <div>
              Joker: rank {jokerRank}
              {jokerIndicator && ` (${formatCard(jokerIndicator)})`}
            </div>
          </div>
          <button
            onClick={startGame}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
          >
            Mulai Permainan
          </button>
        </div>
      )}

      {showPicker && (
        <CardPicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
