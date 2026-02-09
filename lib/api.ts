import { createClient } from "@/lib/supabase/client"
import { type User, type Case, type Transaction, type PendingManualReview, type NewsPost, type BulkMemberImport, type BulkMemberImportInput } from "@/lib/mock-data"

export async function getUsers(): Promise<User[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("member_id", { ascending: true })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  // Map database fields to User interface if needed
  // Currently they match closely but ensure types align
  return data.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role as "USER" | "ADMIN",
    mitgliedsnummer: user.member_id,
    memberId: user.member_id,
    name: user.name,
    title: user.title || undefined,
    address: user.address || "", // Kept for backward compatibility
    postalCode: user.postal_code || undefined,
    city: user.city || undefined,
    phone: user.phone,
    balance: user.balance,
    avatar: user.image_url || undefined,
    inactive: user.inactive || false,
    status: (user.status || "APPROVED") as "PENDING" | "APPROVED" | "REJECTED",
    createdAt: user.created_at || undefined,
  }))
}

export async function updateUser(id: string, updates: Partial<User>): Promise<boolean> {
  const supabase = createClient()

  // Map User interface fields back to database columns if needed
  const dbUpdates: any = {}

  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.address !== undefined) dbUpdates.address = updates.address
  if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode
  if (updates.city !== undefined) dbUpdates.city = updates.city
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.avatar !== undefined) dbUpdates.image_url = updates.avatar
  if (updates.inactive !== undefined) dbUpdates.inactive = updates.inactive
  if (updates.status !== undefined) dbUpdates.status = updates.status

  // Exclude fields that shouldn't be updated directly via this generic function if any
  delete dbUpdates.id
  delete dbUpdates.mitgliedsnummer
  delete dbUpdates.memberId
  delete dbUpdates.balance

  const { error } = await supabase
    .from("users")
    .update(dbUpdates)
    .eq("id", id)

  if (error) {
    console.error("Error updating user:", error)
    return false
  }

  return true
}

export async function createCase(data: { title: string; description: string; fee: number }): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.rpc('create_case', {
    case_title: data.title,
    case_description: data.description,
    case_fee: data.fee
  })

  if (error) {
    console.error("Error creating case:", error.message, error.details, error.hint, error)
    return false
  }

  return true
}

export async function getCases(): Promise<Case[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching cases:", error)
    return []
  }

  return data.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    fee: c.fee,
    createdAt: c.created_at
  }))
}

export async function getTransactions(userId?: string): Promise<Transaction[]> {
  const supabase = createClient()

  let query = supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching transactions:", error)
    return []
  }

  return data.map((t) => ({
    id: t.id,
    userId: t.user_id,
    type: t.type as "DEPOSIT" | "CASE_FEE" | "INITIAL_FEE",
    amount: parseFloat(t.amount || 0),
    description: t.description || "",
    date: t.created_at || new Date().toISOString(),
    caseId: t.case_id
  }))
}

export async function processDeposit(data: {
  userId: string;
  amount: number;
  description: string;
  date: string;
  csvUploadId?: string;
}): Promise<string | null> {
  const supabase = createClient()

  const { data: result, error } = await supabase.rpc('process_deposit', {
    p_user_id: data.userId,
    p_amount: data.amount,
    p_description: data.description,
    p_date: data.date,
    p_csv_upload_id: data.csvUploadId || null
  })

  if (error) {
    console.error("Error processing deposit:", error.message, error.details, error.hint, error)
    return null
  }

  return result || null
}

// ============================================
// PENDING REVIEWS (Manual CSV Review Cases)
// ============================================

export interface PendingReviewInput {
  date: string
  info: string
  date2?: string
  value?: string
  currency?: string
  timestamp?: string
  extractedMemberIds: number[]
  status: "multiple_ids" | "no_id" | "no_match" | "multiple_matches"
  assignedUserId?: string
  referenceSection: string
  auftraggeber: string
}

export async function getPendingReviews(): Promise<PendingManualReview[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("pending_reviews")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending reviews:", error)
    return []
  }

  return data.map((r) => ({
    id: r.id,
    date: r.date || "",
    info: r.info,
    date2: r.date2,
    value: r.value,
    currency: r.currency,
    timestamp: r.timestamp,
    extractedMemberIds: r.extracted_member_ids || [],
    matchedUsers: [], // Will be populated by the component using getUsers
    status: r.status as PendingManualReview["status"],
    assignedUserId: r.assigned_user_id,
    referenceSection: r.reference_section || "",
    auftraggeber: r.auftraggeber || "",
    createdAt: r.created_at,
    uploadedAt: r.created_at,
  }))
}

export async function getPendingReviewsCount(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("pending_reviews")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error fetching pending reviews count:", error)
    return 0
  }

  return count || 0
}

export async function addPendingReviews(reviews: PendingReviewInput[]): Promise<boolean> {
  const supabase = createClient()

  const dbReviews = reviews.map((r) => ({
    date: r.date,
    info: r.info,
    date2: r.date2,
    value: r.value,
    currency: r.currency,
    timestamp: r.timestamp,
    extracted_member_ids: r.extractedMemberIds,
    status: r.status,
    assigned_user_id: r.assignedUserId || null,
    reference_section: r.referenceSection,
    auftraggeber: r.auftraggeber,
  }))

  const { error } = await supabase
    .from("pending_reviews")
    .insert(dbReviews)

  if (error) {
    console.error("Error adding pending reviews:", error)
    return false
  }

  return true
}

export async function updatePendingReview(id: string, updates: { assignedUserId?: string }): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("pending_reviews")
    .update({ assigned_user_id: updates.assignedUserId || null })
    .eq("id", id)

  if (error) {
    console.error("Error updating pending review:", error)
    return false
  }

  return true
}

export async function deletePendingReview(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("pending_reviews")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting pending review:", error)
    return false
  }

  return true
}

// Save processed review to history before deleting
export async function saveProcessedReviewToHistory(
  review: PendingManualReview,
  transactionId?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("processed_reviews_history")
    .insert({
      original_review_id: review.id,
      date: review.date,
      info: review.info,
      date2: review.date2,
      value: review.value,
      currency: review.currency,
      timestamp: review.timestamp,
      extracted_member_ids: review.extractedMemberIds,
      status: review.status,
      assigned_user_id: review.assignedUserId || null,
      reference_section: review.referenceSection,
      auftraggeber: review.auftraggeber,
      processed_by: user?.id || null,
      transaction_id: transactionId || null,
    })

  if (error) {
    console.error("Error saving to history:", error)
    return false
  }

  return true
}

// Get processed reviews history
export async function getProcessedReviewsHistory(): Promise<any[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("processed_reviews_history")
    .select(`
      *,
      assigned_user:users(id, name, member_id),
      transaction:transactions(id, amount, description, created_at)
    `)
    .order("processed_at", { ascending: false })

  if (error) {
    console.error("Error fetching processed reviews history:", error)
    return []
  }

  // Transform the data to match the expected format
  return (data || []).map((item) => ({
    ...item,
    assigned_user: item.assigned_user || null,
    transaction: item.transaction || null,
  }))
}

// ============================================
// CSV UPLOADS
// ============================================

export interface CSVUploadInput {
  filename?: string;
  totalRows: number;
  autoProcessedCount: number;
  manualReviewCount: number;
}

export async function createCSVUpload(data: CSVUploadInput): Promise<string | null> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from("csv_uploads")
    .insert({
      filename: data.filename || null,
      uploaded_by: user?.id || null,
      total_rows: data.totalRows,
      auto_processed_count: data.autoProcessedCount,
      manual_review_count: data.manualReviewCount,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating CSV upload:", error.message, error.details, error.hint, error)
    return null
  }

  if (!result || !result.id) {
    console.error("No ID returned from CSV upload creation")
    return null
  }

  return result.id
}

export async function getCSVUploads(): Promise<any[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("csv_uploads")
    .select(`
      *,
      transactions:transactions(
        id,
        user_id,
        amount,
        description,
        created_at,
        users!transactions_user_id_fkey(id, name, member_id)
      )
    `)
    .order("uploaded_at", { ascending: false })

  if (error) {
    console.error("Error fetching CSV uploads:", error)
    return []
  }

  return (data || []).map((upload) => ({
    ...upload,
    transactions: (upload.transactions || []).map((t: any) => ({
      ...t,
      user: t.users || null,
    })),
  }))
}

// ============================================
// NEWS POSTS
// ============================================

export async function getNewsPosts(): Promise<NewsPost[]> {
  const supabase = createClient()

  // Order by pinned first, then by created_at descending
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching news posts:", error)
    return []
  }

  return (data || []).map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || "",
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    isPinned: post.is_pinned || false,
    bannerImageUrl: post.banner_image_url || undefined,
  }))
}

export async function createNewsPost(data: {
  title: string;
  content: string;
  excerpt: string;
  isPinned?: boolean;
  bannerImageUrl?: string;
}): Promise<string | null> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from("news_posts")
    .insert({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      is_pinned: data.isPinned || false,
      banner_image_url: data.bannerImageUrl || null,
      created_by: user?.id || null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating news post:", error)
    return null
  }

  return result?.id || null
}

export async function updateNewsPost(id: string, data: {
  title: string;
  content: string;
  excerpt: string;
  isPinned?: boolean;
  bannerImageUrl?: string;
}): Promise<boolean> {
  const supabase = createClient()

  const updateData: any = {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    updated_at: new Date().toISOString(),
  }

  if (data.isPinned !== undefined) {
    updateData.is_pinned = data.isPinned
  }

  if (data.bannerImageUrl !== undefined) {
    updateData.banner_image_url = data.bannerImageUrl
  }

  const { error } = await supabase
    .from("news_posts")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Error updating news post:", error)
    return false
  }

  return true
}

export async function deleteNewsPost(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("news_posts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting news post:", error)
    return false
  }

  return true
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadUserImage(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    console.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.")
    return null
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    console.error("File size exceeds 5MB limit.")
    return null
  }

  // Generate unique filename: userId-timestamp.extension
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}-${timestamp}.${fileExt}`
  const filePath = `users/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false
    })

  if (error) {
    console.error("Error uploading image:", error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return urlData.publicUrl || null
}

export async function deleteUserImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return true // Nothing to delete

  const supabase = createClient()

  // Extract file path from URL
  // URL format: https://[project].supabase.co/storage/v1/object/public/images/users/filename.jpg
  const urlParts = imageUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]
  const filePath = `users/${fileName}`

  const { error } = await supabase.storage
    .from('images')
    .remove([filePath])

  if (error) {
    console.error("Error deleting image:", error)
    return false
  }

  return true
}

export async function uploadNewsBannerImage(newsId: string, file: File): Promise<string | null> {
  const supabase = createClient()

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    console.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.")
    return null
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    console.error("File size exceeds 5MB limit.")
    return null
  }

  // Generate unique filename: newsId-timestamp.extension
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${newsId}-${timestamp}.${fileExt}`
  const filePath = `news/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false
    })

  if (error) {
    console.error("Error uploading news banner image:", error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return urlData.publicUrl || null
}

export async function deleteNewsBannerImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return true // Nothing to delete

  const supabase = createClient()

  // Extract file path from URL
  // URL format: https://[project].supabase.co/storage/v1/object/public/images/news/filename.jpg
  const urlParts = imageUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]
  const filePath = `news/${fileName}`

  const { error } = await supabase.storage
    .from('images')
    .remove([filePath])

  if (error) {
    console.error("Error deleting news banner image:", error)
    return false
  }

  return true
}

// ============================================
// NEGATIVE BALANCE TRACKING
// ============================================

export interface UserWithNegativeDays extends User {
  daysInNegative: number
  daysRemaining: number
  firstNegativeDate: string | null
}

/**
 * Calculate how many days a user has been in negative balance
 * by finding the first transaction that put them in negative
 */
export async function calculateDaysInNegativeBalance(userId: string): Promise<{
  daysInNegative: number
  firstNegativeDate: string | null
}> {
  const supabase = createClient()

  // Get all transactions for this user, ordered by date (oldest first)
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error || !transactions || transactions.length === 0) {
    // Check current balance
    const { data: user } = await supabase
      .from("users")
      .select("balance")
      .eq("id", userId)
      .single()

    if (user && user.balance < 0) {
      // User is negative but no transactions - use created_at as fallback
      const { data: userData } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", userId)
        .single()

      if (userData) {
        const days = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return { daysInNegative: days, firstNegativeDate: userData.created_at }
      }
    }
    return { daysInNegative: 0, firstNegativeDate: null }
  }

  // Calculate running balance to find when user first went negative
  let runningBalance = 0
  let firstNegativeDate: string | null = null

  for (const transaction of transactions) {
    runningBalance += parseFloat(transaction.amount.toString())

    // If balance becomes negative and we haven't found the first negative date yet
    if (runningBalance < 0 && firstNegativeDate === null) {
      firstNegativeDate = transaction.created_at
    }

    // If balance becomes positive again, reset tracking
    if (runningBalance >= 0) {
      firstNegativeDate = null
    }
  }

  // Check current balance from users table
  const { data: user } = await supabase
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single()

  if (!user || user.balance >= 0) {
    return { daysInNegative: 0, firstNegativeDate: null }
  }

  // If user is currently negative, calculate days since first negative date
  if (firstNegativeDate) {
    const days = Math.floor((Date.now() - new Date(firstNegativeDate).getTime()) / (1000 * 60 * 60 * 24))
    return { daysInNegative: days, firstNegativeDate }
  }

  // Fallback: user is negative but we couldn't determine when
  // Use oldest transaction date or user created_at
  const oldestTransaction = transactions[0]
  if (oldestTransaction) {
    const days = Math.floor((Date.now() - new Date(oldestTransaction.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return { daysInNegative: days, firstNegativeDate: oldestTransaction.created_at }
  }

  return { daysInNegative: 0, firstNegativeDate: null }
}

export async function getUsersWithNegativeBalance(): Promise<UserWithNegativeDays[]> {
  const supabase = createClient()

  // Get all users with negative balance
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .lt("balance", 0)
    .order("balance", { ascending: true })

  if (error || !users) {
    console.error("Error fetching users with negative balance:", error)
    return []
  }

  // Calculate days in negative for each user
  const usersWithDays = await Promise.all(
    users.map(async (user) => {
      const { daysInNegative, firstNegativeDate } = await calculateDaysInNegativeBalance(user.id)
      const daysRemaining = Math.max(0, 90 - daysInNegative)

      return {
        id: user.id,
        email: user.email,
        role: (user.role || "USER") as "USER" | "ADMIN",
        mitgliedsnummer: user.member_id || 0,
        memberId: user.member_id || 0,
        name: user.name || "",
        address: user.address || "",
        phone: user.phone || "",
        balance: parseFloat(user.balance || 0),
        avatar: user.image_url || undefined,
        inactive: user.inactive || false,
        daysInNegative,
        daysRemaining,
        firstNegativeDate,
      }
    })
  )

  return usersWithDays
}

export async function getUsersNegative30Days(): Promise<UserWithNegativeDays[]> {
  const allNegative = await getUsersWithNegativeBalance()
  return allNegative.filter((user) => user.daysInNegative >= 30)
}

export async function getUsersSortedByNegativeDays(): Promise<UserWithNegativeDays[]> {
  const allNegative = await getUsersWithNegativeBalance()
  // Sort by days in negative (ascending - closest to 90 days first)
  return allNegative.sort((a, b) => {
    // Users closer to 90 days should appear first
    const aRemaining = a.daysRemaining
    const bRemaining = b.daysRemaining
    return aRemaining - bRemaining
  })
}

export async function markUsersInactiveAfter90Days(): Promise<number> {
  const supabase = createClient()

  const users90Days = await getUsersWithNegativeBalance()
  const usersToMark = users90Days.filter((user) => user.daysInNegative >= 90)

  if (usersToMark.length === 0) {
    return 0
  }

  const userIds = usersToMark.map((u) => u.id)

  const { error } = await supabase
    .from("users")
    .update({ inactive: true })
    .in("id", userIds)

  if (error) {
    console.error("Error marking users as inactive:", error)
    return 0
  }

  return usersToMark.length
}

export async function getInactiveUsers90Days(): Promise<UserWithNegativeDays[]> {
  const allNegative = await getUsersWithNegativeBalance()
  // Filter for users who have been negative for 90+ days but are NOT yet inactive
  return allNegative.filter((user) => !user.inactive && user.daysInNegative >= 90)
}

// ============================================
// EMAIL NOTIFICATION FUNCTIONS
// ============================================

export interface EmailNotification {
  id: string
  user_id: string
  type: "30_DAY_WARNING" | "90_DAY_INACTIVE" | "MANUAL_REMINDER"
  sent_at: string
  email_subject: string | null
  email_body: string | null
  status: "sent" | "failed"
}

/**
 * Send manual reminder email to a user
 * This calls the server-side API route to send emails securely
 */
export async function sendManualReminderEmail(userId: string, customMessage?: string): Promise<boolean> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        type: "MANUAL_REMINDER",
        customMessage,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error sending email:", data.error)
      return false
    }

    return data.success === true
  } catch (error) {
    console.error("Error calling send-email API:", error)
    return false
  }
}

/**
 * Get email history for a user
 */
export async function getEmailHistory(userId: string): Promise<EmailNotification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })

  if (error) {
    console.error("Error fetching email history:", error)
    return []
  }

  return data || []
}

/**
 * Check and send automatic emails (called by cron job)
 * This function identifies users needing emails and sends them
 */
export async function checkAndSendAutomaticEmails(): Promise<{
  sent30Day: number
  sent90Day: number
  errors: string[]
}> {
  const supabase = createClient()
  const errors: string[] = []
  let sent30Day = 0
  let sent90Day = 0

  try {
    // Get users needing emails using the RPC function
    const { data: usersNeedingEmails, error: rpcError } = await supabase.rpc(
      "get_users_needing_balance_emails"
    )

    if (rpcError) {
      console.error("Error fetching users needing emails:", rpcError)
      errors.push(`RPC Error: ${rpcError.message}`)
      return { sent30Day, sent90Day, errors }
    }

    if (!usersNeedingEmails || usersNeedingEmails.length === 0) {
      return { sent30Day, sent90Day, errors }
    }

    // Import email functions
    const { send30DayWarning, send90DayWarning } = await import("@/lib/email")

    // Process each user
    for (const userInfo of usersNeedingEmails) {
      try {
        // Get full user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userInfo.user_id)
          .single()

        if (userError || !userData) {
          errors.push(`Error fetching user ${userInfo.user_id}: ${userError?.message}`)
          continue
        }

        const emailUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          mitgliedsnummer: userData.member_id || 0,
          balance: parseFloat(userData.balance || 0),
          daysInNegative: userInfo.days_in_negative,
        }

        // Send 30-day email if needed
        if (userInfo.needs_30_day_email) {
          const result = await send30DayWarning(emailUser)

          // Record email
          await supabase.from("email_notifications").insert({
            user_id: userInfo.user_id,
            type: "30_DAY_WARNING",
            email_subject: `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`,
            email_body: "",
            status: result.success ? "sent" : "failed",
          })

          // Update timestamp
          if (result.success) {
            await supabase
              .from("users")
              .update({ last_30_day_email_sent: new Date().toISOString() })
              .eq("id", userInfo.user_id)
            sent30Day++
          } else {
            errors.push(`Failed to send 30-day email to ${userData.email}: ${result.error}`)
          }
        }

        // Send 90-day email if needed
        if (userInfo.needs_90_day_email) {
          const result = await send90DayWarning(emailUser)

          // Record email
          await supabase.from("email_notifications").insert({
            user_id: userInfo.user_id,
            type: "90_DAY_INACTIVE",
            email_subject: `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`,
            email_body: "",
            status: result.success ? "sent" : "failed",
          })

          // Update timestamp
          if (result.success) {
            await supabase
              .from("users")
              .update({ last_90_day_email_sent: new Date().toISOString() })
              .eq("id", userInfo.user_id)
            sent90Day++
          } else {
            errors.push(`Failed to send 90-day email to ${userData.email}: ${result.error}`)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Error processing user ${userInfo.user_id}: ${errorMsg}`)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    errors.push(`Fatal error in checkAndSendAutomaticEmails: ${errorMsg}`)
  }

  return { sent30Day, sent90Day, errors }
}

export async function getUsersWithAnyNegativeBalance(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .lt("balance", 0)

  if (error) {
    console.error("Error counting users with negative balance:", error)
    return 0
  }

  return count || 0
}

export async function getPendingUsers(): Promise<User[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending users:", error)
    return []
  }

  return data.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role as "USER" | "ADMIN",
    mitgliedsnummer: user.member_id || 0,
    memberId: user.member_id || 0,
    name: user.name || "",
    title: user.title || undefined,
    address: user.address || "",
    phone: user.phone || "",
    balance: parseFloat(user.balance || 0),
    avatar: user.image_url || undefined,
    inactive: user.inactive || false,
    status: (user.status || "PENDING") as "PENDING" | "APPROVED" | "REJECTED",
  }))
}

export async function approveUser(userId: string): Promise<boolean> {
  const supabase = createClient()

  // Get the highest member_id from the database
  const { data: maxMemberData } = await supabase
    .from("users")
    .select("member_id")
    .not("member_id", "is", null)
    .order("member_id", { ascending: false })
    .limit(1)

  // Calculate next member_id (start with 1 if no users exist)
  const nextMemberId = maxMemberData && maxMemberData.length > 0 && maxMemberData[0]?.member_id
    ? (maxMemberData[0].member_id as number) + 1
    : 1

  // Update user status to APPROVED and assign member_id
  const { error: updateError } = await supabase
    .from("users")
    .update({
      status: "APPROVED",
      member_id: nextMemberId
    })
    .eq("id", userId)

  if (updateError) {
    console.error("Error approving user:", updateError)
    return false
  }

  // Create initial fee transaction (-100) and update balance
  // We do this directly instead of using process_deposit to avoid double-charging
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: 'INITIAL_FEE',
      amount: -100,
      description: 'Anmeldegebühr',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (transactionError) {
    console.error("Error creating initial fee transaction:", transactionError)
    return false
  }

  // Update user balance to -100
  const { error: balanceError } = await supabase
    .from("users")
    .update({ balance: -100 })
    .eq("id", userId)

  if (balanceError) {
    console.error("Error updating user balance:", balanceError)
    return false
  }

  return true
}

export async function rejectUser(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("users")
    .update({ status: "REJECTED" })
    .eq("id", userId)

  if (error) {
    console.error("Error rejecting user:", error)
    return false
  }

  return true
}

// ============================================
// PROFILE CHANGES API
// ============================================

export interface ProfileChange {
  id: string
  user_id: string
  changes: Record<string, { old: string; new: string }>
  status: "PENDING" | "ACCEPTED" | "REVERTED"
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
}

export async function createProfileChange(
  userId: string,
  changes: Record<string, { old: string; new: string }>
): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profile_changes")
    .insert({
      user_id: userId,
      changes: changes,
      status: "PENDING",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile change:", error)
    return null
  }

  return data.id
}

export async function getProfileChanges(status?: "PENDING" | "ACCEPTED" | "REVERTED"): Promise<ProfileChange[]> {
  const supabase = createClient()

  let query = supabase
    .from("profile_changes")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching profile changes:", error)
    return []
  }

  return data.map((pc) => ({
    id: pc.id,
    user_id: pc.user_id,
    changes: pc.changes,
    status: pc.status,
    created_at: pc.created_at,
    reviewed_by: pc.reviewed_by,
    reviewed_at: pc.reviewed_at,
    review_notes: pc.review_notes,
  }))
}

export async function acceptProfileChange(
  id: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get the profile change
  const { data: profileChange, error: fetchError } = await supabase
    .from("profile_changes")
    .select("*")
    .eq("id", id)
    .eq("status", "PENDING")
    .single()

  if (fetchError || !profileChange) {
    console.error("Error fetching profile change:", fetchError)
    return false
  }

  // Apply changes to user - extract new values from changes object
  const updates: any = {}
  for (const [key, value] of Object.entries(profileChange.changes)) {
    const changeData = value as { old: string; new: string }
    updates[key] = changeData.new
  }

  // Map avatar to image_url if present
  if (updates.avatar) {
    updates.image_url = updates.avatar
    delete updates.avatar
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("id", profileChange.user_id)

  if (updateError) {
    console.error("Error applying profile changes:", updateError)
    return false
  }

  // Update profile change status
  const { error: statusError } = await supabase
    .from("profile_changes")
    .update({
      status: "ACCEPTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", id)

  if (statusError) {
    console.error("Error updating profile change status:", statusError)
    return false
  }

  // Create user notification
  const { data: userData } = await supabase
    .from("users")
    .select("name")
    .eq("id", profileChange.user_id)
    .single()

  await createUserNotification(
    profileChange.user_id,
    "PROFILE_CHANGE_ACCEPTED",
    "Profiländerungen akzeptiert",
    `Ihre Profiländerungen wurden von einem Administrator akzeptiert.`,
    id
  )

  return true
}

export async function revertProfileChange(
  id: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get the profile change
  const { data: profileChange, error: fetchError } = await supabase
    .from("profile_changes")
    .select("*")
    .eq("id", id)
    .eq("status", "PENDING")
    .single()

  if (fetchError || !profileChange) {
    console.error("Error fetching profile change:", fetchError)
    return false
  }

  // Revert changes - apply old values
  const revertedChanges: any = {}
  for (const [key, value] of Object.entries(profileChange.changes)) {
    const changeData = value as { old: string; new: string }
    revertedChanges[key] = changeData.old
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(revertedChanges)
    .eq("id", profileChange.user_id)

  if (updateError) {
    console.error("Error reverting profile changes:", updateError)
    return false
  }

  // Update profile change status
  const { error: statusError } = await supabase
    .from("profile_changes")
    .update({
      status: "REVERTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", id)

  if (statusError) {
    console.error("Error updating profile change status:", statusError)
    return false
  }

  // Create user notification
  await createUserNotification(
    profileChange.user_id,
    "PROFILE_CHANGE_REVERTED",
    "Profiländerungen rückgängig gemacht",
    `Ihre Profiländerungen wurden von einem Administrator rückgängig gemacht.`,
    id
  )

  return true
}

// ============================================
// BALANCE ERRORS API
// ============================================

export interface BalanceError {
  id: string
  user_id: string
  reported_balance: number
  description?: string
  status: "OPEN" | "RESOLVED" | "REJECTED"
  created_at: string
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  balance_adjustment?: number
}

export async function createBalanceError(
  userId: string,
  description?: string
): Promise<string | null> {
  const supabase = createClient()

  // Get user's current balance
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single()

  if (userError || !userData) {
    console.error("Error fetching user balance:", userError)
    return null
  }

  const { data, error } = await supabase
    .from("balance_errors")
    .insert({
      user_id: userId,
      reported_balance: userData.balance,
      description: description,
      status: "OPEN",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating balance error:", error)
    return null
  }

  return data.id
}

export async function getBalanceErrors(status?: "OPEN" | "RESOLVED" | "REJECTED"): Promise<BalanceError[]> {
  const supabase = createClient()

  let query = supabase
    .from("balance_errors")
    .select("*")
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching balance errors:", error)
    return []
  }

  return data.map((be) => ({
    id: be.id,
    user_id: be.user_id,
    reported_balance: parseFloat(be.reported_balance || 0),
    description: be.description,
    status: be.status,
    created_at: be.created_at,
    resolved_by: be.resolved_by,
    resolved_at: be.resolved_at,
    resolution_notes: be.resolution_notes,
    balance_adjustment: be.balance_adjustment ? parseFloat(be.balance_adjustment) : undefined,
  }))
}

export async function resolveBalanceError(
  id: string,
  resolvedBy: string,
  balanceAdjustment: number,
  notes?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get the balance error
  const { data: balanceError, error: fetchError } = await supabase
    .from("balance_errors")
    .select("*")
    .eq("id", id)
    .eq("status", "OPEN")
    .single()

  if (fetchError || !balanceError) {
    console.error("Error fetching balance error:", fetchError)
    return false
  }

  // Get current user balance
  const { data: userData, error: userFetchError } = await supabase
    .from("users")
    .select("balance")
    .eq("id", balanceError.user_id)
    .single()

  if (userFetchError || !userData) {
    console.error("Error fetching user balance:", userFetchError)
    return false
  }

  // Update user balance
  const newBalance = parseFloat(userData.balance) + balanceAdjustment
  const { error: updateError } = await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", balanceError.user_id)

  if (updateError) {
    console.error("Error updating user balance:", updateError)
    return false
  }

  // Create transaction for the adjustment
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: balanceError.user_id,
      type: "DEPOSIT",
      amount: balanceAdjustment,
      description: `Balance-Korrektur: ${notes || "Fehler behoben"}`,
      created_at: new Date().toISOString(),
    })

  if (transactionError) {
    console.error("Error creating adjustment transaction:", transactionError)
    return false
  }

  // Update balance error status
  const { error: statusError } = await supabase
    .from("balance_errors")
    .update({
      status: "RESOLVED",
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
      balance_adjustment: balanceAdjustment,
    })
    .eq("id", id)

  if (statusError) {
    console.error("Error updating balance error status:", statusError)
    return false
  }

  // Create user notification
  await createUserNotification(
    balanceError.user_id,
    "BALANCE_ERROR_RESOLVED",
    "Balance-Fehler behoben",
    `Ihr gemeldeter Balance-Fehler wurde behoben. Ihr Kontostand wurde um ${balanceAdjustment.toFixed(2)}€ angepasst.`,
    id
  )

  return true
}

export async function rejectBalanceError(
  id: string,
  resolvedBy: string,
  notes?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get the balance error
  const { data: balanceError, error: fetchError } = await supabase
    .from("balance_errors")
    .select("*")
    .eq("id", id)
    .eq("status", "OPEN")
    .single()

  if (fetchError || !balanceError) {
    console.error("Error fetching balance error:", fetchError)
    return false
  }

  // Update balance error status
  const { error: statusError } = await supabase
    .from("balance_errors")
    .update({
      status: "REJECTED",
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    })
    .eq("id", id)

  if (statusError) {
    console.error("Error updating balance error status:", statusError)
    return false
  }

  // Create user notification
  await createUserNotification(
    balanceError.user_id,
    "BALANCE_ERROR_RESOLVED",
    "Balance-Fehler überprüft",
    `Ihr gemeldeter Balance-Fehler wurde überprüft. ${notes || "Der Kontostand ist korrekt."}`,
    id
  )

  return true
}

// ============================================
// USER NOTIFICATIONS API
// ============================================

export interface UserNotification {
  id: string
  user_id: string
  type: "BALANCE_ERROR_RESOLVED" | "PROFILE_CHANGE_ACCEPTED" | "PROFILE_CHANGE_REVERTED"
  title: string
  message: string
  related_id?: string
  read: boolean
  created_at: string
}

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user notifications:", error)
    return []
  }

  return data.map((n) => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    related_id: n.related_id,
    read: n.read,
    created_at: n.created_at,
  }))
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("user_notifications")
    .update({ read: true })
    .eq("id", id)

  if (error) {
    console.error("Error marking notification as read:", error)
    return false
  }

  return true
}

export async function createUserNotification(
  userId: string,
  type: "BALANCE_ERROR_RESOLVED" | "PROFILE_CHANGE_ACCEPTED" | "PROFILE_CHANGE_REVERTED",
  title: string,
  message: string,
  relatedId?: string
): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: userId,
      type: type,
      title: title,
      message: message,
      related_id: relatedId,
      read: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating user notification:", error)
    return null
  }

  return data.id
}

// ============================================
// CHAT API
// ============================================

export interface ChatThread {
  id: string
  user_id: string
  status: "OPEN" | "CLOSED"
  created_at: string
  updated_at: string
  last_message_at?: string
  user_last_read_at?: string
  admin_last_read_at?: string
  user?: {
    id: string
    name: string
    email: string
    member_id?: number
  }
  last_message_preview?: string
  unread_for_admin: number
  unread_for_user: number
}

export interface ChatMessage {
  id: string
  thread_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: {
    id: string
    name: string
    role: "USER" | "ADMIN"
  }
}

const NO_ROWS_ERROR_CODE = "PGRST116"

async function buildChatThreadsWithMetadata(rawThreads: any[]): Promise<ChatThread[]> {
  if (!rawThreads || rawThreads.length === 0) {
    return []
  }

  const supabase = createClient()

  const userIds = [...new Set(rawThreads.map((thread) => thread.user_id).filter(Boolean))]
  const threadIds = rawThreads.map((thread) => thread.id)

  const usersById = new Map<string, { id: string; name: string; email: string; member_id?: number }>()
  if (userIds.length > 0) {
    const { data: userRows, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, member_id")
      .in("id", userIds)

    if (usersError) {
      console.error("Error loading chat users:", usersError)
    } else {
      for (const user of userRows || []) {
        usersById.set(user.id, {
          id: user.id,
          name: user.name || "Unbekannt",
          email: user.email || "",
          member_id: user.member_id ?? undefined,
        })
      }
    }
  }

  const messagesByThread = new Map<string, any[]>()
  if (threadIds.length > 0) {
    const { data: messageRows, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, thread_id, sender_id, message, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })

    if (messagesError) {
      console.error("Error loading chat messages for thread metadata:", messagesError)
    } else {
      for (const message of messageRows || []) {
        const bucket = messagesByThread.get(message.thread_id) || []
        bucket.push(message)
        messagesByThread.set(message.thread_id, bucket)
      }
    }
  }

  return rawThreads.map((thread) => {
    const threadMessages = messagesByThread.get(thread.id) || []
    const latestMessage = threadMessages[0]

    const adminReadAt = thread.admin_last_read_at ? new Date(thread.admin_last_read_at).getTime() : 0
    const userReadAt = thread.user_last_read_at ? new Date(thread.user_last_read_at).getTime() : 0

    let unreadForAdmin = 0
    let unreadForUser = 0

    for (const message of threadMessages) {
      const messageTs = new Date(message.created_at).getTime()

      if (message.sender_id === thread.user_id && messageTs > adminReadAt) {
        unreadForAdmin += 1
      }

      if (message.sender_id !== thread.user_id && messageTs > userReadAt) {
        unreadForUser += 1
      }
    }

    return {
      id: thread.id,
      user_id: thread.user_id,
      status: thread.status,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      last_message_at: thread.last_message_at || undefined,
      user_last_read_at: thread.user_last_read_at || undefined,
      admin_last_read_at: thread.admin_last_read_at || undefined,
      user: usersById.get(thread.user_id),
      last_message_preview: latestMessage?.message || undefined,
      unread_for_admin: unreadForAdmin,
      unread_for_user: unreadForUser,
    }
  })
}

export async function getOrCreateUserChatThread(userId: string): Promise<ChatThread | null> {
  const supabase = createClient()

  const { data: existingThread, error: existingError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (existingError && existingError.code !== NO_ROWS_ERROR_CODE) {
    console.error("Error fetching user chat thread:", existingError)
    return null
  }

  if (existingThread) {
    const threads = await buildChatThreadsWithMetadata([existingThread])
    return threads[0] || null
  }

  const now = new Date().toISOString()
  const { data: createdThread, error: createError } = await supabase
    .from("chat_threads")
    .insert({
      user_id: userId,
      status: "OPEN",
      created_at: now,
      updated_at: now,
      user_last_read_at: now,
    })
    .select("*")
    .single()

  if (createError || !createdThread) {
    console.error("Error creating user chat thread:", createError)
    return null
  }

  const threads = await buildChatThreadsWithMetadata([createdThread])
  return threads[0] || null
}

export async function getAdminChatThreads(): Promise<ChatThread[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching admin chat threads:", error)
    return []
  }

  return buildChatThreadsWithMetadata(data || [])
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching chat messages:", error)
    return []
  }

  const senderIds = [...new Set((data || []).map((message) => message.sender_id).filter(Boolean))]
  const sendersById = new Map<string, { id: string; name: string; role: "USER" | "ADMIN" }>()

  if (senderIds.length > 0) {
    const { data: senderRows, error: senderError } = await supabase
      .from("users")
      .select("id, name, role")
      .in("id", senderIds)

    if (senderError) {
      console.error("Error fetching chat message senders:", senderError)
    } else {
      for (const sender of senderRows || []) {
        sendersById.set(sender.id, {
          id: sender.id,
          name: sender.name || "Unbekannt",
          role: (sender.role || "USER") as "USER" | "ADMIN",
        })
      }
    }
  }

  return (data || []).map((message) => ({
    id: message.id,
    thread_id: message.thread_id,
    sender_id: message.sender_id,
    message: message.message,
    created_at: message.created_at,
    sender: sendersById.get(message.sender_id),
  }))
}

export async function sendChatMessage(
  threadId: string,
  senderId: string,
  message: string
): Promise<boolean> {
  const supabase = createClient()

  const cleanMessage = message.trim()
  if (!cleanMessage) return false

  const now = new Date().toISOString()

  const { error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      message: cleanMessage,
      created_at: now,
    })

  if (insertError) {
    console.error("Error sending chat message:", insertError)
    return false
  }

  const { error: threadError } = await supabase
    .from("chat_threads")
    .update({
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", threadId)

  if (threadError) {
    console.error("Error updating chat thread after sending message:", threadError)
    return false
  }

  return true
}

export async function markChatAsRead(
  threadId: string,
  role: "USER" | "ADMIN"
): Promise<boolean> {
  const supabase = createClient()

  const now = new Date().toISOString()
  const updates =
    role === "ADMIN"
      ? { admin_last_read_at: now, updated_at: now }
      : { user_last_read_at: now, updated_at: now }

  const { error } = await supabase
    .from("chat_threads")
    .update(updates)
    .eq("id", threadId)

  if (error) {
    console.error("Error marking chat as read:", error)
    return false
  }

  return true
}

// ============================================
// BULK MEMBER IMPORTS API
// ============================================

export async function addBulkMemberImports(imports: BulkMemberImportInput[]): Promise<boolean> {
  const supabase = createClient()

  // Get current user (admin)
  const { data: { user } } = await supabase.auth.getUser()

  const dbImports = imports.map((imp) => ({
    s_number: imp.s_number || null,
    no: imp.no || null,
    name: imp.name,
    address: imp.address || null,
    postal_code: imp.postal_code || null,
    city: imp.city || null,
    mobile_phone: imp.mobile_phone || null,
    email: imp.email || null,
    membership_date: imp.membership_date || null,
    photo_url: imp.photo_url || null,
    status: imp.status || null,
    gender: imp.gender || null,
    created_by: user?.id || null,
  }))

  const { error } = await supabase
    .from("bulk_member_imports")
    .insert(dbImports)

  if (error) {
    console.error("Error adding bulk member imports:", error)
    return false
  }

  return true
}

export async function getBulkMemberImports(): Promise<BulkMemberImport[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("bulk_member_imports")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bulk member imports:", error)
    return []
  }

  return data.map((imp) => ({
    id: imp.id,
    s_number: imp.s_number || undefined,
    no: imp.no || undefined,
    name: imp.name,
    address: imp.address || undefined,
    postal_code: imp.postal_code || undefined,
    city: imp.city || undefined,
    mobile_phone: imp.mobile_phone || undefined,
    email: imp.email || undefined,
    membership_date: imp.membership_date || undefined,
    photo_url: imp.photo_url || undefined,
    status: imp.status || undefined,
    gender: imp.gender || undefined,
    created_at: imp.created_at,
    created_by: imp.created_by || undefined,
  }))
}

export async function updateBulkMemberImport(id: string, updates: Partial<BulkMemberImportInput>): Promise<boolean> {
  const supabase = createClient()

  const dbUpdates: any = {}
  if (updates.s_number !== undefined) dbUpdates.s_number = updates.s_number || null
  if (updates.no !== undefined) dbUpdates.no = updates.no || null
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.address !== undefined) dbUpdates.address = updates.address || null
  if (updates.postal_code !== undefined) dbUpdates.postal_code = updates.postal_code || null
  if (updates.city !== undefined) dbUpdates.city = updates.city || null
  if (updates.mobile_phone !== undefined) dbUpdates.mobile_phone = updates.mobile_phone || null
  if (updates.email !== undefined) dbUpdates.email = updates.email || null
  if (updates.membership_date !== undefined) dbUpdates.membership_date = updates.membership_date || null
  if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url || null
  if (updates.status !== undefined) dbUpdates.status = updates.status || null
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender || null

  const { error } = await supabase
    .from("bulk_member_imports")
    .update(dbUpdates)
    .eq("id", id)

  if (error) {
    console.error("Error updating bulk member import:", error)
    return false
  }

  return true
}

export async function deleteBulkMemberImport(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("bulk_member_imports")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting bulk member import:", error)
    return false
  }

  return true
}

export async function createAccountFromImport(
  importId: string,
  password: string,
  title: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const response = await fetch("/api/admin/create-account-from-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ importId, password, title }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error calling createAccountFromImport API:", error)
    return { success: false, error: "Failed to create account" }
  }
}
