"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Registration form state
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regTitle, setRegTitle] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPostalCode, setRegPostalCode] = useState("")
  const [regCity, setRegCity] = useState("")
  const [regError, setRegError] = useState("")
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)
  
  const router = useRouter()
  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
        const { error, user } = await login(email, password)
        if (error) {
            setError(error.message || "Login fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.")
        } else {
            // Redirect based on user role
            if (user?.role === "ADMIN") {
                router.push("/dashboard/admin/verwaltung")
            } else {
                router.push("/dashboard")
            }
        }
    } catch (err) {
        setError("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
        setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError("")
    setRegSuccess(false)
    
    // Validation
    if (!regTitle) {
      setRegError("Bitte wählen Sie eine Anrede (Herr/Frau)")
      return
    }
    
    setRegLoading(true)

    try {
        const { error } = await signup(regEmail, regPassword, regName, regTitle, regPhone, regPostalCode, regCity)
        if (error) {
            setRegError(error.message || "Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.")
        } else {
            setRegSuccess(true)
            // Reset form
            setRegEmail("")
            setRegPassword("")
            setRegName("")
            setRegTitle("")
            setRegPhone("")
            setRegPostalCode("")
            setRegCity("")
        }
    } catch (err) {
        setRegError("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
        setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Willkommen</CardTitle>
          <CardDescription className="text-center">Melden Sie sich an oder registrieren Sie sich</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-base"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base"
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anmelden
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              {regSuccess ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    Registrierung erfolgreich!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Bitte warten Sie auf die Bestätigung durch einen Administrator. Sie erhalten eine E-Mail, sobald Ihr Konto freigeschaltet wurde.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-title">Anrede *</Label>
                    <Select value={regTitle} onValueChange={setRegTitle} required>
                      <SelectTrigger className="h-12 text-base" disabled={regLoading}>
                        <SelectValue placeholder="Wählen Sie eine Anrede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Name *</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Max Mustermann"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="h-12 text-base"
                      disabled={regLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">E-Mail *</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                      disabled={regLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Passwort *</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="h-12 text-base"
                      disabled={regLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Telefon *</Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="+43 123 456789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="h-12 text-base"
                      disabled={regLoading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-postal-code">PLZ *</Label>
                      <Input
                        id="reg-postal-code"
                        type="text"
                        placeholder="12345"
                        value={regPostalCode}
                        onChange={(e) => setRegPostalCode(e.target.value)}
                        required
                        className="h-12 text-base"
                        disabled={regLoading}
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-city">Ort *</Label>
                      <Input
                        id="reg-city"
                        type="text"
                        placeholder="Musterstadt"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        required
                        className="h-12 text-base"
                        disabled={regLoading}
                      />
                    </div>
                  </div>
                  
                  {regError && <p className="text-sm text-destructive">{regError}</p>}
                  
                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={regLoading}>
                    {regLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrieren
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
