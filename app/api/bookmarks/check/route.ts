import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const storyId = searchParams.get("storyId")

  if (!storyId) {
    return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
  }

  try {
    // Get the current user securely using getUser()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ isBookmarked: false }, { status: 401 }) // Unauthorized
    }

    if (!user) {
      return NextResponse.json({ isBookmarked: false }, { status: 200 })
    }

    const userId = user.id

    const { data, error: dbError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("story_id", storyId)

    if (dbError) {
      console.error("Error checking bookmark status:", dbError)
      return NextResponse.json({ error: "Failed to check bookmark status" }, { status: 500 })
    }

    return NextResponse.json({ isBookmarked: data?.length > 0 }, { status: 200 })
  } catch (error) {
    console.error("Error in bookmarks/check endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

