"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { createProfileChange, uploadUserImage, deleteUserImage } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, Upload, Edit, Save, X, Loader2, Mail, Phone, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProfilePage() {
  const { user, logout, updateUser: updateUserState, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        title: user.title || "",
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        postalCode: user.postalCode || "",
        city: user.city || "",
      })
      setImagePreview(null)
      setUploadedImageUrl(null)
    }
  }, [user])

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setErrors({})
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        title: user.title || "",
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        postalCode: user.postalCode || "",
        city: user.city || "",
      })
    }
    setImagePreview(null)
    setUploadedImageUrl(null)
    setIsEditMode(false)
    setErrors({})
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

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
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    setIsUploadingImage(true)
    const imageUrl = await uploadUserImage(user.id, file)
    setIsUploadingImage(false)

    if (imageUrl) {
      setUploadedImageUrl(imageUrl)
    } else {
      alert("Fehler beim Hochladen des Bildes")
      setImagePreview(null)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name ist erforderlich"
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon ist erforderlich"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Adresse ist erforderlich"
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "PLZ ist erforderlich"
    }

    if (!formData.city.trim()) {
      newErrors.city = "Ort ist erforderlich"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    setIsSaving(true)

    // Delete old image if new one was uploaded
    if (uploadedImageUrl && user.avatar) {
      await deleteUserImage(user.avatar)
    }

    // Track changes
    const changes: Record<string, { old: string; new: string }> = {}

    if (user.name !== formData.name.trim()) {
      changes.name = { old: user.name, new: formData.name.trim() }
    }
    if (user.title !== formData.title) {
      changes.title = { old: user.title || "", new: formData.title }
    }
    if (user.email !== formData.email.trim()) {
      changes.email = { old: user.email, new: formData.email.trim() }
    }
    if (user.phone !== formData.phone.trim()) {
      changes.phone = { old: user.phone, new: formData.phone.trim() }
    }
    if (user.address !== formData.address.trim()) {
      changes.address = { old: user.address || "", new: formData.address.trim() }
    }
    if (user.postalCode !== formData.postalCode.trim()) {
      changes.postalCode = { old: user.postalCode || "", new: formData.postalCode.trim() }
    }
    if (user.city !== formData.city.trim()) {
      changes.city = { old: user.city || "", new: formData.city.trim() }
    }

    // Only create profile change if there are actual changes
    if (Object.keys(changes).length > 0) {
      const profileChangeId = await createProfileChange(user.id, changes)
      
      if (profileChangeId) {
        alert("Änderungen wurden zur Überprüfung eingereicht. Sie werden benachrichtigt, sobald ein Administrator die Änderungen überprüft hat.")
        
        // Reset form to original values since changes are pending approval
        setFormData({
          name: user.name,
          title: user.title || "",
          email: user.email,
          phone: user.phone,
          postalCode: user.postalCode || "",
          city: user.city || "",
        })
        setImagePreview(null)
        setUploadedImageUrl(null)
        setIsEditMode(false)
        setErrors({})
      } else {
        alert("Fehler beim Einreichen der Änderungen")
      }
    } else {
      // No changes, just close edit mode
      setIsEditMode(false)
      setErrors({})
    }

    setIsSaving(false)
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const displayImage = imagePreview || uploadedImageUrl || user.avatar

  return (
    <div className="min-h-screen p-4 space-y-6 pb-24">
      {/* Top Section - Profile Picture, Name, ID */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="pt-6 pb-8">
          <div className="flex flex-col items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={displayImage || "/placeholder.svg"} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  {isUploadingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <Upload className="h-8 w-8 text-white" />
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Name and ID */}
            <div className="text-center space-y-2">
              {isEditMode ? (
                <div className="space-y-2 w-full max-w-xs">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Anrede</Label>
                    <Select value={formData.title} onValueChange={(value) => setFormData({ ...formData, title: value })}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Wählen Sie eine Anrede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 text-xl font-bold text-center"
                    required
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Mitgliedsnummer</Label>
                    <p className="font-medium text-lg">{user.mitgliedsnummer}</p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold">
                    {user.title ? `${user.title} ${user.name}` : user.name}
                  </h2>
                  <p className="text-muted-foreground">ID: {user.mitgliedsnummer}</p>
                </>
              )}
            </div>

            {/* Edit Button */}
            {!isEditMode && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail
              </Label>
              {isEditMode ? (
                <>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12"
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </>
              ) : (
                <p className="font-medium text-base">{user.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              {isEditMode ? (
                <>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12"
                    required
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </>
              ) : (
                <p className="font-medium text-base">{user.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              {isEditMode ? (
                <>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-12"
                    required
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </>
              ) : (
                <p className="font-medium text-base">{user.address || "-"}</p>
              )}
            </div>

            {/* PLZ and Ort */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  PLZ
                </Label>
                {isEditMode ? (
                  <>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="h-12"
                      required
                      maxLength={10}
                    />
                    {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                  </>
                ) : (
                  <p className="font-medium text-base">{user.postalCode || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ort
                </Label>
                {isEditMode ? (
                  <>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-12"
                      required
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </>
                ) : (
                  <p className="font-medium text-base">{user.city || "-"}</p>
                )}
              </div>
            </div>

            {/* Save/Cancel Buttons (Edit Mode) */}
            {isEditMode && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-12 gap-2"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 h-12 gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full h-12 gap-2"
        onClick={handleLogout}
        disabled={isEditMode}
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </Button>
    </div>
  )
}
