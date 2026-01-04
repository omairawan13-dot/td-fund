/**
 * Payment utilities for generating QR codes and payment details
 */

export interface SEPADetails {
  name: string
  iban: string
  bic?: string
}

export interface PaymentInfo {
  amount: number
  memberId: number
  sepaDetails: SEPADetails
}

/**
 * Generate EPC QR code data string for SEPA payments
 */
export function generateEPCQRCodeData(paymentInfo: PaymentInfo): string {
  const { amount, memberId, sepaDetails } = paymentInfo
  
  const reference = `Mitgliedsnummer: ${memberId}`
  
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    sepaDetails.bic || "", // BIC (optional)
    sepaDetails.name,
    sepaDetails.iban,
    `EUR${amount.toFixed(2)}`,
    "", // Purpose (optional)
    reference, // Structured remittance information
    "", // Unstructured remittance information
    "", // Trailer
  ].join("\n")
}

/**
 * Get default SEPA details
 * In production, these should come from environment variables or database
 * Supports both server-side (SEPA_*) and client-side (NEXT_PUBLIC_SEPA_*) env vars
 */
export function getDefaultSEPADetails(): SEPADetails {
  // Check NEXT_PUBLIC_ prefixed vars first (for client-side), then fallback to server-side vars
  return {
    name: process.env.NEXT_PUBLIC_SEPA_NAME || process.env.SEPA_NAME || "Vereinskasse Demo e.V.",
    iban: process.env.NEXT_PUBLIC_SEPA_IBAN || process.env.SEPA_IBAN || "DE89370400440532013000",
    bic: process.env.NEXT_PUBLIC_SEPA_BIC || process.env.SEPA_BIC || undefined,
  }
}

