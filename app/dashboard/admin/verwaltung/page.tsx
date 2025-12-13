"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Upload, CheckCircle2, AlertTriangle, Search, ChevronDown, Loader2, ChevronRight, SkipForward, History } from "lucide-react"
import { 
  type User, 
  type PendingManualReview
} from "@/lib/mock-data"
import { 
  getUsers, 
  processDeposit, 
  getPendingReviews, 
  addPendingReviews, 
  updatePendingReview, 
  deletePendingReview,
  saveProcessedReviewToHistory,
  getProcessedReviewsHistory,
  createCSVUpload,
  getCSVUploads,
  type PendingReviewInput 
} from "@/lib/api"

interface CSVRow {
  date: string
  info: string
  date2?: string
  value?: string
  currency?: string
  timestamp?: string
}

interface ProcessedRow {
  date: string
  info: string
  extractedMemberIds: number[]
  matchedUsers: User[]
  status: "perfect" | "multiple_ids" | "no_id" | "no_match" | "multiple_matches"
  assignedUserId?: string
  referenceSection: string
  auftraggeber: string
  date2?: string
  value?: string
  currency?: string
  timestamp?: string
}

export default function VerwaltungPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [openSearchIndex, setOpenSearchIndex] = useState<number | null>(null)
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({})
  const searchRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [pendingCases, setPendingCases] = useState<PendingManualReview[]>([])
  const [currentPendingIndex, setCurrentPendingIndex] = useState(0)
  const [pendingSearchQuery, setPendingSearchQuery] = useState("")
  const [isPendingSearchOpen, setIsPendingSearchOpen] = useState(false)
  const pendingSearchRef = useRef<HTMLDivElement | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isProcessingPending, setIsProcessingPending] = useState(false)
  const [viewMode, setViewMode] = useState<"pending" | "history">("pending")
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [csvUploads, setCsvUploads] = useState<any[]>([])
  const [currentCsvUploadId, setCurrentCsvUploadId] = useState<string | null>(null)

  // Load users and pending cases on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUsers(true)
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
      const pendingData = await getPendingReviews()
      setPendingCases(pendingData)
      setIsLoadingUsers(false)
    }
    fetchData()
  }, [])

  // Load history when switching to history view
  useEffect(() => {
    if (viewMode === "history") {
      const loadHistory = async () => {
        setIsLoadingHistory(true)
        const [history, uploads] = await Promise.all([
          getProcessedReviewsHistory(),
          getCSVUploads()
        ])
        setHistoryItems(history)
        setCsvUploads(uploads)
        setIsLoadingHistory(false)
      }
      loadHistory()
    }
  }, [viewMode])

  // Helper to find users
  const findUsersByMemberIds = (memberIds: number[]): User[] => {
    return users.filter((user) => memberIds.includes(user.memberId))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openSearchIndex !== null) {
        const ref = searchRefs.current[openSearchIndex]
        if (ref && !ref.contains(event.target as Node)) {
          setOpenSearchIndex(null)
        }
      }
      if (isPendingSearchOpen && pendingSearchRef.current && !pendingSearchRef.current.contains(event.target as Node)) {
        setIsPendingSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openSearchIndex, isPendingSearchOpen])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse the INFO field to extract member IDs and details
  const parseInfoField = (info: string): { ids: number[]; referenceSection: string; auftraggeber: string } => {
    // Extract Auftraggeber (payer name)
    const auftraggeberMatch = info.match(/Auftraggeber:\s*([^,\n]+(?:,\s*[^,\n]+)?)/i)
    const auftraggeber = auftraggeberMatch ? auftraggeberMatch[1].trim() : "Nicht gefunden"

    // Extract the section between Verwendungszweck/Zahlungsreferenz and IBAN
    const referenceMatch = info.match(/(?:Verwendungszweck|Zahlungsreferenz):\s*(.+?)(?=\s*IBAN)/is)
    const referenceSection = referenceMatch ? referenceMatch[1].trim() : "Nicht gefunden"

    // Search for member IDs only in the reference section (between Verwendungszweck/Zahlungsreferenz and IBAN)
    const ids: number[] = []

    if (referenceSection && referenceSection !== "Nicht gefunden") {
      // The section to search is ONLY between Verwendungszweck/Zahlungsreferenz and IBAN
      const searchSection = referenceSection

      // First, check for explicit patterns like "Nr.86", "NR- 242", "NR:123"
      const nrPattern = /(?:Nr\.|NR[-:\s])\s*(\d{1,3})/gi
      let nrMatch
      while ((nrMatch = nrPattern.exec(searchSection)) !== null) {
        if (nrMatch[1]) {
          ids.push(parseInt(nrMatch[1], 10))
        }
      }

      // Then look for standalone 1-3 digit numbers
      const regex = /\b(\d{1,3})\b/g
      let match
      while ((match = regex.exec(searchSection)) !== null) {
        const num = parseInt(match[1], 10)
        if (ids.includes(num)) continue // Skip if already found via Nr. pattern

        // Filter out date patterns like "03082025" or parts of dates
        const beforeMatch = searchSection.substring(0, match.index)
        const afterMatch = searchSection.substring(match.index + match[0].length)

        // Check if this number is part of a date pattern (e.g., "03.08.2025" or "03082025")
        const isPartOfDate =
          /\d{2}\.\d{2}\.$/.test(beforeMatch) || // Before: "03.08."
          /^\d{4}/.test(afterMatch) || // After: "2025"
          /\d{2}$/.test(beforeMatch) && /^\d{4}/.test(afterMatch) // Middle of date

        // Check if this number is part of a longer number sequence (like IBAN)
        const isPartOfLongNumber = /\d$/.test(beforeMatch) || /^\d/.test(afterMatch)

        if (!isPartOfDate && !isPartOfLongNumber) {
          ids.push(num)
        }
      }
    }

    return { ids: [...new Set(ids)], referenceSection, auftraggeber }
  }

  // Detect delimiter in CSV line
  const detectDelimiter = (line: string): string => {
    if (line.includes("\t")) return "\t"
    if (line.includes(";")) return ";"
    return ","
  }

  // Parse a CSV line respecting quotes
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)

    return result
  }

  // Parse CSV text into rows
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split(/\r?\n/)
    const rows: CSVRow[] = []

    // Find the header line or first data line
    let startIndex = 0
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase()
      if (line.includes("date") || line.includes("info")) {
        startIndex = i + 1 // Skip header
        break
      }
      // If first line looks like a title/meta line, skip it
      if (i === 0 && !line.includes(";") && !line.includes("\t") && !line.includes(",")) {
        startIndex = 1
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const delimiter = detectDelimiter(line)
      const parts = parseCSVLine(line, delimiter)

      // Skip rows that look like headers (only contain column names, no actual data)
      if (parts.length >= 2) {
        const firstCol = parts[0]?.toLowerCase().replace(/^["']|["']$/g, "")
        const secondCol = parts[1]?.toLowerCase().replace(/^["']|["']$/g, "")
        
        // Skip if this row only contains header-like text (e.g., "INFO" alone or "DATE", "INFO")
        if ((firstCol === "date" || firstCol === "info") && 
            (secondCol === "info" || secondCol === "" || parts.length <= 2)) {
          continue
        }

        // Remove quotes from each field and only add rows with actual data
        const cleanInfo = parts[1]?.replace(/^["']|["']$/g, "") || ""
        if (cleanInfo && cleanInfo.toLowerCase() !== "info" && cleanInfo.trim().length > 0) {
          rows.push({
            date: parts[0]?.replace(/^["']|["']$/g, "") || "",
            info: cleanInfo,
            date2: parts[2]?.replace(/^["']|["']$/g, ""),
            value: parts[3]?.replace(/^["']|["']$/g, ""),
            currency: parts[4]?.replace(/^["']|["']$/g, ""),
            timestamp: parts[5]?.replace(/^["']|["']$/g, ""),
          })
        }
      }
    }

    return rows
  }

  // Process CSV rows and match with users
  const processCSVRows = (csvRows: CSVRow[]): ProcessedRow[] => {
    return csvRows.map((row) => {
      const { ids, referenceSection, auftraggeber } = parseInfoField(row.info)
      const matchedUsers = findUsersByMemberIds(ids)

      let status: ProcessedRow["status"]
      let assignedUserId: string | undefined

      if (ids.length === 0) {
        status = "no_id"
      } else if (ids.length > 1) {
        status = "multiple_ids"
      } else if (matchedUsers.length === 0) {
        status = "no_match"
      } else if (matchedUsers.length > 1) {
        status = "multiple_matches"
      } else {
        status = "perfect"
        assignedUserId = matchedUsers[0].id
      }

      return {
        date: row.date,
        info: row.info,
        extractedMemberIds: ids,
        matchedUsers,
        status,
        assignedUserId,
        referenceSection,
        auftraggeber,
        date2: row.date2,
        value: row.value,
        currency: row.currency,
        timestamp: row.timestamp,
      }
    })
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const processed = processCSVRows(rows)
      
      // Create CSV upload record
      const autoProcessed = processed.filter(r => r.status === "perfect").length
      const manualReview = processed.filter(r => r.status !== "perfect").length
      
      const csvUploadId = await createCSVUpload({
        filename: file.name,
        totalRows: processed.length,
        autoProcessedCount: autoProcessed,
        manualReviewCount: manualReview,
      })
      
      if (csvUploadId) {
        setCurrentCsvUploadId(csvUploadId)
        console.log("CSV upload created with ID:", csvUploadId)
      } else {
        console.error("Failed to create CSV upload record")
      }
      
      setProcessedRows(processed)
      setIsUploadDialogOpen(false)
      setIsReviewDialogOpen(true)
    } catch (error) {
      alert("Fehler beim Lesen der Datei: " + (error as Error).message)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle manual assignment
  const handleAssignUser = (rowIndex: number, userId: string) => {
    setProcessedRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, assignedUserId: userId === "skip" ? undefined : userId } : row,
      ),
    )
  }

  // Get auto-matched rows (perfect matches)
  const getAutoMatchedRows = () => {
    return processedRows.filter((row) => row.status === "perfect")
  }

  // Get rows needing manual review
  const getManualReviewRows = () => {
    return processedRows.filter((row) => row.status !== "perfect")
  }

  // Handle final confirmation - only process automatic matches, save manual ones
  const handleConfirmTransactions = async () => {
    const manualReviews: PendingReviewInput[] = []
    let successCount = 0

    for (const row of processedRows) {
      // Only process automatic matches (perfect status)
      if (row.status === "perfect" && row.assignedUserId) {
        // Extract amount from CSV value field
        const amount = parseFloat(row.value?.replace(",", ".") || "0")
        
        if (amount > 0) {
          const transactionId = await processDeposit({
            userId: row.assignedUserId,
            amount,
            description: `Einzahlung: ${row.referenceSection || row.info.substring(0, 50)}`,
            date: row.date || new Date().toISOString().split("T")[0],
            csvUploadId: currentCsvUploadId || undefined,
          })
          
          if (transactionId) {
            successCount++
          } else {
            console.error("Failed to process deposit for user:", row.assignedUserId)
          }
        }
      } else {
        // Save manual review cases for later (to Supabase)
        manualReviews.push({
          date: row.date,
          info: row.info,
          date2: row.date2,
          value: row.value,
          currency: row.currency,
          timestamp: row.timestamp,
          extractedMemberIds: row.extractedMemberIds,
          status: row.status as PendingReviewInput["status"],
          assignedUserId: row.assignedUserId,
          referenceSection: row.referenceSection,
          auftraggeber: row.auftraggeber,
        })
      }
    }

    // Save manual review cases to Supabase
    if (manualReviews.length > 0) {
      await addPendingReviews(manualReviews)
      // Refresh pending cases
      const updatedCases = await getPendingReviews()
      setPendingCases(updatedCases)
      setCurrentPendingIndex(0)
    }

    setIsReviewDialogOpen(false)
    if (successCount > 0) {
      setIsConfirmDialogOpen(true)
    }
    setProcessedRows([])
    setCurrentCsvUploadId(null) // Reset CSV upload ID after processing
  }

  // Get current pending case
  const currentPendingCase = pendingCases[currentPendingIndex] || null

  // Handle assigning user to current pending case
  const handleAssignPendingUser = async (userId: string) => {
    if (!currentPendingCase) return
    await updatePendingReview(currentPendingCase.id, { assignedUserId: userId })
    const updatedCases = await getPendingReviews()
    setPendingCases(updatedCases)
  }

  // Process current pending case and move to next
  const handleProcessCurrentPending = async () => {
    if (!currentPendingCase || !currentPendingCase.assignedUserId) {
      alert("Bitte zuerst einen Benutzer zuordnen")
      return
    }

    setIsProcessingPending(true)

    // Extract amount from CSV value field
    const amount = parseFloat(currentPendingCase.value?.replace(",", ".") || "0")
    
    if (amount <= 0) {
      alert("Ungültiger Betrag")
      setIsProcessingPending(false)
      return
    }

    const transactionId = await processDeposit({
      userId: currentPendingCase.assignedUserId,
      amount,
      description: `Einzahlung: ${currentPendingCase.referenceSection || currentPendingCase.info.substring(0, 50)}`,
      date: currentPendingCase.date || new Date().toISOString().split("T")[0],
      csvUploadId: undefined, // Manual reviews don't have CSV upload ID
    })

    if (transactionId) {
      // Save to history before deleting
      await saveProcessedReviewToHistory(currentPendingCase, transactionId)
      
      await deletePendingReview(currentPendingCase.id)
      const updatedCases = await getPendingReviews()
      setPendingCases(updatedCases)
      // Keep index at 0 to show the next case (since the current one was removed)
      setCurrentPendingIndex(0)
      setPendingSearchQuery("")
    } else {
      alert("Fehler beim Verarbeiten der Einzahlung")
    }

    setIsProcessingPending(false)
  }

  // Skip current pending case (move to next without processing)
  const handleSkipCurrentPending = () => {
    if (currentPendingIndex < pendingCases.length - 1) {
      setCurrentPendingIndex(currentPendingIndex + 1)
    } else {
      setCurrentPendingIndex(0) // Loop back to first
    }
    setPendingSearchQuery("")
  }

  // Filter users for search
  const getFilteredUsers = (query: string) => {
    if (!query) return users
    const lowerQuery = query.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        String(user.memberId).includes(lowerQuery)
    )
  }

  // Get status explanation
  const getStatusExplanation = (status: string): string => {
    switch (status) {
      case "multiple_ids":
        return "Mehrere Mitglieds-IDs gefunden"
      case "no_id":
        return "Keine Mitglieds-ID gefunden"
      case "no_match":
        return "ID nicht im System gefunden"
      case "multiple_matches":
        return "Mehrere Benutzer mit dieser ID"
      default:
        return "Unbekannter Status"
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
        <h1 className="text-2xl font-bold">Verwaltung</h1>
          <p className="text-muted-foreground">Kontoauszüge verarbeiten</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              onClick={() => setViewMode("pending")}
              variant={viewMode === "pending" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Manuelle Überprüfung
              {viewMode === "pending" && pendingCases.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingCases.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setViewMode("history")}
              variant={viewMode === "history" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Verlauf
            </Button>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)} size="lg" className="gap-2 h-12">
            <Upload className="h-5 w-5" />
            CSV Upload
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "pending" ? (
        <>
          {/* Pending Reviews Section */}
          {isLoadingUsers ? (
            <Card>
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : pendingCases.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Keine offenen Überprüfungen</p>
                <p className="text-muted-foreground mt-1">
                  Laden Sie einen Kontoauszug hoch, um Transaktionen zu verarbeiten
                </p>
              </CardContent>
            </Card>
          ) : (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Manuelle Überprüfung
              </CardTitle>
              <Badge variant="secondary">
                {currentPendingIndex + 1} / {pendingCases.length}
              </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {currentPendingCase && (
              <>
                {/* Status Badge */}
                <Badge variant="outline" className="mb-2">
                  {getStatusExplanation(currentPendingCase.status)}
                </Badge>

                {/* Transaction Details */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Datum:</span>
                    <span className="font-medium">{currentPendingCase.date || "Nicht angegeben"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Betrag:</span>
                    <span className="font-medium text-green-600">
                      {currentPendingCase.value || "0"} {currentPendingCase.currency || "EUR"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Auftraggeber:</span>
                    <p className="font-medium mt-1">{currentPendingCase.auftraggeber}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Verwendungszweck:</span>
                    <p className="font-medium mt-1">{currentPendingCase.referenceSection}</p>
                  </div>
                  {currentPendingCase.extractedMemberIds.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gefundene IDs:</span>
                      <p className="font-medium mt-1">{currentPendingCase.extractedMemberIds.join(", ")}</p>
                    </div>
                  )}
          </div>

                {/* User Assignment */}
          <div className="space-y-2">
                  <label className="text-sm font-medium">Benutzer zuordnen</label>
                  <div className="relative" ref={pendingSearchRef}>
                    <div
                      className="flex items-center gap-2 h-12 px-3 border rounded-md cursor-pointer hover:bg-accent"
                      onClick={() => setIsPendingSearchOpen(!isPendingSearchOpen)}
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
            <Input
                        value={pendingSearchQuery}
                        onChange={(e) => {
                          setPendingSearchQuery(e.target.value)
                          setIsPendingSearchOpen(true)
                        }}
                        placeholder="Nach Name oder ID suchen..."
                        className="border-0 h-auto p-0 focus-visible:ring-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsPendingSearchOpen(true)
                        }}
                      />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>

                    {isPendingSearchOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {getFilteredUsers(pendingSearchQuery).map((user) => (
                          <div
                            key={user.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                              currentPendingCase.assignedUserId === user.id ? "bg-accent" : ""
                            }`}
                            onClick={() => {
                              handleAssignPendingUser(user.id)
                              setPendingSearchQuery(user.name)
                              setIsPendingSearchOpen(false)
                            }}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.memberId}</div>
          </div>
                        ))}
                        {getFilteredUsers(pendingSearchQuery).length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            Keine Benutzer gefunden
          </div>
                        )}
              </div>
                )}
              </div>
                  
                  {currentPendingCase.assignedUserId && (
                    <p className="text-sm text-green-600">
                      ✓ Zugeordnet: {users.find(u => u.id === currentPendingCase.assignedUserId)?.name}
                    </p>
                )}
              </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleProcessCurrentPending}
                    disabled={!currentPendingCase.assignedUserId || isProcessingPending}
                    className="flex-1 h-12 gap-2"
                  >
                    {isProcessingPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Verarbeiten
                  </Button>
                  <Button
                    onClick={handleSkipCurrentPending}
                    variant="outline"
                    className="h-12 gap-2"
                    disabled={pendingCases.length <= 1}
                  >
                    <SkipForward className="h-4 w-4" />
                    Überspringen
                  </Button>
        </div>
              </>
            )}
          </CardContent>
        </Card>
          )}
        </>
      ) : (
        /* History View */
        <div className="space-y-6">
          {isLoadingHistory ? (
            <Card>
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : csvUploads.length === 0 && historyItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Noch keine verarbeiteten Transaktionen</p>
                <p className="text-muted-foreground mt-1">
                  Laden Sie einen Kontoauszug hoch, um Transaktionen zu verarbeiten
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* CSV Uploads Section */}
              {csvUploads.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    CSV Uploads ({csvUploads.length})
                  </h3>
                  {csvUploads.map((upload) => (
                    <Card key={upload.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {upload.filename || "Unbenannte Datei"}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {new Date(upload.uploaded_at).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {upload.total_rows} Zeilen
                              </Badge>
                              <Badge variant="default" className="text-xs bg-green-600">
                                {upload.auto_processed_count} automatisch
                              </Badge>
                              {upload.manual_review_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {upload.manual_review_count} manuell
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {upload.transactions?.length || 0} Transaktionen
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Gesamt: {upload.transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0).toFixed(2) || "0.00"}€
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {upload.transactions && upload.transactions.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {upload.transactions.map((transaction: any) => (
                              <div key={transaction.id} className="p-3 bg-muted rounded-lg text-sm">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {transaction.user?.name || "Unbekannter Benutzer"}
                                      {transaction.user?.member_id && ` (ID: ${transaction.user.member_id})`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {transaction.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(transaction.created_at).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-green-600">
                                      +{parseFloat(transaction.amount || 0).toFixed(2)}€
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center p-4">
                            Keine Transaktionen in dieser Datei
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Manual Reviews Section */}
              {historyItems.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Manuelle Überprüfungen ({historyItems.length})
                  </h3>
                  <div className="space-y-3">
                    {historyItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with date and amount */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(item.processed_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {getStatusExplanation(item.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mt-1">{item.auftraggeber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  {item.value || "0"} {item.currency || "EUR"}
                                </p>
                                {item.transaction && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Transaktion: {item.transaction.amount.toFixed(2)}€
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Verwendungszweck:</span>
                                <p className="font-medium">{item.reference_section || "N/A"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Zugeordnet:</span>
                                <p className="font-medium">
                                  {item.assigned_user?.name || "Nicht zugeordnet"}
                                  {item.assigned_user?.member_id && ` (ID: ${item.assigned_user.member_id})`}
                                </p>
                              </div>
                              {item.extracted_member_ids && item.extracted_member_ids.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Gefundene IDs:</span>
                                  <p className="font-medium">{item.extracted_member_ids.join(", ")}</p>
                                </div>
                              )}
                              {item.transaction && (
                                <div>
                                  <span className="text-muted-foreground">Transaktions-ID:</span>
                                  <p className="font-mono text-xs">{item.transaction.id.substring(0, 8)}...</p>
                                </div>
                              )}
                            </div>

                            {/* Original info (collapsed by default) */}
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Original-Informationen anzeigen
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">
                                {item.info}
                              </div>
                            </details>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kontoauszug hochladen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine CSV-Datei mit den Spalten: date, info
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                CSV-Datei hier ablegen oder klicken zum Auswählen
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild disabled={isProcessing}>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verarbeite...
                    </>
                  ) : (
                    "Datei auswählen"
                  )}
                </label>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Überprüfung der Transaktionen</DialogTitle>
            <DialogDescription>
              {getAutoMatchedRows().length} automatisch zugeordnet, {getManualReviewRows().length} zur manuellen Prüfung
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Auto-matched section */}
            {getAutoMatchedRows().length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Automatisch zugeordnet ({getAutoMatchedRows().length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getAutoMatchedRows().map((row, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{row.auftraggeber}</span>
                        <span className="text-green-600">{row.value} {row.currency || "EUR"}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">{row.referenceSection}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual review section */}
            {getManualReviewRows().length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Manuelle Überprüfung erforderlich ({getManualReviewRows().length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  Diese Transaktionen werden zur späteren Bearbeitung gespeichert.
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getManualReviewRows().map((row, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{row.auftraggeber}</span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusExplanation(row.status)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">{row.referenceSection}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={handleConfirmTransactions} className="flex-1">
              Bestätigen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaktionen verarbeitet</AlertDialogTitle>
            <AlertDialogDescription>
              Die automatisch zugeordneten Transaktionen wurden erfolgreich verarbeitet.
              {pendingCases.length > 0 && (
                <span className="block mt-2">
                  {pendingCases.length} Transaktion(en) warten auf manuelle Überprüfung.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
