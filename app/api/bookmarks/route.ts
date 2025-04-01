import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { isAuthenticated } from "@/utils/supabase/server"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to bookmark stories", message: "authentication_required" },
        { status: 401 },
      )
    }

    const requestData = await request.json().catch(() => ({}))
    const { storyId } = requestData

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("story_id", storyId)

    if (bookmarkError) {
      console.error("Error checking existing bookmark:", bookmarkError)
      return NextResponse.json({ error: "Failed to check existing bookmark" }, { status: 500 })
    }

    if (existingBookmark && existingBookmark.length > 0) {
      return NextResponse.json({ message: "Already bookmarked" }, { status: 200 })
    }

    // Create new bookmark
    const { data: bookmarkData, error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        id: uuidv4(),
        user_id: userId,
        story_id: storyId,
        created_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("Error creating bookmark:", insertError)
      return NextResponse.json({ error: "Failed to bookmark story" }, { status: 500 })
    }

    // Increment the story's bookmark count
    const { error: updateError } = await supabase.rpc("increment_bookmarks", { story_id: storyId })

    if (updateError) {
      console.error("Error incrementing bookmark count:", updateError)
      // Continue even if this fails, the bookmark was still created
    }

    return NextResponse.json({ message: "Story bookmarked successfully", data: bookmarkData }, { status: 201 })
  } catch (error) {
    console.error("Error in bookmarks POST endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to remove bookmarks", message: "authentication_required" },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Delete the bookmark
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("story_id", storyId)

    if (deleteError) {
      console.error("Error deleting bookmark:", deleteError)
      return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
    }

    // Decrement the story's bookmark count
    const { error: updateError } = await supabase.rpc("decrement_bookmarks", { story_id: storyId })

    if (updateError) {
      console.error("Error decrementing bookmark count:", updateError)
      // Continue even if this fails, the bookmark was still deleted
    }

    return NextResponse.json({ message: "Bookmark removed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in bookmarks DELETE endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

