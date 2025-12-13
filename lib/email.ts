import { Resend } from "resend"
import QRCode from "qrcode"
import { generateEPCQRCodeData, getDefaultSEPADetails, type PaymentInfo } from "@/lib/payment-utils"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@td-fund.com"

export interface EmailUser {
  id: string
  email: string
  name: string
  mitgliedsnummer: number
  balance: number
  daysInNegative?: number
}

/**
 * Generate QR code and upload to Supabase Storage, return public URL
 */
async function generateAndUploadQRCode(paymentInfo: PaymentInfo, userId: string): Promise<string> {
  try {
    const qrData = generateEPCQRCodeData(paymentInfo)
    
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    
    // Upload to Supabase Storage using service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return ""
    }
    
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    const fileName = `qr-codes/${userId}-${Date.now()}.png`
    
    // Convert buffer to Blob (Supabase expects Blob or File)
    const blob = new Blob([qrCodeBuffer as BlobPart], { type: "image/png" })
    
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, blob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      })
    
    if (error) {
      // Fallback: return empty string, email will still work without QR code
      return ""
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName)
    
    return publicUrlData.publicUrl
  } catch (error) {
    return ""
  }
}

/**
 * Generic email sender
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    })

    if (error) {
      console.error("Error sending email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error("Exception sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * 30-day negative balance warning email
 */
export async function get30DayWarningEmail(user: EmailUser): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`
  
  const amountToPay = Math.abs(user.balance)
  const sepaDetails = getDefaultSEPADetails()
  const paymentInfo: PaymentInfo = {
    amount: amountToPay,
    memberId: user.mitgliedsnummer,
    sepaDetails,
  }
  
  const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id)
  const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : ""
  
  const html = `
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
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${amountToPay.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empfänger:</strong> ${sepaDetails.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${sepaDetails.iban}</span></p>
              ${sepaDetails.bic ? `<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${sepaDetails.bic}</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${user.mitgliedsnummer}</p>
            </div>
            
            ${qrCodeHtml ? `
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${qrCodeHtml}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            ` : ''}
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
  
  const text = `
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

Bitte kontaktieren Sie uns, wenn Sie Fragen haben oder Hilfe benötigen.

Mit freundlichen Grüßen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `
  
  return { subject, html, text }
}

/**
 * 90-day negative balance warning email (final warning before inactive)
 */
export async function get90DayWarningEmail(user: EmailUser): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`
  
  const amountToPay = Math.abs(user.balance)
  const sepaDetails = getDefaultSEPADetails()
  const paymentInfo: PaymentInfo = {
    amount: amountToPay,
    memberId: user.mitgliedsnummer,
    sepaDetails,
  }
  
  const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id)
  const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : ""
  
  const html = `
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
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${amountToPay.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empfänger:</strong> ${sepaDetails.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${sepaDetails.iban}</span></p>
              ${sepaDetails.bic ? `<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${sepaDetails.bic}</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${user.mitgliedsnummer}</p>
            </div>
            
            ${qrCodeHtml ? `
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${qrCodeHtml}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            ` : ''}
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
  
  const text = `
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
Betrag: ${amountToPay.toFixed(2)} €
Empfänger: ${sepaDetails.name}
IBAN: ${sepaDetails.iban}
${sepaDetails.bic ? `BIC: ${sepaDetails.bic}\n` : ''}Verwendungszweck: Mitgliedsnummer: ${user.mitgliedsnummer}

Bitte kontaktieren Sie uns SOFORT, wenn Sie Fragen haben oder Hilfe benötigen.

Mit freundlichen Grüßen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `
  
  return { subject, html, text }
}

/**
 * Manual reminder email (from admin)
 */
export async function getManualReminderEmail(user: EmailUser, customMessage?: string): Promise<{ subject: string; html: string; text: string }> {
  const subject = `Erinnerung: Negativer Kontostand - TD Fund`
  
  const amountToPay = Math.abs(user.balance)
  const sepaDetails = getDefaultSEPADetails()
  const paymentInfo: PaymentInfo = {
    amount: amountToPay,
    memberId: user.mitgliedsnummer,
    sepaDetails,
  }
  
  const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id)
  const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : ""
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .balance { font-size: 24px; font-weight: bold; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TD Fund - Erinnerung</h1>
        </div>
        <div class="content">
          <p>Sehr geehrte/r ${user.name},</p>
          
          <div class="info">
            <h2>Erinnerung: Negativer Kontostand</h2>
            <p class="balance">Aktueller Kontostand: ${user.balance.toFixed(2)} €</p>
            ${user.daysInNegative ? `<p>Ihr Kontostand ist seit <strong>${user.daysInNegative} Tagen</strong> negativ.</p>` : ''}
          </div>
          
          ${customMessage ? `<p><strong>Zusätzliche Nachricht:</strong></p><p>${customMessage}</p>` : ''}
          
          <p>Bitte überweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten.</p>
          
          <p><strong>Mitgliedsnummer:</strong> ${user.mitgliedsnummer}</p>
          
          <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Zahlungsdetails</h3>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${amountToPay.toFixed(2)} €</span></p>
              <p style="margin: 5px 0;"><strong>Empfänger:</strong> ${sepaDetails.name}</p>
              <p style="margin: 5px 0;"><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${sepaDetails.iban}</span></p>
              ${sepaDetails.bic ? `<p style="margin: 5px 0;"><strong>BIC:</strong> <span style="font-family: monospace;">${sepaDetails.bic}</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Verwendungszweck:</strong> Mitgliedsnummer: ${user.mitgliedsnummer}</p>
            </div>
            
            ${qrCodeHtml ? `
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-weight: 600; margin-bottom: 10px;">QR-Code zum Bezahlen:</p>
              ${qrCodeHtml}
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scannen Sie diesen Code mit Ihrer Banking-App</p>
            </div>
            ` : ''}
          </div>
          
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          
          <p>Mit freundlichen Grüßen,<br>TD Fund Team</p>
        </div>
        <div class="footer">
          <p>Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
TD Fund - Erinnerung

Sehr geehrte/r ${user.name},

ERINNERUNG: NEGATIVER KONTOSTAND

Aktueller Kontostand: ${user.balance.toFixed(2)} €
${user.daysInNegative ? `Ihr Kontostand ist seit ${user.daysInNegative} Tagen negativ.` : ''}

${customMessage ? `\nZusätzliche Nachricht:\n${customMessage}\n` : ''}

Bitte überweisen Sie den ausstehenden Betrag, um Ihre Mitgliedschaft aktiv zu halten.

Mitgliedsnummer: ${user.mitgliedsnummer}

ZAHLUNGSDETAILS:
Betrag: ${amountToPay.toFixed(2)} €
Empfänger: ${sepaDetails.name}
IBAN: ${sepaDetails.iban}
${sepaDetails.bic ? `BIC: ${sepaDetails.bic}\n` : ''}Verwendungszweck: Mitgliedsnummer: ${user.mitgliedsnummer}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
TD Fund Team

---
Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht direkt auf diese E-Mail.
  `
  
  return { subject, html, text }
}

/**
 * Send 30-day warning email
 */
export async function send30DayWarning(user: EmailUser): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const email = await get30DayWarningEmail(user)
  return sendEmail(user.email, email.subject, email.html, email.text)
}

/**
 * Send 90-day warning email
 */
export async function send90DayWarning(user: EmailUser): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const email = await get90DayWarningEmail(user)
  return sendEmail(user.email, email.subject, email.html, email.text)
}

/**
 * Send manual reminder email
 */
export async function sendManualReminder(
  user: EmailUser,
  customMessage?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const email = await getManualReminderEmail(user, customMessage)
  return sendEmail(user.email, email.subject, email.html, email.text)
}

