"use client"

import { useAuth } from "@/lib/auth"
import { type Transaction } from "@/lib/mock-data"
import { createBalanceError, getUserNotifications, markNotificationAsRead, getTransactions, type UserNotification } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpCircle, ArrowDownCircle, Loader2, Bell, X } from "lucide-react"
import { cn } from "@/lib/utils"
import QRCode from "react-qr-code"
import { useMemo, useState, useEffect } from "react"
import { getDefaultSEPADetails, generateEPCQRCodeData } from "@/lib/payment-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user, refreshUser } = useAuth()
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (user?.id) {
        const loadData = async () => {
            // Refresh user data to get latest balance
            await refreshUser()
            
            // Load transactions
            setLoadingTransactions(true)
            const data = await getTransactions(user.id)
            setTransactions(data)
            setLoadingTransactions(false)
            
            // Load notifications
            setLoadingNotifications(true)
            const notifs = await getUserNotifications(user.id)
            setNotifications(notifs)
            setLoadingNotifications(false)
        }
        loadData()
    }
  }, [user?.id, refreshUser])

  const handleMarkNotificationAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    const notifs = await getUserNotifications(user?.id || "")
    setNotifications(notifs)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Get SEPA details from environment variables
  const sepaDetails = useMemo(() => getDefaultSEPADetails(), [])

  const amountToTransfer = useMemo(() => {
    if (!user) return 0
    if (user.balance >= 0) return 0
    return Math.abs(user.balance)
  }, [user])

  const epcQrData = useMemo(() => {
    if (!user || amountToTransfer === 0) return null

    return generateEPCQRCodeData({
      amount: amountToTransfer,
      memberId: user.mitgliedsnummer,
      sepaDetails,
    })
  }, [user, amountToTransfer, sepaDetails])

  const handleErrorReport = async () => {
    if (!user) return

    setShowErrorDialog(false)

    // Create balance error report
    const errorId = await createBalanceError(user.id)
    
    if (errorId) {
      alert("Fehler wurde gemeldet. Ein Administrator wird dies überprüfen und Sie benachrichtigen.")
    } else {
      alert("Fehler beim Melden des Problems. Bitte versuchen Sie es erneut.")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-balance">Willkommen zurück</h1>
        <p className="text-muted-foreground">{user.name}</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-sm font-medium opacity-90">Aktueller Kontostand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-4xl font-bold">{user.balance.toFixed(2)} €</div>
          <Button variant="secondary" size="sm" className="w-auto" onClick={() => setShowErrorDialog(true)}>
            Fehler melden
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Benachrichtigungen
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-8"
              >
                {showNotifications ? "Ausblenden" : "Anzeigen"}
              </Button>
            </div>
          </CardHeader>
          {showNotifications && (
            <CardContent>
              {loadingNotifications ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                        !notification.read && "bg-blue-50 border-blue-200"
                      )}
                      onClick={() => !notification.read && handleMarkNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {user.balance < 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base">Ausgleichszahlung erforderlich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Überweisungsdetails:</p>
              <div className="bg-white p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empfänger:</span>
                  <span className="font-medium">{sepaDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBAN:</span>
                  <span className="font-mono text-xs">{sepaDetails.iban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betrag:</span>
                  <span className="font-semibold text-orange-600">{amountToTransfer.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verwendungszweck:</span>
                  <span className="font-medium">Mitgliedsnummer: {user.mitgliedsnummer}</span>
                </div>
              </div>
            </div>

            {/* QR Code for payment */}
            {epcQrData && (
              <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg">
                <p className="text-sm font-medium">QR-Code scannen zum Bezahlen</p>
                <div className="bg-white p-3 rounded-lg">
                  <QRCode value={epcQrData} size={200} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Scannen Sie diesen Code mit Ihrer Banking-App
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Transaktionen</h2>
        {loadingTransactions ? (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">Keine Transaktionen gefunden</p>
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
      </div>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fehler melden</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Willst du wirklich den Fehler melden? Es kann bis zu 14 Tage dauern bis dein Kontostand ausgeglichen wird.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogCancel className="m-0" onClick={() => setShowErrorDialog(false)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleErrorReport} variant="outline" className="m-0">
              Fortfahren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
