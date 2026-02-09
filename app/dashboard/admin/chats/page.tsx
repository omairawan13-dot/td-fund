"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getAdminChatThreads, getChatMessages, markChatAsRead, sendChatMessage, type ChatMessage, type ChatThread } from "@/lib/api"
import { Loader2, Send } from "lucide-react"

export default function AdminChatsPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId]
  )

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  )

  const loadThreads = async (showLoading = true) => {
    if (showLoading) setLoadingThreads(true)
    const fetchedThreads = await getAdminChatThreads()
    setThreads(fetchedThreads)

    setSelectedThreadId((current) => {
      if (current && fetchedThreads.some((thread) => thread.id === current)) {
        return current
      }
      return fetchedThreads[0]?.id || null
    })

    if (showLoading) setLoadingThreads(false)
  }

  const loadMessages = async (threadId: string, markAsRead = false) => {
    setLoadingMessages(true)
    const fetchedMessages = await getChatMessages(threadId)
    setMessages(fetchedMessages)

    if (markAsRead) {
      await markChatAsRead(threadId, "ADMIN")
      await loadThreads(false)
    }

    setLoadingMessages(false)
  }

  useEffect(() => {
    if (user?.id && user.role === "ADMIN") {
      loadThreads(true)
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      return
    }

    loadMessages(selectedThreadId, true)
  }, [selectedThreadId])

  useEffect(() => {
    if (user?.role !== "ADMIN") return

    const interval = setInterval(async () => {
      await loadThreads(false)
      if (selectedThreadId) {
        const fetchedMessages = await getChatMessages(selectedThreadId)
        setMessages(fetchedMessages)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedThreadId, user?.role])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [sortedMessages])

  const handleSend = async () => {
    if (!user?.id || !selectedThreadId || !messageText.trim()) return

    setSending(true)
    const success = await sendChatMessage(selectedThreadId, user.id, messageText)

    if (success) {
      setMessageText("")
      await loadMessages(selectedThreadId, true)
    } else {
      alert("Nachricht konnte nicht gesendet werden")
    }

    setSending(false)
  }

  if (!user) return null

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Dieser Bereich ist nur für Administratoren verfügbar.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 space-y-6 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Chats</h1>
        <p className="text-muted-foreground">Alle Nachrichten von Mitgliedern</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konversationen</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingThreads ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Noch keine Chats vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => {
                const isSelected = thread.id === selectedThreadId
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {thread.user?.name || "Unbekannter Nutzer"}
                          {typeof thread.user?.member_id === "number" && (
                            <span className="ml-1 text-xs text-muted-foreground">(Nr. {thread.user.member_id})</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {thread.last_message_preview || "Noch keine Nachricht"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {thread.last_message_at
                            ? new Date(thread.last_message_at).toLocaleString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </p>
                      </div>
                      {thread.unread_for_admin > 0 && (
                        <Badge variant="destructive">{thread.unread_for_admin}</Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedThread && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nachrichten mit {selectedThread.user?.name || "Mitglied"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Noch keine Nachrichten in diesem Chat.</p>
              </div>
            ) : (
              <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                {sortedMessages.map((message) => {
                  const isOwnMessage = message.sender_id === user.id

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        )}
                      >
                        <p className="break-words whitespace-pre-wrap">{message.message}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {new Date(message.created_at).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}

            <div className="space-y-2 border-t pt-3">
              <Textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Antwort an das Mitglied..."
                rows={3}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button onClick={handleSend} disabled={sending || !messageText.trim()} className="w-full gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Antwort senden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
