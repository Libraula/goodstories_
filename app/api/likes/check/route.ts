import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
// No longer need to import cookies directly here

export async function GET(request: NextRequest) {
  // createClient from utils/supabase/server handles cookies internally
  const supabase = await createClient()

  // Get the storyId from the query parameters
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
      return NextResponse.json({ isLiked: false }, { status: 401 }) // Unauthorized
    }

    if (!user) {
      // If user is not authenticated, return false for isLiked
      return NextResponse.json({ isLiked: false }, { status: 200 })
    }

    const userId = user.id

    // Check if the user has liked the story
    const { data, error } = await supabase.from("likes").select("*").eq("user_id", userId).eq("story_id", storyId)

    if (error) {
      console.error("Error checking like status:", error)
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
    }

    // Return whether the user has liked the story, handling potential null data
    return NextResponse.json({ isLiked: data?.length > 0 }, { status: 200 })
  } catch (error) {
    console.error("Error in likes/check endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
