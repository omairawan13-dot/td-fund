import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendManualReminder, send30DayWarning, send90DayWarning } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, customMessage } = body

    if (!userId || !type) {
      return NextResponse.json(
        { error: "Missing userId or type" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Calculate days in negative balance
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    let daysInNegative = 0
    if (transactions && transactions.length > 0) {
      let runningBalance = 0
      let firstNegativeDate: string | null = null

      for (const transaction of transactions) {
        runningBalance += parseFloat(transaction.amount.toString())
        
        if (runningBalance < 0 && firstNegativeDate === null) {
          firstNegativeDate = transaction.created_at
        }
        
        if (runningBalance >= 0) {
          firstNegativeDate = null
        }
      }

      if (userData.balance < 0 && firstNegativeDate) {
        daysInNegative = Math.floor(
          (Date.now() - new Date(firstNegativeDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }

    const emailUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.email,
      mitgliedsnummer: userData.member_id || 0,
      balance: parseFloat(userData.balance || 0),
      daysInNegative,
    }

    let result
    let emailSubject = ""
    let emailType: "30_DAY_WARNING" | "90_DAY_INACTIVE" | "MANUAL_REMINDER" = "MANUAL_REMINDER"

    // Send appropriate email based on type
    if (type === "MANUAL_REMINDER") {
      result = await sendManualReminder(emailUser, customMessage)
      emailSubject = `Erinnerung: Negativer Kontostand - TD Fund`
    } else if (type === "30_DAY_WARNING") {
      result = await send30DayWarning(emailUser)
      emailSubject = `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`
      emailType = "30_DAY_WARNING"
    } else if (type === "90_DAY_INACTIVE") {
      result = await send90DayWarning(emailUser)
      emailSubject = `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`
      emailType = "90_DAY_INACTIVE"
    } else {
      return NextResponse.json(
        { error: "Invalid email type" },
        { status: 400 }
      )
    }

    // Record email in database
    await supabase.from("email_notifications").insert({
      user_id: userId,
      type: emailType,
      email_subject: emailSubject,
      email_body: customMessage || "",
      status: result.success ? "sent" : "failed",
    })

    // Update last email sent timestamp
    if (result.success) {
      const updateField =
        type === "MANUAL_REMINDER"
          ? "last_manual_email_sent"
          : type === "30_DAY_WARNING"
          ? "last_30_day_email_sent"
          : "last_90_day_email_sent"

      await supabase
        .from("users")
        .update({ [updateField]: new Date().toISOString() })
        .eq("id", userId)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Error in send-email API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

