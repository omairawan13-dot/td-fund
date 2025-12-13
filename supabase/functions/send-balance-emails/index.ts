// Supabase Edge Function to send balance reminder emails
// This function is called by the cron job or can be called manually

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "noreply@td-fund.com"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// SEPA Payment Details (can be moved to env vars)
const SEPA_NAME = Deno.env.get("SEPA_NAME") || "Vereinskasse Demo e.V."
const SEPA_IBAN = Deno.env.get("SEPA_IBAN") || "DE89370400440532013000"
const SEPA_BIC = Deno.env.get("SEPA_BIC") || undefined

interface EmailUser {
  id: string
  email: string
  name: string
  mitgliedsnummer: number
  balance: number
  daysInNegative: number
}

serve(async (req) => {
  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get users needing emails using the RPC function
    const { data: usersNeedingEmails, error: rpcError } = await supabase.rpc(
      "get_users_needing_balance_emails"
    )

    if (rpcError) {
      console.error("Error fetching users needing emails:", rpcError)
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!usersNeedingEmails || usersNeedingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users need emails at this time", sent30Day: 0, sent90Day: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const errors: string[] = []
    let sent30Day = 0
    let sent90Day = 0

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

        const emailUser: EmailUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          mitgliedsnummer: userData.member_id || 0,
          balance: parseFloat(userData.balance || 0),
          daysInNegative: userInfo.days_in_negative,
        }

        // Send 30-day email if needed
        if (userInfo.needs_30_day_email) {
          const emailResult = await send30DayEmail(emailUser, RESEND_API_KEY, EMAIL_FROM)
          
          // Record email
          await supabase.from("email_notifications").insert({
            user_id: userInfo.user_id,
            type: "30_DAY_WARNING",
            email_subject: `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`,
            email_body: "",
            status: emailResult.success ? "sent" : "failed",
          })

          // Update timestamp
          if (emailResult.success) {
            await supabase
              .from("users")
              .update({ last_30_day_email_sent: new Date().toISOString() })
              .eq("id", userInfo.user_id)
            sent30Day++
          } else {
            errors.push(`Failed to send 30-day email to ${userData.email}: ${emailResult.error}`)
          }
        }

        // Send 90-day email if needed
        if (userInfo.needs_90_day_email) {
          const emailResult = await send90DayEmail(emailUser, RESEND_API_KEY, EMAIL_FROM)
          
          // Record email
          await supabase.from("email_notifications").insert({
            user_id: userInfo.user_id,
            type: "90_DAY_INACTIVE",
            email_subject: `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`,
            email_body: "",
            status: emailResult.success ? "sent" : "failed",
          })

          // Update timestamp
          if (emailResult.success) {
            await supabase
              .from("users")
              .update({ last_90_day_email_sent: new Date().toISOString() })
              .eq("id", userInfo.user_id)
            sent90Day++
          } else {
            errors.push(`Failed to send 90-day email to ${userData.email}: ${emailResult.error}`)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Error processing user ${userInfo.user_id}: ${errorMsg}`)
      }
    }

    return new Response(
      JSON.stringify({
        message: "Email check completed",
        sent30Day,
        sent90Day,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Fatal error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

async function send30DayEmail(
  user: EmailUser,
  apiKey: string,
  from: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`
  const html = get30DayEmailHtml(user)
  const text = get30DayEmailText(user)

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to send email" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function send90DayEmail(
  user: EmailUser,
  apiKey: string,
  from: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`
  const html = get90DayEmailHtml(user)
  const text = get90DayEmailText(user)

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to send email" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

function get30DayEmailHtml(user: EmailUser): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Wichtige Mitteilung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${user.name},</p>
          
          <div class="warning">
            <h2>⚠️ Warnung: Negativer Kontostand</h2>
            <p>Ihr Kontostand ist seit <strong>30 Tagen</strong> negativ.</p>
            <p class="balance">Aktueller Kontostand: ${user.balance.toFixed(2)} €</p>
          </div>
          
          <p>Wir möchten Sie darauf hinweisen, dass:</p>
          <ul>
            <li>Ihr Kontostand seit <strong>30 Tagen</strong> negativ ist</li>
            <li>Wenn Ihr Kontostand weiterhin negativ bleibt, werden Sie nach <strong>90 Tagen</strong> automatisch als inaktiv markiert</li>
            <li>Bitte überweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten</li>
          </ul>
          
          <p><strong>Mitgliedsnummer:</strong> ${user.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${Math.abs(user.balance).toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empfänger:</strong> ${SEPA_NAME}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${SEPA_IBAN}</span></p>
              ${SEPA_BIC ? `<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${SEPA_BIC}</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${user.mitgliedsnummer}</p>
            </div>
          </div>
          
          <p>Bitte kontaktieren Sie uns, wenn Sie Fragen haben oder Hilfe benötigen.</p>
          
          <p>Mit freundlichen Grüßen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function get30DayEmailText(user: EmailUser): string {
  return `
TD Fund - Wichtige Mitteilung

Sehr geehrte/r ${user.name},

⚠️ WARNUNG: NEGATIVER KONTOSTAND

Ihr Kontostand ist seit 30 Tagen negativ.

Aktueller Kontostand: ${user.balance.toFixed(2)} €

Wir möchten Sie darauf hinweisen, dass:
- Ihr Kontostand seit 30 Tagen negativ ist
- Wenn Ihr Kontostand weiterhin negativ bleibt, werden Sie nach 90 Tagen automatisch als inaktiv markiert
- Bitte überweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten

Mitgliedsnummer: ${user.mitgliedsnummer}

ZAHLUNGSDETAILS:
Betrag: ${Math.abs(user.balance).toFixed(2)} €
Empfänger: ${SEPA_NAME}
IBAN: ${SEPA_IBAN}
${SEPA_BIC ? `BIC: ${SEPA_BIC}\n` : ''}Verwendungszweck: Mitgliedsnummer: ${user.mitgliedsnummer}

Bitte kontaktieren Sie uns, wenn Sie Fragen haben oder Hilfe benötigen.

Mit freundlichen Grüßen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `
}

function get90DayEmailHtml(user: EmailUser): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .urgent { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Dringende Mitteilung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${user.name},</p>
          
          <div class="urgent">
            <h2>🚨 Dringend: Letzte Warnung</h2>
            <p>Ihr Kontostand ist seit <strong>90 Tagen</strong> negativ.</p>
            <p class="balance">Aktueller Kontostand: ${user.balance.toFixed(2)} €</p>
          </div>
          
          <p><strong>Dies ist Ihre letzte Warnung!</strong></p>
          
          <p>Wenn Sie nicht innerhalb kurzer Zeit den ausstehenden Betrag überweisen, werden Sie automatisch als <strong>inaktiv</strong> markiert.</p>
          
          <p>Als inaktives Mitglied verlieren Sie Zugang zu allen Mitgliedervorteilen und Services.</p>
          
          <p><strong>Mitgliedsnummer:</strong> ${user.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${Math.abs(user.balance).toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empfänger:</strong> ${SEPA_NAME}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${SEPA_IBAN}</span></p>
              ${SEPA_BIC ? `<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${SEPA_BIC}</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${user.mitgliedsnummer}</p>
            </div>
          </div>
          
          <p>Bitte kontaktieren Sie uns <strong>sofort</strong>, wenn Sie Fragen haben oder Hilfe benötigen.</p>
          
          <p>Mit freundlichen Grüßen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function get90DayEmailText(user: EmailUser): string {
  return `
TD Fund - Dringende Mitteilung

Sehr geehrte/r ${user.name},

🚨 DRINGEND: LETZTE WARNUNG

Ihr Kontostand ist seit 90 Tagen negativ.

Aktueller Kontostand: ${user.balance.toFixed(2)} €

DIES IST IHRE LETZTE WARNUNG!

Wenn Sie nicht innerhalb kurzer Zeit den ausstehenden Betrag überweisen, werden Sie automatisch als INAKTIV markiert.

Als inaktives Mitglied verlieren Sie Zugang zu allen Mitgliedervorteilen und Services.

Mitgliedsnummer: ${user.mitgliedsnummer}

ZAHLUNGSDETAILS:
Betrag: ${Math.abs(user.balance).toFixed(2)} €
Empfänger: ${SEPA_NAME}
IBAN: ${SEPA_IBAN}
${SEPA_BIC ? `BIC: ${SEPA_BIC}\n` : ''}Verwendungszweck: Mitgliedsnummer: ${user.mitgliedsnummer}

Bitte kontaktieren Sie uns SOFORT, wenn Sie Fragen haben oder Hilfe benötigen.

Mit freundlichen Grüßen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `
}

