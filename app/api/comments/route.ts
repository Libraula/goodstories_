import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isAuthenticated } from "@/utils/supabase/server"

export async function GET(request: Request) {
  try {
    // Create a Supabase client
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
            /* No-op */
          },
          remove(name: string, options: any) {
            /* No-op */
          },
        },
      },
    )

    // Get the current user for checking likes
    const { userId } = await isAuthenticated()

    // Get storyId from query params
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get("storyId")

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Fetch comments with profiles
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        id,
        author_id,
        story_id,
        content,
        created_at,
        updated_at,
        likes_count,
        profiles (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("story_id", storyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    // If user is authenticated, check which comments they've liked
    let userLikes = new Set<string>()
    if (userId) {
      const { data: likes, error: likesError } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId)
        .in(
          "comment_id",
          comments.map((c) => c.id),
        )

      if (!likesError && likes) {
        userLikes = new Set(likes.map((like) => like.comment_id))
      }
    }

    // Add user_has_liked property to each comment
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      user_has_liked: userLikes.has(comment.id),
    }))

    return NextResponse.json({ data: commentsWithLikes })
  } catch (error) {
    console.error("Error in comments GET endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()

    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to post comments", message: "authentication_required" },
        { status: 401 },
      )
    }

    const requestData = await request.json().catch(() => ({}))
    const { storyId, content } = requestData

    if (!storyId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Story ID and content are required" }, { status: 400 })
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)

      // If profile doesn't exist, create a minimal one
      if (profileError.code === "PGRST116") {
        // No rows returned
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        if (user) {
          const username = user.email?.split("@")[0] || `user_${userId.substring(0, 8)}`
          const name = user.user_metadata?.full_name || username
          const avatar_url = user.user_metadata?.avatar_url || null

          // Create a new profile
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              username,
              name,
              avatar_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
          }

          const profileData = newProfile
        } else {
          return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
      }
    }

    // Create comment
    const commentId = uuidv4()
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        id: commentId,
        author_id: userId,
        story_id: storyId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        likes_count: 0,
      })
      .select()

    if (commentError) {
      console.error("Error creating comment:", commentError)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Increment the story's comment count
    await supabase.rpc("increment_comments", { story_id: storyId }).catch((err) => {
      console.error("Error incrementing comment count:", err)
    })

    // Format the response
    const comment = commentData[0]
    const formattedComment = {
      ...comment,
      user_has_liked: false,
      profiles: {
        id: profileData.id,
        name: profileData.name,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
      },
    }

    return NextResponse.json({ data: formattedComment }, { status: 201 })
  } catch (error) {
    console.error("Error in comments POST endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to delete comments", message: "authentication_required" },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    // Get the comment to check ownership and get the story ID
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single()

    if (commentError || !comment) {
      console.error("Error fetching comment for delete:", commentError)
      return NextResponse.json(
        { error: comment ? "Failed to fetch comment" : "Comment not found" },
        { status: comment ? 500 : 404 },
      )
    }

    if (comment.author_id !== userId) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 })
    }

    // Store the story ID for decrementing the count later
    const storyId = comment.story_id

    // Delete the comment
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId)

    if (deleteError) {
      console.error("Error deleting comment:", deleteError)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }

    // Decrement the story's comment count
    await supabase.rpc("decrement_comments", { story_id: storyId }).catch((err) => {
      console.error("Error decrementing comment count:", err)
    })

    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in comments DELETE endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAuthenticated: userIsAuthenticated, userId, supabase } = await isAuthenticated()
    if (!userIsAuthenticated || !userId) {
      return NextResponse.json(
        { error: "Please log in to edit comments", message: "authentication_required" },
        { status: 401 },
      )
    }

    const requestData = await request.json().catch(() => ({}))
    const { commentId, content } = requestData

    if (!commentId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Comment ID and content are required" }, { status: 400 })
    }

    // Check if the comment exists and belongs to the user
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("*")
      .eq("id", commentId)
      .single()

    if (commentError || !comment) {
      console.error("Error fetching comment for patch:", commentError)
      return NextResponse.json(
        { error: comment ? "Failed to fetch comment" : "Comment not found" },
        { status: comment ? 500 : 404 },
      )
    }

    if (comment.author_id !== userId) {
      return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 })
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()

    if (updateError) {
      console.error("Error updating comment:", updateError)
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Comment updated successfully",
        data: updatedComment[0],
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in comments PATCH endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
