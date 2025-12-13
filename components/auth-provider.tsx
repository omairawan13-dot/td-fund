"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkSession } = useAuth()

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    // Allow access to login page
    if (pathname === "/login") {
      return
    }

    // Wait for loading to finish
    if (isLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading && pathname !== "/login") {
    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  return <>{children}</>
}
