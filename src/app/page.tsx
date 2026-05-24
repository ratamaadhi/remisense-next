"use client"

import { useGameStore } from "@/store/gameStore"
import { GameSetup } from "@/components/setup/GameSetup"
import { HandArea } from "@/components/hand/HandArea"
import { DiscardPile } from "@/components/discard/DiscardPile"
import { MeldTable } from "@/components/melds/MeldTable"
import { RecommendationPanel } from "@/components/recommendation/RecommendationPanel"
import { formatCard } from "@/engine/cards/cardUtils"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { gamePhase, resetGame, jokerRank, jokerIndicator } = useGameStore()

  if (gamePhase === "setup") {
    return (
      <main className="max-w-2xl mx-auto p-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2">RemiSense AI</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          AI Recommendation Assistant untuk permainan kartu Remi
        </p>
        <GameSetup />
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">RemiSense AI</h1>
          {jokerRank !== null && jokerIndicator && (
            <span className="text-xs text-purple-600">
              Joker: rank {jokerRank} ({formatCard(jokerIndicator)}) ★
            </span>
          )}
        </div>
        <Button variant="destructive" size="sm" onClick={resetGame}>
          Reset Permainan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Input area (2/3 width) */}
        <div className="md:col-span-2 space-y-4">
          <HandArea />
          <DiscardPile />
          <MeldTable />
        </div>

        {/* Right column: Recommendation (1/3 width) */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <RecommendationPanel />
          </div>
        </div>
      </div>
    </main>
  )
}
