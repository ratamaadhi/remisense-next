"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { GameSetup } from "@/components/setup/GameSetup";
import { HandArea } from "@/components/hand/HandArea";
import { DiscardPile } from "@/components/discard/DiscardPile";
import { MeldTable } from "@/components/melds/MeldTable";
import { RecommendationPanel } from "@/components/recommendation/RecommendationPanel";
import { formatCard } from "@/engine/cards/cardUtils";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { gamePhase, resetGame, jokerRank, jokerIndicator } = useGameStore();
  const [showRecDrawer, setShowRecDrawer] = useState(false);

  if (gamePhase === "setup") {
    return (
      <main className="max-w-2xl mx-auto p-4 py-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">RemiSense</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Recommendation Assistant untuk permainan kartu Remi
        </p>
        <GameSetup />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 py-6 pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">RemiSense</h1>
          {jokerRank !== null && jokerIndicator && (
            <span className="text-xs text-purple-600">
              Joker: rank {jokerRank} ({formatCard(jokerIndicator)}) ★
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="destructive" size="sm" onClick={resetGame}>
            Reset Permainan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Input area (2/3 width) */}
        <div className="md:col-span-2 space-y-4">
          <HandArea />
          <DiscardPile />
          <MeldTable />
        </div>

        {/* Right column: Recommendation (1/3 width) - desktop only */}
        <div className="hidden md:block md:col-span-1">
          <div className="sticky top-4">
            <RecommendationPanel />
          </div>
        </div>
      </div>

      {/* Mobile: floating button to open recommendation drawer */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center md:hidden z-50">
        <Button onClick={() => setShowRecDrawer(true)} className="shadow-lg rounded-full px-6">
          Lihat Rekomendasi
        </Button>
      </div>

      {/* Mobile: recommendation drawer */}
      <Drawer open={showRecDrawer} onOpenChange={setShowRecDrawer}>
        <DrawerContent className="max-h-[85vh] px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle></DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <RecommendationPanel />
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
