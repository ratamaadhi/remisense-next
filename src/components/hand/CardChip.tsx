"use client"

import type { Card } from "@/types"
import { formatCard } from "@/engine/cards/cardUtils"
import { isJoker } from "@/engine/melds/meldDetector"
import { cn } from "@/lib/utils"

type CardChipProps = {
  card: Card
  jokerRank?: number | null
  onClick?: () => void
  disabled?: boolean
  highlighted?: boolean
  variant?: "default" | "danger" | "success"
}

export function CardChip({
  card,
  jokerRank = null,
  onClick,
  disabled = false,
  highlighted = false,
  variant = "default",
}: CardChipProps) {
  const isRed = card.suit === "heart" || card.suit === "diamond"
  const isWild = isJoker(card, jokerRank)

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-sm font-mono font-bold border select-none transition-all",
        isWild
          ? "text-purple-700 border-purple-300 bg-purple-50"
          : isRed
            ? "text-red-600 border-red-200 bg-white"
            : "text-gray-900 border-gray-300 bg-white",
        variant === "danger" && "ring-2 ring-orange-400 bg-orange-50",
        variant === "success" && "ring-2 ring-green-400 bg-green-50",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:scale-105",
        highlighted && "ring-2 ring-blue-400"
      )}
      title={isWild ? "Joker" : formatCard(card)}
    >
      {formatCard(card)}
      {isWild && <span className="ml-1 text-xs">★</span>}
    </button>
  )
}
