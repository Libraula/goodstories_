import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get session to verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get form data with audio file
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const storyId = formData.get("storyId") as string

    if (!audioFile || !storyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify that the user is the author of the story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("author_id")
      .eq("id", storyId)
      .single()

    if (storyError) {
      console.error("Error fetching story:", storyError)
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Check if the current user is the author
    if (story.author_id !== session.user.id) {
      return NextResponse.json({ error: "Only the author can upload audio for this story" }, { status: 403 })
    }

    // Upload the audio file to Supabase Storage - using "goodstories" bucket
    const fileName = `story_audio/${storyId}/${Date.now()}.mp3`

    // Use the service role key for storage operations to bypass RLS
    const serviceRoleSupabase = createClient()

    const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
      .from("goodstories")
      .upload(fileName, audioFile, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading audio to storage:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload audio",
          details: uploadError.message,
        },
        { status: 500 },
      )
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = serviceRoleSupabase.storage.from("goodstories").getPublicUrl(fileName)

    // Update the story record with the audio URL
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        audio_url: publicUrlData.publicUrl,
        audio_type: "user-recorded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId)

    if (updateError) {
      console.error("Error updating story with audio URL:", updateError)
      return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      audioUrl: publicUrlData.publicUrl,
      audioType: "user-recorded",
    })
  } catch (error) {
    console.error("Error uploading audio:", error)
    return NextResponse.json({ error: "Failed to upload audio", details: (error as Error).message }, { status: 500 })
  }
}
