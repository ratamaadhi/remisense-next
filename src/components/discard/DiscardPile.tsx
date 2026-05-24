"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Card as CardType } from "@/types"

export function DiscardPile() {
  const { discardPile, jokerRank, addToDiscardPile } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

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
          {discardPile.map((card, i) => (
            <span key={`${card.suit}-${card.rank}-${i}`} className="flex items-center">
              <CardChip card={card} jokerRank={jokerRank} disabled />
              {i < discardPile.length - 1 && (
                <span className="mx-0.5 text-muted-foreground text-xs">&rarr;</span>
              )}
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setShowPicker(true)}
        >
          + Buangan Pemain Lain
        </Button>

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
      </CardContent>
    </Card>
  )
}
