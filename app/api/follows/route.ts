import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { isAuthenticated } from "@/utils/supabase/server"

// POST endpoint to follow a user
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to follow users", message: "authentication_required" },
        { status: 401 },
      )
    }

    const requestData = await request.json().catch(() => ({}))
    const { followingId } = requestData

    if (!followingId) {
      return NextResponse.json({ error: "User ID to follow is required" }, { status: 400 })
    }

    // Prevent following yourself
    if (userId === followingId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 })
    }

    // Check if follow already exists
    const { data: existingFollow, error: followError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId)
      .eq("following_id", followingId)

    if (followError) {
      console.error("Error checking existing follow:", followError)
      return NextResponse.json({ error: "Failed to check existing follow" }, { status: 500 })
    }

    if (existingFollow && existingFollow.length > 0) {
      return NextResponse.json({ message: "Already following" }, { status: 200 })
    }

    // Create new follow relationship
    const { data: followData, error: insertError } = await supabase
      .from("follows")
      .insert({
        id: uuidv4(),
        follower_id: userId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("Error creating follow:", insertError)
      return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User followed successfully", data: followData }, { status: 201 })
  } catch (error) {
    console.error("Error in follows POST endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE endpoint to unfollow a user
export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to unfollow users", message: "authentication_required" },
        { status: 401 },
      )
    }

    // Get followingId from query params
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get("followingId")

    if (!followingId) {
      return NextResponse.json({ error: "User ID to unfollow is required" }, { status: 400 })
    }

    // Delete the follow relationship
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", followingId)

    if (deleteError) {
      console.error("Error unfollowing user:", deleteError)
      return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User unfollowed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in follows DELETE endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to check follow status
export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to check follow status", message: "authentication_required" },
        { status: 401 },
      )
    }

    // Get followingId from query params
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get("followingId")

    if (!followingId) {
      return NextResponse.json({ error: "User ID to check is required" }, { status: 400 })
    }

    // Check if follow relationship exists
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userId)
      .eq("following_id", followingId)
      .single()

    if (followError && followError.code !== "PGRST116") {
      console.error("Error checking follow status:", followError)
      return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 })
    }

    const isFollowing = !!followData

    return NextResponse.json({ isFollowing }, { status: 200 })
  } catch (error) {
    console.error("Error in follows GET endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 