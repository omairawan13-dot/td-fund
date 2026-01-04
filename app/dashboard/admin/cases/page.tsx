"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type Case } from "@/lib/mock-data"
import { createCase, getCases } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Euro } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AdminCasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fee: "10",
  })

  // Load cases on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const fetchedCases = await getCases()
    setCases(fetchedCases)
    setLoading(false)
  }

  const handleCreate = () => {
    setFormData({ title: "", description: "", fee: "10" })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await createCase({
        title: formData.title,
        description: formData.description,
        fee: parseFloat(formData.fee)
    })

    if (success) {
        await loadData()
        setIsDialogOpen(false)
        setFormData({ title: "", description: "", fee: "10" })
    } else {
        alert("Fehler beim Erstellen des Falls")
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cases verwalten</h1>
          <p className="text-muted-foreground">Fälle erstellen und überwachen</p>
        </div>
        <Button onClick={handleCreate} size="lg" className="gap-2 h-12">
          <Plus className="h-5 w-5" />
          Neu
        </Button>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : cases.length === 0 ? (
        <p className="text-muted-foreground text-center p-8">Keine Fälle vorhanden</p>
      ) : (
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id}>
            <CardHeader>
              <CardTitle className="text-lg">{caseItem.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseItem.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{caseItem.description}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Euro className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{caseItem.fee.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(caseItem.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Fall</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Fall. Alle Mitglieder werden automatisch belastet.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-12"
                placeholder="z.B. Fall #125"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Gebühr (€)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 h-12">
                Erstellen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
