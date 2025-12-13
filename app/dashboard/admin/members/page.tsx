"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type User, type Role, type Transaction } from "@/lib/mock-data"
import { getUsers, updateUser, getTransactions, getUsersNegative30Days, getUsersSortedByNegativeDays, type UserWithNegativeDays, markUsersInactiveAfter90Days, getInactiveUsers90Days, sendManualReminderEmail, getPendingUsers, approveUser, rejectUser } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Edit, UserIcon, Shield, Loader2, ArrowUpCircle, ArrowDownCircle, Search, Plus, AlertTriangle, Mail, X, Check, XCircle, UserCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { processDeposit } from "@/lib/api"

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([])
  const [filteredMembers, setFilteredMembers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTransactionsDialogOpen, setIsTransactionsDialogOpen] = useState(false)
  const [isManualTransactionDialogOpen, setIsManualTransactionDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    role: "USER" as Role,
    email: "",
    phone: "",
    address: "",
    newPassword: "",
  })
  const [transactionFormData, setTransactionFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [isNegativeBalanceDialogOpen, setIsNegativeBalanceDialogOpen] = useState(false)
  const [negative30DaysUsers, setNegative30DaysUsers] = useState<UserWithNegativeDays[]>([])
  const [sortedNegativeUsers, setSortedNegativeUsers] = useState<UserWithNegativeDays[]>([])
  const [loadingNegativeUsers, setLoadingNegativeUsers] = useState(false)
  const [showInactiveOnly, setShowInactiveOnly] = useState(false)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [users90PlusDaysCount, setUsers90PlusDaysCount] = useState(0)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [isPendingRegistrationsDialogOpen, setIsPendingRegistrationsDialogOpen] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const [pendingUsersCount, setPendingUsersCount] = useState(0)

  // Load users from database
  useEffect(() => {
    loadMembers()
    loadUsers90PlusDaysCount()
    loadPendingUsers()
  }, [])

  useEffect(() => {
    // Update pending users count when dialog opens
    if (isPendingRegistrationsDialogOpen) {
      loadPendingUsers()
    }
  }, [isPendingRegistrationsDialogOpen])

  const loadPendingUsers = async () => {
    setLoadingPendingUsers(true)
    const users = await getPendingUsers()
    setPendingUsers(users)
    setPendingUsersCount(users.length)
    setLoadingPendingUsers(false)
  }

  const handleOpenPendingRegistrations = async () => {
    setIsPendingRegistrationsDialogOpen(true)
    await loadPendingUsers()
  }

  const handleApproveUser = async (userId: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich genehmigen? Der Benutzer erhält eine Anmeldegebühr von -100€.")) {
      return
    }

    setProcessingUserId(userId)
    const success = await approveUser(userId)
    setProcessingUserId(null)

    if (success) {
      await loadPendingUsers()
      await loadMembers()
    } else {
      alert("Fehler beim Genehmigen des Benutzers")
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich ablehnen?")) {
      return
    }

    setProcessingUserId(userId)
    const success = await rejectUser(userId)
    setProcessingUserId(null)

    if (success) {
      await loadPendingUsers()
      await loadMembers()
    } else {
      alert("Fehler beim Ablehnen des Benutzers")
    }
  }

  const loadUsers90PlusDaysCount = async () => {
    const users = await getInactiveUsers90Days()
    setUsers90PlusDaysCount(users.length)
  }

  const loadMembers = async () => {
    setLoading(true)
    const data = await getUsers()
    setMembers(data)
    setFilteredMembers(data)
    setLoading(false)
  }

  // Filter members based on search query, inactive filter, and new filter
  useEffect(() => {
    let filtered = members

    // Apply filters (mutually exclusive - only one active at a time)
    if (showInactiveOnly) {
      filtered = filtered.filter((member) => member.inactive)
      setShowNewOnly(false) // Disable other filter
    } else if (showNewOnly) {
      // Show users approved within last 30 days, sorted by newest first
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      filtered = filtered.filter((member) => {
        if (member.status !== "APPROVED") return false
        if (!member.createdAt) return false
        const createdDate = new Date(member.createdAt)
        return createdDate >= thirtyDaysAgo
      })
      // Sort by newest first (most recent created_at)
      filtered.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setShowInactiveOnly(false) // Disable other filter
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          String(member.mitgliedsnummer).includes(query) ||
          member.phone?.toLowerCase().includes(query)
      )
    }

    setFilteredMembers(filtered)
  }, [searchQuery, members, showInactiveOnly, showNewOnly])

  const handleOpenNegativeBalance = async () => {
    setIsNegativeBalanceDialogOpen(true)
    setLoadingNegativeUsers(true)
    
    const [users30Days, sortedUsers] = await Promise.all([
      getUsersNegative30Days(),
      getUsersSortedByNegativeDays(),
    ])
    
      setNegative30DaysUsers(users30Days)
      setSortedNegativeUsers(sortedUsers)
      setLoadingNegativeUsers(false)
      // Update 90+ days count
      await loadUsers90PlusDaysCount()
  }

  const handleMarkInactive = async (userId: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich als inaktiv markieren?")) {
      return
    }

    const success = await updateUser(userId, { inactive: true })
    if (success) {
      // Refresh negative users lists
      const [users30Days, sortedUsers] = await Promise.all([
        getUsersNegative30Days(),
        getUsersSortedByNegativeDays(),
      ])
      setNegative30DaysUsers(users30Days)
      setSortedNegativeUsers(sortedUsers)
      // Also refresh main members list
      await loadMembers()
      // Update 90+ days count
      await loadUsers90PlusDaysCount()
    } else {
      alert("Fehler beim Markieren als inaktiv")
    }
  }

  const handleReactivateUser = async (userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm("Möchten Sie diesen Benutzer wirklich wieder aktivieren?")) {
      return
    }

    const success = await updateUser(userId, { inactive: false })
    if (success) {
      await loadMembers()
    } else {
      alert("Fehler beim Reaktivieren des Benutzers")
    }
  }

  const handleEdit = (member: User, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingMember(member)
    setFormData({
      name: member.name,
      title: member.title || "",
      role: member.role,
      email: member.email,
      phone: member.phone,
      address: member.address,
    })
    setIsDialogOpen(true)
  }

  const handleViewTransactions = async (member: User, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedMember(member)
    setIsTransactionsDialogOpen(true)
    setLoadingTransactions(true)
    const userTransactions = await getTransactions(member.id)
    setTransactions(userTransactions)
    setLoadingTransactions(false)
  }

  const handleOpenManualTransaction = () => {
    setTransactionFormData({
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    })
    setIsManualTransactionDialogOpen(true)
  }

  const handleCreateManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    const amount = parseFloat(transactionFormData.amount.replace(",", "."))
    if (isNaN(amount) || amount <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein")
      return
    }

    setIsCreatingTransaction(true)
    const transactionId = await processDeposit({
      userId: selectedMember.id,
      amount,
      description: transactionFormData.description || "Manuelle Transaktion",
      date: transactionFormData.date,
    })

    if (transactionId) {
      // Refresh transactions and member list
      const userTransactions = await getTransactions(selectedMember.id)
      setTransactions(userTransactions)
      await loadMembers() // Refresh to update balance
      setIsManualTransactionDialogOpen(false)
      setTransactionFormData({
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      })
    } else {
      alert("Fehler beim Erstellen der Transaktion")
    }
    setIsCreatingTransaction(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingMember) {
      // Update user profile
      const success = await updateUser(editingMember.id, {
        name: formData.name,
        title: formData.title,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      })

      if (!success) {
        alert("Fehler beim Aktualisieren des Mitglieds")
        return
      }

      // Update password if provided
      if (formData.newPassword.trim()) {
        try {
          const response = await fetch("/api/admin/update-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: editingMember.id,
              newPassword: formData.newPassword,
            }),
          })

          const data = await response.json()
          if (!response.ok || !data.success) {
            alert("Fehler beim Aktualisieren des Passworts: " + (data.error || "Unbekannter Fehler"))
            return
          }
        } catch (error) {
          console.error("Error updating password:", error)
          alert("Fehler beim Aktualisieren des Passworts")
          return
        }
      }

      // Refresh list
      await loadMembers()
      setIsDialogOpen(false)
      setEditingMember(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
        <h1 className="text-2xl font-bold">Mitglieder</h1>
            <p className="text-muted-foreground">Verwaltung der Mitglieder ({filteredMembers.length})</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenPendingRegistrations}
              className="gap-2 relative"
            >
              <UserIcon className="h-4 w-4" />
              Ausstehende Registrierungen
              {pendingUsersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                >
                  {pendingUsersCount > 9 ? "9+" : pendingUsersCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenNegativeBalance}
              className="gap-2 relative"
            >
              <AlertTriangle className="h-4 w-4" />
              Negative Balance
              {users90PlusDaysCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                >
                  {users90PlusDaysCount > 9 ? "9+" : users90PlusDaysCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nach Name, E-Mail, ID oder Telefon suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showInactiveOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowInactiveOnly(!showInactiveOnly)
              if (!showInactiveOnly) setShowNewOnly(false)
            }}
          >
            {showInactiveOnly ? "Alle anzeigen" : "Nur Inaktive"}
          </Button>
          <Button
            variant={showNewOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowNewOnly(!showNewOnly)
              if (!showNewOnly) setShowInactiveOnly(false)
            }}
          >
            {showNewOnly ? "Alle anzeigen" : "Nur Neue"}
          </Button>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <p className="text-muted-foreground text-center p-8">
          {searchQuery ? "Keine Mitglieder gefunden" : "Keine Mitglieder vorhanden"}
        </p>
      ) : (
      <div className="space-y-3">
          {filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleViewTransactions(member)}
            >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{getInitials(member.name || "U")}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{member.title ? `${member.title} ${member.name}` : member.name}</p>
                      {member.status === "REJECTED" ? (
                        <Badge variant="destructive" className="h-5">
                          ABGELEHNT
                        </Badge>
                      ) : (
                    <Badge variant={member.role === "ADMIN" ? "default" : "outline"} className="h-5">
                      {member.role === "ADMIN" ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : (
                        <UserIcon className="h-3 w-3 mr-1" />
                      )}
                      {member.role}
                    </Badge>
                      )}
                      {member.inactive && (
                        <Badge variant="destructive" className="h-5">
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {member.mitgliedsnummer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                    <div className="mt-2">
                      <p className={cn(
                        "text-sm font-semibold",
                        member.balance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        Kontostand: {member.balance.toFixed(2)} €
                      </p>
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {showInactiveOnly && member.inactive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => handleReactivateUser(member.id, e)}
                      className="h-9 gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Reaktivieren
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEdit(member, e)}
                    className="h-9 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mitglied bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie die Details des Mitglieds</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Anrede</Label>
              <Select value={formData.title} onValueChange={(value) => setFormData({ ...formData, title: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Wählen Sie eine Anrede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select value={formData.role} onValueChange={(value: Role) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort (optional)</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Leer lassen, um das Passwort nicht zu ändern"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Leer lassen, um das Passwort nicht zu ändern
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 h-12">
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={isTransactionsDialogOpen} onOpenChange={setIsTransactionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  Transaktionen - {selectedMember?.name}
                </DialogTitle>
                <DialogDescription>
                  Kontostand: <span className={cn(
                    "font-semibold",
                    selectedMember?.balance && selectedMember.balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedMember?.balance.toFixed(2)} €
                  </span>
                </DialogDescription>
              </div>
              <Button
                onClick={handleOpenManualTransaction}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Manuelle Transaktion
              </Button>
            </div>
          </DialogHeader>
          
          {loadingTransactions ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>Keine Transaktionen gefunden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {transaction.type === "DEPOSIT" ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "font-semibold text-base flex-shrink-0",
                          transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {transaction.type === "DEPOSIT" ? "+" : ""}
                        {transaction.amount.toFixed(2)} €
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Transaction Dialog */}
      <Dialog open={isManualTransactionDialogOpen} onOpenChange={setIsManualTransactionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manuelle Transaktion erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Transaktion für {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateManualTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (€)</Label>
              <Input
                id="amount"
                type="text"
                value={transactionFormData.amount}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                placeholder="z.B. 10,00 oder 10.00"
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={transactionFormData.description}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                placeholder="z.B. Manuelle Einzahlung"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={transactionFormData.date}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualTransactionDialogOpen(false)}
                className="flex-1 h-12"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={isCreatingTransaction}
                className="flex-1 h-12 gap-2"
              >
                {isCreatingTransaction ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Erstellen
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Negative Balance Dialog */}
      <Dialog open={isNegativeBalanceDialogOpen} onOpenChange={setIsNegativeBalanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Negative Balance Verwaltung</DialogTitle>
            <DialogDescription>
              Benutzer mit negativem Kontostand verwalten und Erinnerungen senden
            </DialogDescription>
          </DialogHeader>

          {loadingNegativeUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="30days" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="30days">
                  30+ Tage ({negative30DaysUsers.length})
                </TabsTrigger>
                <TabsTrigger value="sorted">
                  Sortiert nach Tagen ({sortedNegativeUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="30days" className="mt-4">
                <div className="space-y-3">
                  {negative30DaysUsers.length === 0 ? (
                    <p className="text-center p-8 text-muted-foreground">
                      Keine Benutzer mit negativem Kontostand für 30+ Tage
                    </p>
                  ) : (
                    negative30DaysUsers.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{user.name}</p>
                                {user.inactive && (
                                  <Badge variant="destructive" className="h-5">
                                    Inaktiv
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">ID: {user.mitgliedsnummer}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <div className="mt-2 space-y-1">
                                <p className={cn("text-sm font-semibold", "text-red-600")}>
                                  Kontostand: {user.balance.toFixed(2)} €
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {user.daysInNegative} Tage im Negativen
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={sendingEmail === user.id}
                              onClick={async () => {
                                setSendingEmail(user.id)
                                try {
                                  const success = await sendManualReminderEmail(user.id)
                                  if (success) {
                                    alert(`Erinnerungs-E-Mail wurde erfolgreich an ${user.email} gesendet.`)
                                  } else {
                                    alert(`Fehler beim Senden der E-Mail an ${user.email}. Bitte versuchen Sie es später erneut.`)
                                  }
                                } catch (error) {
                                  console.error("Error sending email:", error)
                                  alert(`Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut.`)
                                } finally {
                                  setSendingEmail(null)
                                }
                              }}
                            >
                              {sendingEmail === user.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Wird gesendet...
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4" />
                                  Erinnerung senden
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sorted" className="mt-4">
                <div className="space-y-3">
                  {sortedNegativeUsers.length === 0 ? (
                    <p className="text-center p-8 text-muted-foreground">
                      Keine Benutzer mit negativem Kontostand
                    </p>
                  ) : (
                    sortedNegativeUsers.map((user) => {
                      const progress = (user.daysInNegative / 90) * 100
                      const isUrgent = user.daysRemaining <= 30
                      
                      return (
                        <Card key={user.id} className={cn(isUrgent && "border-orange-500")}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">{user.name}</p>
                                    {user.inactive && (
                                      <Badge variant="destructive" className="h-5">
                                        Inaktiv
                                      </Badge>
                                    )}
                                    {isUrgent && !user.inactive && (
                                      <Badge variant="outline" className="h-5 border-orange-500 text-orange-600">
                                        Dringend
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">ID: {user.mitgliedsnummer}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                  <div className="mt-2 space-y-2">
                                    <p className={cn("text-sm font-semibold", "text-red-600")}>
                                      Kontostand: {user.balance.toFixed(2)} €
                                    </p>
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Tage im Negativen:</span>
                                        <span className="font-medium">{user.daysInNegative} Tage</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Verbleibend bis 90 Tage:</span>
                                        <span className={cn(
                                          "font-medium",
                                          user.daysRemaining <= 30 ? "text-orange-600" : "text-muted-foreground"
                                        )}>
                                          {user.daysRemaining <= 0 ? "Überschritten" : `${user.daysRemaining} Tage`}
                                        </span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                                        <div
                                          className={cn(
                                            "h-2 rounded-full transition-all",
                                            progress >= 100 ? "bg-red-600" : progress >= 66 ? "bg-orange-500" : "bg-yellow-500"
                                          )}
                                          style={{ width: `${Math.min(100, progress)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {user.daysInNegative >= 90 && !user.inactive && (
                                <div className="flex justify-end pt-2 border-t">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleMarkInactive(user.id)}
                                  >
                                    <X className="h-4 w-4" />
                                    Als inaktiv markieren
                                  </Button>
                                </div>
                              )}
                              {user.inactive && (
                                <div className="flex justify-end pt-2 border-t">
                                  <Badge variant="secondary" className="h-9 flex items-center justify-center gap-2 px-4">
                                    <X className="h-4 w-4" />
                                    Bereits inaktiv
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Registrations Dialog */}
      <Dialog open={isPendingRegistrationsDialogOpen} onOpenChange={setIsPendingRegistrationsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ausstehende Registrierungen</DialogTitle>
            <DialogDescription>
              Neue Benutzer, die auf Ihre Genehmigung warten
            </DialogDescription>
          </DialogHeader>
          
          {loadingPendingUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center p-8">
              Keine ausstehenden Registrierungen
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">
                              {user.title ? `${user.title} ${user.name}` : user.name}
                            </p>
                            <Badge variant="outline" className="h-5">
                              Ausstehend
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><strong>E-Mail:</strong> {user.email}</p>
                            <p><strong>Telefon:</strong> {user.phone || "Nicht angegeben"}</p>
                            <p><strong>Adresse:</strong> {user.address || "Nicht angegeben"}</p>
                            <p><strong>Registriert am:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString("de-DE") : "Unbekannt"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            disabled={processingUserId === user.id}
                            className="gap-2"
                          >
                            {processingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Genehmigen
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectUser(user.id)}
                            disabled={processingUserId === user.id}
                            className="gap-2"
                          >
                            {processingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Ablehnen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
