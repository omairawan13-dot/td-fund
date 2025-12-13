"use client"

import { useState, useEffect } from "react"
import { type NewsPost } from "@/lib/mock-data"
import { getNewsPosts } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Pin } from "lucide-react"

export default function NewsPage() {
  const [news, setNews] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    setLoading(true)
    const data = await getNewsPosts()
    setNews(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Neuigkeiten</h1>
        <p className="text-muted-foreground">Aktuelle Informationen</p>
      </div>

      {/* News List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground text-center p-8">Keine Neuigkeiten vorhanden</p>
      ) : (
        <div className="space-y-4">
          {news.map((post) => (
            <Card key={post.id}>
              {post.bannerImageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={post.bannerImageUrl} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {post.isPinned && (
                      <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                    <CardTitle className="text-lg text-balance">{post.title}</CardTitle>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
