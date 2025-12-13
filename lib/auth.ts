"use client"

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { type User } from "./mock-data"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any; user?: User | null }>
  signup: (email: string, password: string, name: string, title: string, phone: string, postalCode: string, city: string) => Promise<{ error: any; user?: User | null }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<Omit<User, "id" | "mitgliedsnummer" | "role" | "balance">>) => void
}

const fetchUserFromSupabase = async (userId: string): Promise<User | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (error || !data) {
    console.error("Error fetching user from Supabase:", error)
    return null
  }

  return {
    id: data.id,
    email: data.email,
    role: (data.role || "USER") as "USER" | "ADMIN",
    mitgliedsnummer: data.member_id || 0,
    memberId: data.member_id || 0,
    name: data.name || "",
    title: data.title || undefined,
    address: data.address || "", // Kept for backward compatibility
    postalCode: data.postal_code || undefined,
    city: data.city || undefined,
    phone: data.phone || "",
    balance: parseFloat(data.balance || 0),
    avatar: data.image_url || undefined,
    inactive: data.inactive || false,
    status: (data.status || "APPROVED") as "PENDING" | "APPROVED" | "REJECTED",
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, password) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    let loggedInUser: User | null = null
    let loginError: any = error

    if (!error && data.user) {
      const user = await fetchUserFromSupabase(data.user.id)
      if (user) {
        // Check user status
        if (user.status === "PENDING") {
          loginError = { message: "Ihr Konto wartet noch auf die Bestätigung durch einen Administrator." }
        } else if (user.status === "REJECTED") {
          loginError = { message: "Ihr Konto wurde abgelehnt. Bitte kontaktieren Sie einen Administrator." }
        } else if (user.status === "APPROVED") {
          loggedInUser = user
          set({ user, isAuthenticated: true })
        }
      } else {
        // Fallback: create minimal user object
        const fallbackUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          role: "USER",
          mitgliedsnummer: 0,
          memberId: 0,
          name: data.user.email || "New User",
          address: "",
          phone: "",
          balance: 0,
          status: "APPROVED",
        }
        loggedInUser = fallbackUser
        set({ user: fallbackUser, isAuthenticated: true })
      }
    }
    return { error: loginError, user: loggedInUser }
  },
  signup: async (email, password, name, title, phone, postalCode, city) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          title,
          phone,
          postal_code: postalCode,
          city: city,
          role: "USER",
        },
      },
    })

    if (error) {
      return { error, user: null }
    }

    // The trigger will create the user profile with status = 'PENDING'
    // We don't log them in automatically - they must wait for approval
    return { error: null, user: null }
  },
  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
  checkSession: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user?.id) {
      const user = await fetchUserFromSupabase(session.user.id)
      if (user) {
        set({ user, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } else {
      set({ user: null, isAuthenticated: false })
    }
    set({ isLoading: false })
  },
  refreshUser: async () => {
    const state = get()
    if (state.user?.id) {
      const user = await fetchUserFromSupabase(state.user.id)
      if (user) {
        set({ user })
      }
    }
  },
  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state
      return {
        ...state,
        user: {
          ...state.user,
          ...updates,
        },
      }
    })
  },
}))
