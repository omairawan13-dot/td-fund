"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type Case, type User, type Transaction } from "@/lib/mock-data"
import { createCase, getCases, getTransactions, getUsers } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface UserPaymentStatus {
  userId: string
  userName: string
  paid: boolean
}

export default function AdminCasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fee: "10",
  })
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, UserPaymentStatus[]>>({})
  const [users, setUsers] = useState<User[]>([])

  // Load cases and users on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [fetchedCases, fetchedUsers] = await Promise.all([
      getCases(),
      getUsers()
    ])
    setCases(fetchedCases)
    setUsers(fetchedUsers)
    setLoading(false)
  }

  const handleCreate = () => {
    setFormData({ title: "", description: "", fee: "10" })
    setIsDialogOpen(true)
  }

  const handleViewCase = async (caseItem: Case) => {
    setSelectedCase(caseItem)

    // Calculate payment status based on transactions
    // Since we don't fetch all transactions for performance, we might need a specific query
    // For now, we'll fetch all transactions (optimization for later: fetch by case_id)
    const transactions = await getTransactions()
    
    // Filter transactions for this case
    const caseTransactions = transactions.filter(t => t.caseId === caseItem.id)
    
    // Determine status for each user
    // A user has "paid" if they have a DEPOSIT transaction that covers the fee?
    // OR: The "charge" transaction exists (which we created automatically).
    // The requirement says "charged the amount". 
    // If we want to show if they *paid* it back (positive balance or specific payment), that's different.
    // Assuming "Paid" means "Has sufficient balance" or "Has settled the debt".
    // But the current UI shows "Paid/Unpaid".
    // For now, let's just show the list of users who were charged.
    // If we want to track payments *against* a case, we need logic to match deposits to cases.
    // Simplification: Everyone is "Unpaid" initially until they make a deposit?
    // Let's assume the mock logic: "paid" state was random or toggleable.
    // In a real system, "Paid" usually means `balance >= 0` or specific invoice settlement.
    
    // Let's list all users and show if they were charged (they should be).
    const statuses = users.map(user => {
        const charged = caseTransactions.some(t => t.userId === user.id && t.type === 'CASE_FEE')
        // In the mock, it was manual toggle.
        // Let's keep it simple: Show everyone, and "Paid" if their balance is non-negative?
        // Or just show that they were charged.
        return {
            userId: user.id,
            userName: user.name,
            paid: charged // Temporarily showing "Charged" status as "Paid" checkmark to indicate inclusion
        }
    })

    setPaymentStatuses({
        ...paymentStatuses,
        [caseItem.id]: statuses
    })
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
        {cases.map((caseItem) => {
          // Calculate summary if needed, for now just static or based on user count
          const totalCount = users.length
          const paidCount = totalCount // Since we charge everyone

          return (
            <Card key={caseItem.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Erstellt: {new Date(caseItem.createdAt).toLocaleDateString("de-DE")} • Gebühr: {caseItem.fee}€
                    </p>
                  </div>
                  <Badge variant="outline">
                    {totalCount} Mitglieder belastet
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{caseItem.description}</p>
                <Button onClick={() => handleViewCase(caseItem)} variant="outline" className="w-full h-11">
                  Details anzeigen
                </Button>
              </CardContent>
            </Card>
          )
        })}
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

      {/* Payment Status Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCase?.title}</DialogTitle>
            <DialogDescription>Belastete Mitglieder</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedCase &&
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">-{selectedCase.fee}€ (Gebühr)</p>
                  </div>
                  <Badge variant="outline">Belastet</Badge>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
