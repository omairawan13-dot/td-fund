(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/repos/tdfund final/td-fund/lib/payment-utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Payment utilities for generating QR codes and payment details
 */ __turbopack_context__.s([
    "generateEPCQRCodeData",
    ()=>generateEPCQRCodeData,
    "getDefaultSEPADetails",
    ()=>getDefaultSEPADetails
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/repos/tdfund final/td-fund/node_modules/.pnpm/next@16.1.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function generateEPCQRCodeData(paymentInfo) {
    const { amount, memberId, sepaDetails } = paymentInfo;
    const reference = `Mitgliedsnummer: ${memberId}`;
    return [
        "BCD",
        "002",
        "1",
        "SCT",
        sepaDetails.bic || "",
        sepaDetails.name,
        sepaDetails.iban,
        `EUR${amount.toFixed(2)}`,
        "",
        reference,
        "",
        ""
    ].join("\n");
}
function getDefaultSEPADetails() {
    // Check NEXT_PUBLIC_ prefixed vars first (for client-side), then fallback to server-side vars
    return {
        name: ("TURBOPACK compile-time value", "Marko Cvejic") || __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.SEPA_NAME || "Vereinskasse Demo e.V.",
        iban: ("TURBOPACK compile-time value", "AT271200010025672337") || __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.SEPA_IBAN || "DE89370400440532013000",
        bic: ("TURBOPACK compile-time value", "BKAUATWWXXX") || __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.SEPA_BIC || undefined
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/repos/tdfund final/td-fund/lib/email.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "get30DayWarningEmail",
    ()=>get30DayWarningEmail,
    "get90DayWarningEmail",
    ()=>get90DayWarningEmail,
    "getManualReminderEmail",
    ()=>getManualReminderEmail,
    "send30DayWarning",
    ()=>send30DayWarning,
    "send90DayWarning",
    ()=>send90DayWarning,
    "sendEmail",
    ()=>sendEmail,
    "sendManualReminder",
    ()=>sendManualReminder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/repos/tdfund final/td-fund/node_modules/.pnpm/next@16.1.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$resend$40$6$2e$6$2e$0_$40$react$2d$email$2b$render$40$1$2e$1$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3_$2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repos/tdfund final/td-fund/node_modules/.pnpm/resend@6.6.0_@react-email+render@1.1.2_react-dom@19.2.3_react@19.2.3__react@19.2.3_/node_modules/resend/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repos/tdfund final/td-fund/node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$lib$2f$payment$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/repos/tdfund final/td-fund/lib/payment-utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$89$2e$0$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/repos/tdfund final/td-fund/node_modules/.pnpm/@supabase+supabase-js@2.89.0/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
;
;
;
// Lazy-initialize Resend client to avoid build-time errors
let resend = null;
function getResendClient() {
    if (!resend) {
        const apiKey = __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error("RESEND_API_KEY is not set");
        }
        resend = new __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$resend$40$6$2e$6$2e$0_$40$react$2d$email$2b$render$40$1$2e$1$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3_$2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Resend"](apiKey);
    }
    return resend;
}
const EMAIL_FROM = __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.EMAIL_FROM || "noreply@td-fund.com";
/**
 * Generate QR code and upload to Supabase Storage, return public URL
 */ async function generateAndUploadQRCode(paymentInfo, userId) {
    try {
        const qrData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$lib$2f$payment$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateEPCQRCodeData"])(paymentInfo);
        // Generate QR code as buffer
        const qrCodeBuffer = await __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].toBuffer(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF"
            }
        });
        // Upload to Supabase Storage using service role for admin access
        const supabaseUrl = ("TURBOPACK compile-time value", "https://zotifjywwbpglvslnkfq.supabase.co");
        const supabaseServiceKey = __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            return "";
        }
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$89$2e$0$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        const fileName = `qr-codes/${userId}-${Date.now()}.png`;
        // Convert buffer to Blob (Supabase expects Blob or File)
        const blob = new Blob([
            qrCodeBuffer
        ], {
            type: "image/png"
        });
        const { data, error } = await supabase.storage.from("images").upload(fileName, blob, {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: false
        });
        if (error) {
            // Fallback: return empty string, email will still work without QR code
            return "";
        }
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    } catch (error) {
        return "";
    }
}
async function sendEmail(to, subject, htmlBody, textBody) {
    try {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set");
            return {
                success: false,
                error: "Email service not configured"
            };
        }
        const resendClient = getResendClient();
        const { data, error } = await resendClient.emails.send({
            from: EMAIL_FROM,
            to,
            subject,
            html: htmlBody,
            text: textBody || htmlBody.replace(/<[^>]*>/g, "")
        });
        if (error) {
            console.error("Error sending email:", error);
            return {
                success: false,
                error: error.message
            };
        }
        return {
            success: true,
            messageId: data?.id
        };
    } catch (error) {
        console.error("Exception sending email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
async function get30DayWarningEmail(user) {
    const subject = `Warnung: Negativer Kontostand seit 30 Tagen - TD Fund`;
    const amountToPay = Math.abs(user.balance);
    const sepaDetails = (0, __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$lib$2f$payment$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSEPADetails"])();
    const paymentInfo = {
        amount: amountToPay,
        memberId: user.mitgliedsnummer,
        sepaDetails
    };
    const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id);
    const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : "";
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
  `;
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
  `;
    return {
        subject,
        html,
        text
    };
}
async function get90DayWarningEmail(user) {
    const subject = `Dringend: Negativer Kontostand seit 90 Tagen - TD Fund`;
    const amountToPay = Math.abs(user.balance);
    const sepaDetails = (0, __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$lib$2f$payment$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSEPADetails"])();
    const paymentInfo = {
        amount: amountToPay,
        memberId: user.mitgliedsnummer,
        sepaDetails
    };
    const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id);
    const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : "";
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
  `;
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
  `;
    return {
        subject,
        html,
        text
    };
}
async function getManualReminderEmail(user, customMessage) {
    const subject = `Erinnerung: Negativer Kontostand - TD Fund`;
    const amountToPay = Math.abs(user.balance);
    const sepaDetails = (0, __TURBOPACK__imported__module__$5b$project$5d2f$repos$2f$tdfund__final$2f$td$2d$fund$2f$lib$2f$payment$2d$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDefaultSEPADetails"])();
    const paymentInfo = {
        amount: amountToPay,
        memberId: user.mitgliedsnummer,
        sepaDetails
    };
    const qrCodeUrl = await generateAndUploadQRCode(paymentInfo, user.id);
    const qrCodeHtml = qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code für Zahlung" style="max-width: 300px; height: auto; display: block; margin: 20px auto;" />` : "";
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
  `;
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
  `;
    return {
        subject,
        html,
        text
    };
}
async function send30DayWarning(user) {
    const email = await get30DayWarningEmail(user);
    return sendEmail(user.email, email.subject, email.html, email.text);
}
async function send90DayWarning(user) {
    const email = await get90DayWarningEmail(user);
    return sendEmail(user.email, email.subject, email.html, email.text);
}
async function sendManualReminder(user, customMessage) {
    const email = await getManualReminderEmail(user, customMessage);
    return sendEmail(user.email, email.subject, email.html, email.text);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=repos_tdfund%20final_td-fund_lib_198ed36c._.js.map