import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Parse request body
    const { storyId, text, voice } = await request.json()

    if (!storyId || !text || !voice) {
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
      return NextResponse.json({ error: "Only the author can generate audio for this story" }, { status: 403 })
    }

    // Limit text length to avoid API limits
    const maxLength = 4000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text

    // Generate audio with OpenAI
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: truncatedText,
    })

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Upload to Supabase Storage
    const fileName = `story_audio/${storyId}/${Date.now()}.mp3`

    // Use the service role key for storage operations to bypass RLS
    const serviceRoleSupabase = createClient()

    const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
      .from("goodstories")
      .upload(fileName, buffer, {
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

    // Get the public URL
    const { data: publicUrlData } = serviceRoleSupabase.storage.from("goodstories").getPublicUrl(fileName)

    // Update the story with the audio URL
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        audio_url: publicUrlData.publicUrl,
        audio_voice: voice,
        audio_type: "ai",
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
      audioType: "ai",
    })
  } catch (error) {
    console.error("Error generating audio:", error)
    return NextResponse.json({ error: "Failed to generate audio", details: (error as Error).message }, { status: 500 })
  }
}
