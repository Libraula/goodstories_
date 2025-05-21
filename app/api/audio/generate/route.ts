import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import mime from "mime"

// Define a timeout promise to prevent hanging requests
const timeoutPromise = (timeoutMs: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
};

// Set a reasonable timeout for the entire operation (60 seconds for Vercel hobby plan)
const OPERATION_TIMEOUT_MS = 55000; // Use 55 seconds to allow for some processing overhead

export const maxDuration = 60; // Maximum allowed for Vercel hobby plan

export async function POST(request: NextRequest) {
  try {
    // --- BEGIN DIAGNOSTIC LOGGING ---
    console.log("🔍 API: Starting /api/audio/generate endpoint");
    console.log(
      "🔑 API: GEMINI_API_KEY:",
      process.env.GEMINI_API_KEY ? "✅ Set" : "❌ NOT SET (This is crucial!)"
    );
    
    // --- END DIAGNOSTIC LOGGING ---

    // Parse request body first, before any DB operations
    let storyId, text, voice;
    try {
      const body = await request.json();
      storyId = body.storyId;
      text = body.text;
      voice = body.voice;
      
      console.log("📦 API: Received request with:", { 
        storyId, 
        voice,
        textLength: text?.length || 0,
        textSample: text?.substring(0, 50) || "MISSING"
      });
    } catch (parseError) {
      console.error("❌ API: Failed to parse request body:", parseError);
      return NextResponse.json({ 
        error: "Invalid request", 
        details: "Could not parse request body" 
      }, { status: 400 });
    }

    // Validate required inputs
    if (!text) {
      console.error("❌ API: Missing text in request body");
      return NextResponse.json({ 
        error: "Missing required field", 
        details: "Text content is required" 
      }, { status: 400 });
    }
    
    if (!voice) {
      console.error("❌ API: Missing voice in request body");
      return NextResponse.json({ 
        error: "Missing required field", 
        details: "Voice selection is required" 
      }, { status: 400 });
    }

    // If storyId is missing, generate a temporary ID
    if (!storyId) {
      console.warn("⚠️ API: storyId is missing, generating a temporary ID");
      storyId = `temp_${Date.now()}`;
    }

    // Limit text length to avoid API limits and timeout issues
    const maxLength = 2000; // Reduced to help stay within 60-second limit
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Initialize Google Gemini - Check for API key first
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ API: GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error", details: "AI service API key is missing" }, 
        { status: 500 }
      );
    }

    // Configure TTS settings
    const config = {
      temperature: 1,
      responseModalities: ["audio"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
    };

    const model = "gemini-2.5-flash-preview-tts";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Read this story with appropriate emotion and pacing: ${truncatedText}`,
          },
        ],
      },
    ];

    console.log("🎙️ API: Generating audio with Gemini TTS...", { voice, model });

    // Generate audio with Gemini with timeout
    try {
      const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Use Promise.race to implement timeout
      const geminiResponse = await Promise.race([
        gemini.models.generateContent({
          model,
          config,
          contents,
        }),
        timeoutPromise(OPERATION_TIMEOUT_MS)
      ]);

      console.log("✅ API: Received response from Gemini");

      // Extract audio data
      let audioBuffer: Buffer | null = null;
      let mimeType = "audio/wav";

      if (!geminiResponse.candidates || 
          !geminiResponse.candidates[0]?.content?.parts?.[0]?.inlineData) {
        console.error("❌ API: Unexpected Gemini response structure:", JSON.stringify(geminiResponse));
        throw new Error("Unexpected response structure from Gemini API");
      }

      // TypeScript type assertion
      const inlineData = geminiResponse.candidates[0].content.parts[0].inlineData as { mimeType?: string; data?: string };
      mimeType = inlineData.mimeType || "audio/wav";
      audioBuffer = Buffer.from(inlineData.data || "", "base64");
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error("❌ API: Empty audio data received from Gemini");
        throw new Error("Received empty audio data from Gemini");
      }
      
      console.log("✅ API: Successfully extracted audio data", { 
        mimeType, 
        bufferSize: audioBuffer.length 
      });

      // Create Supabase client for storage operations
      let supabase;
      try {
        supabase = await createClient();
        console.log("✅ API: Supabase client created for storage operations");
      } catch (supabaseError) {
        console.error("❌ API: Failed to create Supabase client:", supabaseError);
        throw new Error("Supabase client initialization failed");
      }

      // Upload to Supabase Storage
      const fileName = `story_audio/${storyId}/${Date.now()}.${mime.getExtension(mimeType) || "wav"}`;
      console.log("💾 API: Uploading audio to Supabase storage:", { fileName });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("goodstories")
        .upload(fileName, audioBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ API: Error uploading audio to storage:", uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("goodstories").getPublicUrl(fileName);
      console.log("🔗 API: Audio uploaded successfully", { publicUrl: publicUrlData.publicUrl });

      // Return successful response with the audio URL
      return NextResponse.json({
        success: true,
        audioUrl: publicUrlData.publicUrl,
        audioType: "gemini",
        voice: voice,
      });
      
    } catch (geminiError) {
      console.error("❌ API: Error in Gemini audio generation:", geminiError);
      
      // Check if this is a timeout error and return a specific message for timeouts
      const errorMessage = geminiError instanceof Error ? geminiError.message : "Unknown error in audio generation";
      const isTimeout = errorMessage.includes("timed out") || geminiError instanceof Error && geminiError.name === "AbortError";
      
      const status = isTimeout ? 504 : 500;
      const errorDetails = isTimeout ? 
        "The audio generation request timed out. Please try with a shorter text or try again later." :
        errorMessage;
      
      return NextResponse.json({ 
        error: isTimeout ? "Audio generation timed out" : "AI audio generation failed", 
        details: errorDetails
      }, { status });
    }
    
  } catch (error) {
    console.error("❌ API: Unhandled error in /api/audio/generate:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate audio", details: message }, { status: 500 });
  }
}
