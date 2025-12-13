export type Role = "USER" | "ADMIN"

export interface User {
  id: string
  email: string
  role: Role
  mitgliedsnummer: number // Changed from string to number
  memberId: number // Changed from string to number
  name: string
  title?: string // "Herr" | "Frau"
  address: string // Kept for backward compatibility
  postalCode?: string // PLZ (Postal Code)
  city?: string // ORT (City)
  phone: string
  avatar?: string
  balance: number
  inactive?: boolean
  status?: "PENDING" | "APPROVED" | "REJECTED"
  createdAt?: string // For filtering new users
}

export interface Transaction {
  id: string
  type: "DEPOSIT" | "CASE_FEE" | "INITIAL_FEE"
  amount: number
  description: string
  date: string
  userId: string
}

export interface NewsPost {
  id: string
  title: string
  content: string
  excerpt: string
  createdAt: string
  updatedAt: string
  isPinned?: boolean
  bannerImageUrl?: string
}

export interface Case {
  id: string
  title: string
  description: string
  createdAt: string
  fee: number
}

export interface Payment {
  id: string
  userId: string
  amount: number
  status: "PENDING" | "CONFIRMED"
  date: string
  reference: string
}

export interface BalanceErrorNotification {
  id: string
  type: "BALANCE_ERROR"
  userId: string
  userName: string
  mitgliedsnummer: number
  balance: number
  createdAt: string
  solved?: boolean
}

export interface ProfileChangeNotification {
  id: string
  type: "PROFILE_CHANGE"
  userId: string
  userName: string
  mitgliedsnummer: number
  changes: Record<string, { old: string; new: string }>
  createdAt: string
  solved?: boolean
}

export type Notification = BalanceErrorNotification | ProfileChangeNotification

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "user3@test.at",
    role: "USER",
    mitgliedsnummer: 1,
    memberId: 1,
    name: "Max Mustermann",
    address: "Musterstraße 123, 12345 Berlin",
    phone: "+49 123 456789",
    balance: -30.0,
  },
  {
    id: "2",
    email: "admin@test.at",
    role: "ADMIN",
    mitgliedsnummer: 2,
    memberId: 2,
    name: "Anna Admin",
    address: "Adminweg 1, 12345 Berlin",
    phone: "+49 987 654321",
    balance: 500.0,
  },
  // Additional users with member IDs from CSV uploads
  { id: "3", email: "user242@example.com", role: "USER", mitgliedsnummer: 242, memberId: 242, name: "NAZIR AHMED SALEEMI", address: "", phone: "", balance: 0 },
  { id: "4", email: "user567@example.com", role: "USER", mitgliedsnummer: 567, memberId: 567, name: "Qaiser Hassan Malik", address: "", phone: "", balance: 0 },
  { id: "5", email: "user558@example.com", role: "USER", mitgliedsnummer: 558, memberId: 558, name: "Kashaf Javed", address: "", phone: "", balance: 0 },
  { id: "6", email: "user605@example.com", role: "USER", mitgliedsnummer: 605, memberId: 605, name: "Syed Amjad Rizvi", address: "", phone: "", balance: 0 },
  { id: "7", email: "user304@example.com", role: "USER", mitgliedsnummer: 304, memberId: 304, name: "Balawal REHMAT", address: "", phone: "", balance: 0 },
  { id: "8", email: "user594@example.com", role: "USER", mitgliedsnummer: 594, memberId: 594, name: "Maqsood Alam", address: "", phone: "", balance: 0 },
  { id: "9", email: "user122@example.com", role: "USER", mitgliedsnummer: 122, memberId: 122, name: "Mohammad-Naeem Amin", address: "", phone: "", balance: 0 },
  { id: "10", email: "user457@example.com", role: "USER", mitgliedsnummer: 457, memberId: 457, name: "Syed Bilal Hussain", address: "", phone: "", balance: 0 },
  { id: "11", email: "user45@example.com", role: "USER", mitgliedsnummer: 45, memberId: 45, name: "Tanveer Shahid", address: "", phone: "", balance: 0 },
  { id: "12", email: "user71@example.com", role: "USER", mitgliedsnummer: 71, memberId: 71, name: "Mahmood Shahid", address: "", phone: "", balance: 0 },
  { id: "13", email: "user86@example.com", role: "USER", mitgliedsnummer: 86, memberId: 86, name: "Tanvir Haider", address: "", phone: "", balance: 0 },
  { id: "14", email: "user149@example.com", role: "USER", mitgliedsnummer: 149, memberId: 149, name: "Muhammad Akram Javid", address: "", phone: "", balance: 0 },
  { id: "15", email: "user560@example.com", role: "USER", mitgliedsnummer: 560, memberId: 560, name: "Ijaz Ahmed", address: "", phone: "", balance: 0 },
  { id: "16", email: "user39@example.com", role: "USER", mitgliedsnummer: 39, memberId: 39, name: "Anwar Muhammad", address: "", phone: "", balance: 0 },
  { id: "17", email: "user557@example.com", role: "USER", mitgliedsnummer: 557, memberId: 557, name: "Arslan Mohammad", address: "", phone: "", balance: 0 },
]

// Helper function to find user by memberId
export const findUserByMemberId = (memberId: number): User | undefined => {
  return mockUsers.find((user) => user.memberId === memberId)
}

// Helper function to find users by multiple memberIds
export const findUsersByMemberIds = (memberIds: number[]): User[] => {
  return mockUsers.filter((user) => memberIds.includes(user.memberId))
}

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "DEPOSIT",
    amount: 100.0,
    description: "Einzahlung",
    date: "2024-01-15",
    userId: "1",
  },
  {
    id: "2",
    type: "CASE_FEE",
    amount: -10.0,
    description: "Case Gebühr - Fall #123",
    date: "2024-01-20",
    userId: "1",
  },
  {
    id: "3",
    type: "DEPOSIT",
    amount: 200.0,
    description: "Einzahlung",
    date: "2024-01-25",
    userId: "1",
  },
  {
    id: "4",
    type: "CASE_FEE",
    amount: -10.0,
    description: "Case Gebühr - Fall #124",
    date: "2024-02-01",
    userId: "1",
  },
]

// Mock news posts
export const mockNews: NewsPost[] = [
  {
    id: "1",
    title: "Willkommen im neuen Portal",
    content:
      "Wir freuen uns, Ihnen unser neues Mitgliederportal vorstellen zu können. Hier können Sie Ihren Kontostand einsehen, Neuigkeiten lesen und vieles mehr.",
    excerpt: "Das neue Mitgliederportal ist online!",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "2",
    title: "Wichtige Änderungen",
    content:
      "Ab sofort werden alle Case-Gebühren automatisch vom Konto abgezogen. Bitte stellen Sie sicher, dass Ihr Konto ausreichend gedeckt ist.",
    excerpt: "Neue Regelung für Case-Gebühren",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
]

// Mock cases
export const mockCases: Case[] = [
  {
    id: "1",
    title: "Fall #123",
    description: "Beschreibung des Falls",
    createdAt: "2024-01-20",
    fee: 10,
  },
  {
    id: "2",
    title: "Fall #124",
    description: "Weiterer Fall",
    createdAt: "2024-02-01",
    fee: 10,
  },
]

// Mock payments
export const mockPayments: Payment[] = [
  {
    id: "1",
    userId: "1",
    amount: 100.0,
    status: "CONFIRMED",
    date: "2024-01-15",
    reference: "REF-001",
  },
  {
    id: "2",
    userId: "2",
    amount: 200.0,
    status: "PENDING",
    date: "2024-02-01",
    reference: "REF-002",
  },
]

// Mock notifications - stored in a way that can be updated
let mockNotifications: Notification[] = [
  {
    id: "1",
    type: "BALANCE_ERROR",
    userId: "1",
    userName: "Max Mustermann",
    mitgliedsnummer: 1,
    balance: -30.0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Function to add a notification
export const addNotification = (notification: Notification) => {
  mockNotifications = [notification, ...mockNotifications]
}

// Function to get all notifications
export const getNotifications = (): Notification[] => {
  return [...mockNotifications]
}

// Function to get notifications by type
export const getNotificationsByType = (type: "BALANCE_ERROR" | "PROFILE_CHANGE"): Notification[] => {
  return mockNotifications.filter((n) => n.type === type)
}

// Function to get unsolved notifications by type
export const getUnsolvedNotificationsByType = (type: "BALANCE_ERROR" | "PROFILE_CHANGE"): Notification[] => {
  return mockNotifications.filter((n) => n.type === type && !n.solved)
}

// Function to mark notification as solved
export const markNotificationAsSolved = (id: string) => {
  mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, solved: true } : n))
}

// Function to add a transaction and update user balance
export const addTransaction = (transaction: Transaction) => {
  mockTransactions.push(transaction)
  // Update user balance
  const user = mockUsers.find((u) => u.id === transaction.userId)
  if (user) {
    user.balance += transaction.amount
  }
}

// Function to add multiple transactions
export const addTransactions = (transactions: Transaction[]) => {
  transactions.forEach((transaction) => {
    addTransaction(transaction)
  })
}

// Pending manual review cases from CSV uploads
export interface PendingManualReview {
  id: string
  date: string
  info: string
  date2?: string
  value?: string
  currency?: string
  timestamp?: string
  extractedMemberIds: number[]
  matchedUsers: User[]
  status: "multiple_ids" | "no_id" | "no_match" | "multiple_matches"
  assignedUserId?: string
  referenceSection: string
  auftraggeber: string
  createdAt: string
  uploadedAt: string
}

// Store pending manual reviews
let pendingManualReviews: PendingManualReview[] = []

// Function to add pending manual reviews
export const addPendingManualReviews = (reviews: PendingManualReview[]) => {
  pendingManualReviews = [...pendingManualReviews, ...reviews]
}

// Function to get all pending manual reviews
export const getPendingManualReviews = (): PendingManualReview[] => {
  return [...pendingManualReviews]
}

// Function to remove a pending manual review (after processing)
export const removePendingManualReview = (id: string) => {
  pendingManualReviews = pendingManualReviews.filter((r) => r.id !== id)
}

// Function to update a pending manual review (e.g., assign user)
export const updatePendingManualReview = (id: string, updates: Partial<PendingManualReview>) => {
  pendingManualReviews = pendingManualReviews.map((r) => (r.id === id ? { ...r, ...updates } : r))
}
