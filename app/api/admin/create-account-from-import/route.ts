import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { importId, password, title } = body

    if (!importId || !password || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Get import data
    const { data: importData, error: fetchError } = await supabase
      .from("bulk_member_imports")
      .select("*")
      .eq("id", importId)
      .single()

    if (fetchError || !importData) {
      return NextResponse.json(
        { success: false, error: "Import data not found" },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!importData.email || !importData.name) {
      return NextResponse.json(
        { success: false, error: "Email and name are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", importData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Use service role to create auth user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: importData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: importData.name,
        title: title || "Herr",
        phone: importData.mobile_phone || "",
        address: importData.address || "",
        postal_code: importData.postal_code || "",
        city: importData.city || "",
        role: "USER",
      },
    })

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json(
        { success: false, error: authError?.message || "Failed to create user account" },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Get the highest member_id from the database
    const { data: maxMemberData } = await supabase
      .from("users")
      .select("member_id")
      .not("member_id", "is", null)
      .order("member_id", { ascending: false })
      .limit(1)

    // Calculate next member_id
    const nextMemberId = maxMemberData && maxMemberData.length > 0 && maxMemberData[0]?.member_id
      ? (maxMemberData[0].member_id as number) + 1 
      : 1

    // Update user profile with all data from import
    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: importData.name,
        title: title || "Herr",
        phone: importData.mobile_phone || "",
        address: importData.address || "",
        postal_code: importData.postal_code || null,
        city: importData.city || null,
        member_id: nextMemberId,
        status: "APPROVED",
        image_url: importData.photo_url || null,
        balance: -100, // Initial fee
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      // Try to delete auth user if profile update fails
      await adminSupabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { success: false, error: "Failed to create user profile" },
        { status: 500 }
      )
    }

    // Create initial fee transaction
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: 'INITIAL_FEE',
        amount: -100,
        description: 'Anmeldegebühr',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error("Error creating initial fee transaction:", transactionError)
      // Don't fail the whole operation, just log the error
    }

    // Delete the import record
    const { error: deleteError } = await supabase
      .from("bulk_member_imports")
      .delete()
      .eq("id", importId)

    if (deleteError) {
      console.error("Error deleting import record:", deleteError)
      // Don't fail, just log
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error("Error in createAccountFromImport:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

