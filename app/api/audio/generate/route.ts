import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import mime from "mime"

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

    // Initialize Google Gemini
    const gemini = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    })

    // Configure TTS settings
    const config = {
      temperature: 1,
      responseModalities: ["audio"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: mapVoice(voice), // Map the voice name to Gemini voice
          },
        },
      },
    }

    const model = "gemini-2.5-flash-preview-tts"
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: truncatedText,
          },
        ],
      },
    ]

    // Generate audio with Gemini
    const response = await gemini.models.generateContent({
      model,
      config,
      contents,
    })

    // Extract audio data
    let audioBuffer: Buffer | null = null
    let mimeType = "audio/wav"

    if (
      response.response.candidates &&
      response.response.candidates[0].content &&
      response.response.candidates[0].content.parts &&
      response.response.candidates[0].content.parts[0].inlineData
    ) {
      const inlineData = response.response.candidates[0].content.parts[0].inlineData
      mimeType = inlineData.mimeType || "audio/wav"
      audioBuffer = Buffer.from(inlineData.data || "", "base64")
    }

    if (!audioBuffer) {
      throw new Error("Failed to generate audio data")
    }

    // Upload to Supabase Storage
    const fileName = `story_audio/${storyId}/${Date.now()}.${mime.getExtension(mimeType) || "wav"}`

    // Use the service role key for storage operations to bypass RLS
    const serviceRoleSupabase = createClient()

    const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
      .from("goodstories")
      .upload(fileName, audioBuffer, {
        contentType: mimeType,
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
        audio_type: "gemini",
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
      audioType: "gemini",
    })
  } catch (error) {
    console.error("Error generating audio:", error)
    return NextResponse.json({ error: "Failed to generate audio", details: (error as Error).message }, { status: 500 })
  }
}

// Helper function to map voice names from our UI to Gemini voice names
function mapVoice(voice: string): string {
  const voiceMap: Record<string, string> = {
    alloy: "Fenrir", // Deep male voice
    echo: "Nimbus", // Soft female voice
    fable: "Monarch", // British-sounding voice
    onyx: "Fenrir", // Deep male voice (duplicate)
    nova: "Prism", // Warm female voice
    shimmer: "Halo", // Clear female voice
  }

  return voiceMap[voice] || "Prism" // Default to Prism if no match
}
