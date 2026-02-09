"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/lib/auth"
import { getChatMessages, getOrCreateUserChatThread, markChatAsRead, sendChatMessage, type ChatMessage, type ChatThread } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export default function UserChatPage() {
  const { user } = useAuth()
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  )

  const loadMessages = async (threadId: string, markAsRead = false) => {
    setLoadingMessages(true)
    const fetchedMessages = await getChatMessages(threadId)
    setMessages(fetchedMessages)
    if (markAsRead) {
      await markChatAsRead(threadId, "USER")
    }
    setLoadingMessages(false)
  }

  const loadThreadAndMessages = async () => {
    if (!user?.id) return

    setLoadingThread(true)
    const userThread = await getOrCreateUserChatThread(user.id)
    setThread(userThread)

    if (userThread) {
      await loadMessages(userThread.id, true)
    } else {
      setMessages([])
    }

    setLoadingThread(false)
  }

  useEffect(() => {
    if (user?.id && user.role !== "ADMIN") {
      loadThreadAndMessages()
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!thread?.id) return

    const interval = setInterval(async () => {
      const fetchedMessages = await getChatMessages(thread.id)
      setMessages(fetchedMessages)
    }, 5000)

    return () => clearInterval(interval)
  }, [thread?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [sortedMessages])

  const handleSend = async () => {
    if (!user?.id || !thread?.id || !messageText.trim()) return

    setSending(true)
    const success = await sendChatMessage(thread.id, user.id, messageText)

    if (success) {
      setMessageText("")
      await loadMessages(thread.id, true)
    } else {
      alert("Nachricht konnte nicht gesendet werden")
    }

    setSending(false)
  }

  if (!user) return null

  if (user.role === "ADMIN") {
    return (
      <div className="min-h-screen p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Bitte verwenden Sie den Admin-Chat unter Admin &gt; Chats.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 space-y-6 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Admin kontaktieren</h1>
        <p className="text-muted-foreground">Schreiben Sie direkt an das Admin-Team</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingThread || loadingMessages ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">Noch keine Nachrichten. Starten Sie den Chat mit einer Nachricht.</p>
            </div>
          ) : (
            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {sortedMessages.map((message) => {
                const isOwnMessage = message.sender_id === user.id
                return (
                  <div key={message.id} className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
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
              placeholder="Ihre Nachricht an den Admin..."
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
              Nachricht senden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
