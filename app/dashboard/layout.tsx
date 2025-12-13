import type React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { AuthProvider } from "@/components/auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background pb-16">{children}</div>
      <MobileNav />
    </AuthProvider>
  )
}
