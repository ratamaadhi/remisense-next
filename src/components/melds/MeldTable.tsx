"use client"

import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { CardChip } from "@/components/hand/CardChip"
import { CardPicker } from "@/components/hand/CardPicker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Card as CardType } from "@/types"

export function MeldTable() {
  const { visibleMelds, jokerRank, addMeldGroup, removeMeldGroup } = useGameStore()
  const [showPicker, setShowPicker] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Meld di Meja ({visibleMelds.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[40px]">
          {visibleMelds.length === 0 && (
            <span className="text-sm text-muted-foreground">Belum ada meld di meja</span>
          )}
          {visibleMelds.map((meld, i) => (
            <div key={i} className="flex items-center gap-1 p-2 bg-muted/50 rounded-md">
              {meld.map((card) => (
                <CardChip
                  key={`${card.suit}-${card.rank}`}
                  card={card}
                  jokerRank={jokerRank}
                  disabled
                />
              ))}
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => removeMeldGroup(i)}
                title="Hapus meld"
                aria-label="Hapus meld"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setShowPicker(true)}
        >
          + Tambah Grup Meld
        </Button>

        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pilih Kartu (min. 3)</DialogTitle>
            </DialogHeader>
            <CardPicker
              onSelect={() => {}}
              onClose={() => setShowPicker(false)}
              multiSelect={true}
              onMultiSelect={(cards: CardType[]) => addMeldGroup(cards)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
