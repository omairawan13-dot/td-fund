"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Newspaper, User, FileText, Users, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { getUnsolvedNotificationsByType } from "@/lib/mock-data"
import { getPendingReviews, getInactiveUsers90Days, getUsersWithAnyNegativeBalance } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      const updateCount = () => {
        const balanceErrors = getUnsolvedNotificationsByType("BALANCE_ERROR")
        const profileChanges = getUnsolvedNotificationsByType("PROFILE_CHANGE")
        setNotificationCount(balanceErrors.length + profileChanges.length)
      }

      const updatePendingReviews = async () => {
        const pending = await getPendingReviews()
        setPendingReviewsCount(pending.length)
      }

      const updateInactiveUsers = async () => {
        // Count users who have been negative for 90+ days but are NOT yet inactive
        const inactiveUsers = await getInactiveUsers90Days()
        setInactiveUsersCount(inactiveUsers.length)
      }

      updateCount()
      updatePendingReviews()
      updateInactiveUsers()
      
      // Refresh every 2 seconds
      const interval = setInterval(() => {
        updateCount()
        updatePendingReviews()
        updateInactiveUsers()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (!user) return null

  const userNavItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/news", icon: Newspaper, label: "News" },
    { href: "/dashboard/profile", icon: User, label: "Profil" },
  ]

  const adminNavItems = [
    { href: "/dashboard/admin/news", icon: Newspaper, label: "News" },
    { href: "/dashboard/admin/cases", icon: FileText, label: "Cases" },
    { href: "/dashboard/admin/verwaltung", icon: Settings, label: "Verwaltung" },
    { href: "/dashboard/admin/members", icon: Users, label: "Members" },
    { href: "#", icon: LogOut, label: "Abmelden", action: "logout" },
  ]

  const navItems = user.role === "ADMIN" ? adminNavItems : userNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.action === "logout") {
            return (
              <button
                key="logout"
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          }

          // Show notification badge on News item for admin
          const showNewsBadge = user.role === "ADMIN" && item.href === "/dashboard/admin/news" && notificationCount > 0
          // Show notification badge on Verwaltung item for pending manual reviews
          const showVerwaltungBadge = user.role === "ADMIN" && item.href === "/dashboard/admin/verwaltung" && pendingReviewsCount > 0
          // Show notification badge on Members item for inactive users (90+ days)
          const showMembersBadge = user.role === "ADMIN" && item.href === "/dashboard/admin/members" && inactiveUsersCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showNewsBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
                {showVerwaltungBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {pendingReviewsCount > 9 ? "9+" : pendingReviewsCount}
                  </Badge>
                )}
                {showMembersBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {inactiveUsersCount > 9 ? "9+" : inactiveUsersCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
