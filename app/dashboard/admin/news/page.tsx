"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type NewsPost } from "@/lib/mock-data"
import { 
  getNewsPosts, 
  createNewsPost, 
  updateNewsPost, 
  deleteNewsPost,
  getProfileChanges,
  getBalanceErrors,
  acceptProfileChange,
  revertProfileChange,
  resolveBalanceError,
  rejectBalanceError,
  getUsers,
  getTransactions,
  uploadNewsBannerImage,
  type ProfileChange,
  type BalanceError
} from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertCircle, UserCog, ChevronDown, ChevronUp, CheckCircle2, Loader2, ArrowUpCircle, ArrowDownCircle, Pin, PinOff, Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type FilterType = "all" | "unsolved" | "solved"

export default function AdminNewsPage() {
  const { user } = useAuth()
  const [news, setNews] = useState<NewsPost[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [balanceErrors, setBalanceErrors] = useState<BalanceError[]>([])
  const [profileChanges, setProfileChanges] = useState<ProfileChange[]>([])
  const [loadingBalanceErrors, setLoadingBalanceErrors] = useState(false)
  const [loadingProfileChanges, setLoadingProfileChanges] = useState(false)
  const [isBalanceErrorsOpen, setIsBalanceErrorsOpen] = useState(false)
  const [isProfileChangesOpen, setIsProfileChangesOpen] = useState(false)
  const [balanceErrorFilter, setBalanceErrorFilter] = useState<FilterType>("unsolved")
  const [profileChangeFilter, setProfileChangeFilter] = useState<FilterType>("unsolved")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBalanceErrorDialogOpen, setIsBalanceErrorDialogOpen] = useState(false)
  const [selectedBalanceError, setSelectedBalanceError] = useState<BalanceError | null>(null)
  const [selectedBalanceErrorUser, setSelectedBalanceErrorUser] = useState<any>(null)
  const [selectedBalanceErrorTransactions, setSelectedBalanceErrorTransactions] = useState<any[]>([])
  const [loadingBalanceErrorDetails, setLoadingBalanceErrorDetails] = useState(false)
  const [balanceAdjustment, setBalanceAdjustment] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    isPinned: false,
  })
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  useEffect(() => {
    // Load news posts
    loadNews()
    
    // Load users for display
    loadUsers()
    
    // Load notifications
    loadBalanceErrors()
    loadProfileChanges()
  }, [])

  // Separate effect for auto-refresh (only when sections are open)
  useEffect(() => {
    if (!isBalanceErrorsOpen && !isProfileChangesOpen) {
      return // Don't set up interval if sections are closed
    }
    
    // Refresh notifications every 10 seconds to catch new ones (silently, without loading state)
    const interval = setInterval(() => {
      if (isBalanceErrorsOpen) {
        loadBalanceErrors(false) // Don't show loading spinner during auto-refresh
      }
      if (isProfileChangesOpen) {
        loadProfileChanges(false) // Don't show loading spinner during auto-refresh
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [isBalanceErrorsOpen, isProfileChangesOpen])

  const loadUsers = async () => {
    const users = await getUsers()
    setAllUsers(users)
  }

  const loadBalanceErrors = async (showLoading = true) => {
    if (loadingBalanceErrors) return // Prevent concurrent loads
    if (showLoading) setLoadingBalanceErrors(true)
    try {
      const errors = await getBalanceErrors()
      setBalanceErrors(errors)
    } finally {
      if (showLoading) setLoadingBalanceErrors(false)
    }
  }

  const loadProfileChanges = async (showLoading = true) => {
    if (loadingProfileChanges) return // Prevent concurrent loads
    if (showLoading) setLoadingProfileChanges(true)
    try {
      const changes = await getProfileChanges()
      setProfileChanges(changes)
    } finally {
      if (showLoading) setLoadingProfileChanges(false)
    }
  }

  const loadNews = async () => {
    setLoadingNews(true)
    const data = await getNewsPosts()
    setNews(data)
    setLoadingNews(false)
  }

  const unsolvedBalanceErrors = balanceErrors.filter((e) => e.status === "OPEN")
  const unsolvedProfileChanges = profileChanges.filter((c) => c.status === "PENDING")

  // Filter notifications based on selected filter
  const getFilteredBalanceErrors = () => {
    switch (balanceErrorFilter) {
      case "unsolved":
        return balanceErrors.filter((e) => e.status === "OPEN")
      case "solved":
        return balanceErrors.filter((e) => e.status === "RESOLVED" || e.status === "REJECTED")
      case "all":
      default:
        return balanceErrors
    }
  }

  const getFilteredProfileChanges = () => {
    switch (profileChangeFilter) {
      case "unsolved":
        return profileChanges.filter((c) => c.status === "PENDING")
      case "solved":
        return profileChanges.filter((c) => c.status === "ACCEPTED" || c.status === "REVERTED")
      case "all":
      default:
        return profileChanges
    }
  }

  const handleAcceptProfileChange = async (id: string) => {
    if (!user) return
    setProcessingAction(id)
    const success = await acceptProfileChange(id, user.id)
    setProcessingAction(null)
    if (success) {
      await loadProfileChanges()
    } else {
      alert("Fehler beim Akzeptieren der Änderungen")
    }
  }

  const handleRevertProfileChange = async (id: string) => {
    if (!user) return
    if (!confirm("Möchten Sie diese Änderungen wirklich rückgängig machen?")) return
    setProcessingAction(id)
    const success = await revertProfileChange(id, user.id)
    setProcessingAction(null)
    if (success) {
      await loadProfileChanges()
    } else {
      alert("Fehler beim Rückgängigmachen der Änderungen")
    }
  }

  const handleOpenBalanceError = async (error: BalanceError) => {
    setSelectedBalanceError(error)
    setIsBalanceErrorDialogOpen(true)
    setLoadingBalanceErrorDetails(true)
    
    // Load user details
    const users = await getUsers()
    const user = users.find(u => u.id === error.user_id)
    setSelectedBalanceErrorUser(user)
    
    // Load transactions
    const transactions = await getTransactions(error.user_id)
    setSelectedBalanceErrorTransactions(transactions)
    
    setLoadingBalanceErrorDetails(false)
  }

  const handleResolveBalanceError = async () => {
    if (!user || !selectedBalanceError) return
    if (!balanceAdjustment || isNaN(parseFloat(balanceAdjustment))) {
      alert("Bitte geben Sie einen gültigen Betrag ein")
      return
    }
    
    setProcessingAction(selectedBalanceError.id)
    const success = await resolveBalanceError(
      selectedBalanceError.id,
      user.id,
      parseFloat(balanceAdjustment),
      resolutionNotes
    )
    setProcessingAction(null)
    
    if (success) {
      setIsBalanceErrorDialogOpen(false)
      setBalanceAdjustment("")
      setResolutionNotes("")
      await loadBalanceErrors()
    } else {
      alert("Fehler beim Beheben des Fehlers")
    }
  }

  const handleRejectBalanceError = async () => {
    if (!user || !selectedBalanceError) return
    if (!confirm("Möchten Sie diesen Fehler wirklich ablehnen?")) return
    
    setProcessingAction(selectedBalanceError.id)
    const success = await rejectBalanceError(
      selectedBalanceError.id,
      user.id,
      resolutionNotes
    )
    setProcessingAction(null)
    
    if (success) {
      setIsBalanceErrorDialogOpen(false)
      setResolutionNotes("")
      await loadBalanceErrors()
    } else {
      alert("Fehler beim Ablehnen des Fehlers")
    }
  }

  const handleCreate = () => {
    setEditingPost(null)
    setFormData({ title: "", content: "", excerpt: "", isPinned: false })
    setBannerImagePreview(null)
    setBannerImageFile(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      isPinned: post.isPinned || false,
    })
    setBannerImagePreview(post.bannerImageUrl || null)
    setBannerImageFile(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Möchten Sie diesen News-Beitrag wirklich löschen?")) {
      const success = await deleteNewsPost(id)
      if (success) {
        await loadNews()
      } else {
        alert("Fehler beim Löschen des News-Beitrags")
      }
    }
  }

  const handleBannerImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert("Bitte wählen Sie ein gültiges Bildformat (JPEG, PNG oder WebP)")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert("Die Datei ist zu groß. Maximale Größe: 5MB")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setBannerImageFile(file)
  }

  const handleTogglePin = async (post: NewsPost) => {
    const success = await updateNewsPost(post.id, {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      isPinned: !post.isPinned,
      bannerImageUrl: post.bannerImageUrl,
    })
    if (success) {
      await loadNews()
    } else {
      alert("Fehler beim Aktualisieren des News-Beitrags")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let bannerImageUrl = editingPost?.bannerImageUrl || undefined

    // Upload banner image if a new one was selected
    if (bannerImageFile) {
      setIsUploadingBanner(true)
      if (editingPost) {
        // For editing, upload with existing ID
        const uploadedUrl = await uploadNewsBannerImage(editingPost.id, bannerImageFile)
        if (uploadedUrl) {
          bannerImageUrl = uploadedUrl
        }
      } else {
        // For creating, we'll need to create the post first, then upload
        // We'll handle this after creation
      }
      setIsUploadingBanner(false)
    }

    if (editingPost) {
      // Edit existing
      const success = await updateNewsPost(editingPost.id, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        isPinned: formData.isPinned,
        bannerImageUrl: bannerImageUrl,
      })
      if (success) {
        await loadNews()
        setIsDialogOpen(false)
        setEditingPost(null)
        setFormData({ title: "", content: "", excerpt: "", isPinned: false })
        setBannerImagePreview(null)
        setBannerImageFile(null)
      } else {
        alert("Fehler beim Aktualisieren des News-Beitrags")
      }
    } else {
      // Create new
      const newPostId = await createNewsPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        isPinned: formData.isPinned,
        bannerImageUrl: undefined, // Will upload after creation
      })
      if (newPostId) {
        // Upload banner image if one was selected
        if (bannerImageFile) {
          setIsUploadingBanner(true)
          const uploadedUrl = await uploadNewsBannerImage(newPostId, bannerImageFile)
          if (uploadedUrl) {
            await updateNewsPost(newPostId, {
              title: formData.title,
              content: formData.content,
              excerpt: formData.excerpt,
              isPinned: formData.isPinned,
              bannerImageUrl: uploadedUrl,
            })
          }
          setIsUploadingBanner(false)
        }
        await loadNews()
        setIsDialogOpen(false)
        setEditingPost(null)
        setFormData({ title: "", content: "", excerpt: "", isPinned: false })
        setBannerImagePreview(null)
        setBannerImageFile(null)
      } else {
        alert("Fehler beim Erstellen des News-Beitrags")
      }
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">News verwalten</h1>
          <p className="text-muted-foreground">Beiträge erstellen und bearbeiten</p>
        </div>
        <Button onClick={handleCreate} size="lg" className="gap-2 h-12">
          <Plus className="h-5 w-5" />
          Neu
        </Button>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        {/* Balance Error Notifications */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <button
              onClick={() => setIsBalanceErrorsOpen(!isBalanceErrorsOpen)}
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Kontostand-Fehler Meldungen</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {unsolvedBalanceErrors.length > 0 && (
                  <Badge variant="destructive" className="h-6">
                    {unsolvedBalanceErrors.length}
                  </Badge>
                )}
                {isBalanceErrorsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CardHeader>
          {isBalanceErrorsOpen && (
            <CardContent>
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={balanceErrorFilter === "unsolved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBalanceErrorFilter("unsolved")}
                  className="h-8 text-xs"
                >
                  Offen ({unsolvedBalanceErrors.length})
                </Button>
                <Button
                  variant={balanceErrorFilter === "solved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBalanceErrorFilter("solved")}
                  className="h-8 text-xs"
                >
                  Erledigt ({balanceErrors.length - unsolvedBalanceErrors.length})
                </Button>
                <Button
                  variant={balanceErrorFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBalanceErrorFilter("all")}
                  className="h-8 text-xs"
                >
                  Alle ({balanceErrors.length})
                </Button>
              </div>

              {loadingBalanceErrors ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : getFilteredBalanceErrors().length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {balanceErrors.length === 0
                    ? "Keine Meldungen"
                    : "Keine Meldungen in dieser Kategorie"}
                </p>
              ) : (
                <div className="space-y-3">
                  {getFilteredBalanceErrors().map((error) => {
                    const errorUser = allUsers.find(u => u.id === error.user_id)
                    return (
                      <Card
                        key={error.id}
                        className={`bg-white ${error.status !== "OPEN" ? "opacity-60" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {errorUser ? (errorUser.title ? `${errorUser.title} ${errorUser.name}` : errorUser.name) : `ID: ${error.user_id.substring(0, 8)}...`}
                                </p>
                                {errorUser && (
                                  <span className="text-xs text-muted-foreground">
                                    ({errorUser.mitgliedsnummer})
                                  </span>
                                )}
                                {error.status !== "OPEN" && (
                                  <Badge variant="outline" className="h-5 text-xs">
                                    {error.status === "RESOLVED" ? "Behoben" : "Abgelehnt"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Gemeldeter Kontostand: <span className="font-semibold text-orange-600">{error.reported_balance.toFixed(2)} €</span>
                              </p>
                              {error.description && (
                                <p className="text-xs text-muted-foreground mt-1">{error.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(error.created_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {error.status === "OPEN" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenBalanceError(error)}
                                className="gap-2 h-9"
                              >
                                Öffnen
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Profile Change Notifications */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <button
              onClick={() => setIsProfileChangesOpen(!isProfileChangesOpen)}
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Profiländerungen</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {unsolvedProfileChanges.length > 0 && (
                  <Badge variant="default" className="h-6">
                    {unsolvedProfileChanges.length}
                  </Badge>
                )}
                {isProfileChangesOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CardHeader>
          {isProfileChangesOpen && (
            <CardContent>
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={profileChangeFilter === "unsolved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfileChangeFilter("unsolved")}
                  className="h-8 text-xs"
                >
                  Offen ({unsolvedProfileChanges.length})
                </Button>
                <Button
                  variant={profileChangeFilter === "solved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfileChangeFilter("solved")}
                  className="h-8 text-xs"
                >
                  Erledigt ({profileChanges.length - unsolvedProfileChanges.length})
                </Button>
                <Button
                  variant={profileChangeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfileChangeFilter("all")}
                  className="h-8 text-xs"
                >
                  Alle ({profileChanges.length})
                </Button>
              </div>

              {loadingProfileChanges ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : getFilteredProfileChanges().length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {profileChanges.length === 0
                    ? "Keine Änderungen"
                    : "Keine Änderungen in dieser Kategorie"}
                </p>
              ) : (
                <div className="space-y-3">
                  {getFilteredProfileChanges().map((change) => {
                    const changeUser = allUsers.find(u => u.id === change.user_id)
                    return (
                      <Card
                        key={change.id}
                        className={`bg-white ${change.status !== "PENDING" ? "opacity-60" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-sm">
                                  {changeUser ? (changeUser.title ? `${changeUser.title} ${changeUser.name}` : changeUser.name) : `ID: ${change.user_id.substring(0, 8)}...`}
                                </p>
                                {changeUser && (
                                  <span className="text-xs text-muted-foreground">
                                    ({changeUser.mitgliedsnummer})
                                  </span>
                                )}
                                {change.status !== "PENDING" && (
                                  <Badge variant="outline" className="h-5 text-xs">
                                    {change.status === "ACCEPTED" ? "Akzeptiert" : "Rückgängig"}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                {Object.entries(change.changes).map(([field, changeData]) => {
                                  const fieldLabels: Record<string, string> = {
                                    name: "Name",
                                    title: "Anrede",
                                    email: "E-Mail",
                                    phone: "Telefon",
                                    address: "Adresse",
                                    postalCode: "PLZ",
                                    city: "Ort",
                                  }
                                  return (
                                    <div key={field} className="text-sm">
                                      <span className="text-muted-foreground">{fieldLabels[field] || field}:</span>{" "}
                                      <span className="line-through text-muted-foreground">{changeData.old}</span>{" "}
                                      <span className="text-blue-600">→</span>{" "}
                                      <span className="font-medium">{changeData.new}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(change.created_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {change.status === "PENDING" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAcceptProfileChange(change.id)}
                                  disabled={processingAction === change.id}
                                  className="gap-2 h-9"
                                >
                                  {processingAction === change.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  Akzeptieren
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevertProfileChange(change.id)}
                                  disabled={processingAction === change.id}
                                  className="gap-2 h-9"
                                >
                                  Rückgängig
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* News Management Section */}
      <div className="pt-4 border-t">
        <h2 className="text-xl font-semibold mb-4">News Beiträge verwalten</h2>

        {/* News List */}
      {loadingNews ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground text-center p-8">Keine News-Beiträge vorhanden</p>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {post.isPinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-lg text-balance">{post.title}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(post.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant={post.isPinned ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handleTogglePin(post)} 
                    className="h-9 w-9 p-0"
                    title={post.isPinned ? "Von oben entfernen" : "Oben fixieren"}
                  >
                    {post.isPinned ? (
                      <Pin className="h-4 w-4" />
                    ) : (
                      <PinOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(post)} className="h-9 w-9 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)} className="h-9 w-9 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{post.content}</p>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      </div>

      {/* Balance Error Dialog */}
      <Dialog open={isBalanceErrorDialogOpen} onOpenChange={setIsBalanceErrorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Balance-Fehler beheben</DialogTitle>
            <DialogDescription>
              Überprüfen Sie die Transaktionen und beheben Sie den Fehler
            </DialogDescription>
          </DialogHeader>
          
          {loadingBalanceErrorDetails ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedBalanceError && selectedBalanceErrorUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">Benutzer</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{selectedBalanceErrorUser.title ? `${selectedBalanceErrorUser.title} ${selectedBalanceErrorUser.name}` : selectedBalanceErrorUser.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID:</span>{" "}
                    <span className="font-medium">{selectedBalanceErrorUser.mitgliedsnummer}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-Mail:</span>{" "}
                    <span className="font-medium">{selectedBalanceErrorUser.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aktueller Kontostand:</span>{" "}
                    <span className={cn("font-medium", selectedBalanceErrorUser.balance >= 0 ? "text-green-600" : "text-red-600")}>
                      {selectedBalanceErrorUser.balance.toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gemeldeter Kontostand:</span>{" "}
                    <span className="font-medium text-orange-600">
                      {selectedBalanceError.reported_balance.toFixed(2)} €
                    </span>
                  </div>
                </div>
                {selectedBalanceError.description && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Beschreibung:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedBalanceError.description}</p>
                  </div>
                )}
              </div>

              {/* Transaction History */}
              <div className="space-y-2">
                <h3 className="font-semibold">Transaktionsverlauf</h3>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {selectedBalanceErrorTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">Keine Transaktionen</p>
                  ) : (
                    <div className="divide-y">
                      {selectedBalanceErrorTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{transaction.description || "Transaktion"}</p>
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
                          <div className="flex items-center gap-2">
                            {transaction.type === "DEPOSIT" ? (
                              <ArrowUpCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={cn(
                              "text-sm font-semibold",
                              transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.amount >= 0 ? "+" : ""}{transaction.amount.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Adjustment Form */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Balance anpassen</h3>
                <div className="space-y-2">
                  <Label htmlFor="balanceAdjustment">Anpassungsbetrag (€)</Label>
                  <Input
                    id="balanceAdjustment"
                    type="number"
                    step="0.01"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    placeholder="z.B. 50.00 für +50€ oder -50.00 für -50€"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Positiver Wert erhöht den Kontostand, negativer Wert verringert ihn
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolutionNotes">Notizen (optional)</Label>
                  <Textarea
                    id="resolutionNotes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Beschreibung der Lösung..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBalanceErrorDialogOpen(false)}
                    className="flex-1 h-12"
                    disabled={!!processingAction}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRejectBalanceError}
                    className="flex-1 h-12"
                    disabled={!!processingAction}
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verarbeitung...
                      </>
                    ) : (
                      "Ablehnen"
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResolveBalanceError}
                    className="flex-1 h-12"
                    disabled={!!processingAction || !balanceAdjustment || isNaN(parseFloat(balanceAdjustment))}
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verarbeitung...
                      </>
                    ) : (
                      "Fehler beheben"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Beitrag bearbeiten" : "Neuer Beitrag"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Ändern Sie die Details des Beitrags" : "Erstellen Sie einen neuen Beitrag"}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Kurzbeschreibung</Label>
              <Input
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPinned" className="text-sm font-normal cursor-pointer">
                Oben fixieren
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerImage">Banner-Bild (optional)</Label>
              {bannerImagePreview && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img 
                    src={bannerImagePreview} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => {
                      setBannerImagePreview(null)
                      setBannerImageFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!bannerImagePreview && (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="bannerImage"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Bild auswählen</span>
                  </label>
                  <Input
                    id="bannerImage"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleBannerImageSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1 h-12" disabled={isUploadingBanner}>
                {isUploadingBanner ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Hochladen...
                  </>
                ) : (
                  editingPost ? "Speichern" : "Erstellen"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
