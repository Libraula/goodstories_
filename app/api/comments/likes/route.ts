import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// POST: Like a comment
export async function POST(request: Request) {
  try {
    // Create a Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            /* No-op for API routes */
          },
          remove(name: string, options: any) {
            /* No-op for API routes */
          },
        },
      },
    )

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Please log in to like comments", message: "authentication_required" },
        { status: 401 },
      )
    }

    const userId = user.id

    // Get the comment ID from the request body
    let requestData;
    try {
      requestData = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    
    const { commentId } = requestData

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    console.log(`Liking comment: ${commentId}, user: ${userId}`)

    // Check if the comment exists
    const { data: commentExists, error: commentError } = await supabase
      .from("comments")
      .select("id")
      .eq("id", commentId)
      .single()

    if (commentError) {
      if (commentError.code === "PGRST116") {
        // No rows found
        return NextResponse.json({ error: "Comment not found" }, { status: 404 })
      }
      console.error("Error checking comment existence:", commentError)
      return NextResponse.json({ error: "Failed to check comment" }, { status: 500 })
    }

    // Check if the like already exists
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .maybeSingle()

    if (likeCheckError) {
      console.error("Error checking existing like:", likeCheckError)
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
    }

    if (existingLike) {
      return NextResponse.json({ message: "Comment already liked" }, { status: 200 })
    }

    // Insert the like
    const { error: insertError } = await supabase.from("comment_likes").insert({
      id: uuidv4(),
      user_id: userId,
      comment_id: commentId,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error inserting like:", insertError)
      return NextResponse.json({ error: "Failed to like comment" }, { status: 500 })
    }

    // Increment the comment's like count
    try {
      await supabase.rpc("increment_comment_likes", { comment_id: commentId })
      console.log(`Successfully liked comment: ${commentId}`)
    } catch (rpcError) {
      console.error("Error incrementing like count:", rpcError)
      // Continue even if this fails, the like was still created
    }

    return NextResponse.json({ message: "Comment liked successfully", status: "success" }, { status: 201 })
  } catch (error) {
    console.error("Error in comment likes POST endpoint:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE: Unlike a comment
export async function DELETE(request: Request) {
  try {
    // Create a Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            /* No-op for API routes */
          },
          remove(name: string, options: any) {
            /* No-op for API routes */
          },
        },
      },
    )

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Please log in to unlike comments", message: "authentication_required" },
        { status: 401 },
      )
    }

    const userId = user.id

    // Get the comment ID from the query parameters
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    console.log(`Unliking comment: ${commentId}, user: ${userId}`)

    // Delete the like
    const { error: deleteError, count } = await supabase
      .from("comment_likes")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("comment_id", commentId)

    if (deleteError) {
      console.error("Error deleting like:", deleteError)
      return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 })
    }

    // Only decrement if a like was actually deleted
    if (count && count > 0) {
      try {
        await supabase.rpc("decrement_comment_likes", { comment_id: commentId })
        console.log(`Successfully unliked comment: ${commentId}`)
      } catch (rpcError) {
        console.error("Error decrementing like count:", rpcError)
        // Continue even if this fails, the like was still deleted
      }

      return NextResponse.json({ message: "Comment unliked successfully", status: "success" }, { status: 200 })
    } else {
      return NextResponse.json({ message: "Like not found", status: "warning" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error in comment likes DELETE endpoint:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
