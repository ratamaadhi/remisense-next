"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { DiscardPickupFlow } from "./DiscardPickupFlow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Card as CardType } from "@/types"

export function DiscardPile() {
  const { discardPile, jokerRank, addToDiscardPile } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)
  const [pickupMode, setPickupMode] = useState<"self" | "opponent" | null>(null)

  const top7StartIndex = Math.max(0, discardPile.length - 7)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Tumpukan Buangan ({discardPile.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 min-h-[40px] items-center">
          {discardPile.length === 0 && (
            <span className="text-sm text-muted-foreground">Belum ada kartu buangan</span>
          )}
          {discardPile.map((card, i) => {
            const isTop7 = i >= top7StartIndex
            return (
              <span key={`${card.suit}-${card.rank}-${i}`} className="flex items-center">
                <CardChip
                  card={card}
                  jokerRank={jokerRank}
                  disabled
                  highlighted={isTop7}
                />
                {i < discardPile.length - 1 && (
                  <span className="mx-0.5 text-muted-foreground text-xs">&rarr;</span>
                )}
              </span>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
          >
            + Buangan Pemain Lain
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickupMode("self")}
            disabled={discardPile.length === 0}
          >
            Ambil dari Buangan (Saya)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickupMode("opponent")}
            disabled={discardPile.length === 0}
          >
            Catat Ambil Pemain Lain
          </Button>
        </div>

        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pilih Kartu</DialogTitle>
            </DialogHeader>
            <CardPicker
              onSelect={(card: CardType) => addToDiscardPile(card)}
              onClose={() => setShowPicker(false)}
            />
          </DialogContent>
        </Dialog>

        {pickupMode && (
          <DiscardPickupFlow
            mode={pickupMode}
            onClose={() => setPickupMode(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
