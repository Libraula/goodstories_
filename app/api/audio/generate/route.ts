import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import mime from "mime"

// Set a reasonable timeout for the entire operation (180 seconds for longer audio generation)
const OPERATION_TIMEOUT_MS = 175000; // Use 175 seconds to allow for some processing overhead

export const maxDuration = 300; // Increased from 60 to 180 seconds (3 minutes)

// Helper function for creating WAV headers
interface WavConversionOptions {
  numChannels: number,
  sampleRate: number,
  bitsPerSample: number
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 24000, // Default sample rate
    bitsPerSample: 16, // Default bits per sample
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  // http://soundfile.sapp.org/doc/WaveFormat
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType);
  const buffer = Buffer.from(rawData, 'base64');
  const wavHeader = createWavHeader(buffer.length, options);
  return Buffer.concat([wavHeader, buffer]);
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API: Starting /api/audio/generate endpoint");
    console.log("🔑 API: GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Set" : "❌ NOT SET (This is crucial!)");
    
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
    const maxLength = 12000; // Increased for longer audio generation (up to ~1500 words)
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Initialize Google Gemini - Check for API key first
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ API: GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error", details: "AI service API key is missing" }, 
        { status: 500 }
      );
    }

    // Configure TTS settings - UPDATED to match the Google guide
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

    const model = "gemini-2.5-flash-preview-tts"; // Using the proper TTS model
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: truncatedText,
          },
        ],
      },
    ];

    console.log("🎙️ API: Generating audio with Gemini TTS...", { voice, model });

    try {
      // Initialize the Gemini API client with the API key
      const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Use the streaming API to get the response
      const response = await gemini.models.generateContentStream({
        model,
        config,
        contents,
      });
      
      let audioData: Buffer | null = null;
      let audioMimeType = "audio/wav";
      
      // Process the streamed response chunks
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0]?.content?.parts?.[0]) {
          continue;
        }
        
        // Extract audio data from the inline data part
        if (chunk.candidates[0].content.parts[0].inlineData) {
          const inlineData = chunk.candidates[0].content.parts[0].inlineData;
          audioMimeType = inlineData.mimeType || "audio/wav";
          
          // If the format is not WAV, convert it
          let fileExtension = mime.getExtension(audioMimeType);
          if (!fileExtension || fileExtension !== 'wav') {
            console.log("🔄 API: Converting audio to WAV format");
            audioData = convertToWav(inlineData.data || '', audioMimeType);
          } else {
            audioData = Buffer.from(inlineData.data || '', 'base64');
          }
          
          // We only need the first audio chunk for now
          break;
        }
      }
      
      // Check if we got valid audio data
      if (!audioData || audioData.length === 0) {
        console.error("❌ API: No audio data received from Gemini");
        return NextResponse.json({ 
          error: "Audio generation failed", 
          details: "No audio data received from the AI service"
        }, { status: 500 });
      }
      
      console.log("✅ API: Successfully extracted audio data", { 
        mimeType: audioMimeType, 
        bufferSize: audioData.length 
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
      const fileName = `story_audio/${storyId}/${Date.now()}.wav`;
      console.log("💾 API: Uploading audio to Supabase storage:", { fileName });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("goodstories")
        .upload(fileName, audioData, {
          contentType: "audio/wav",
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
      
      // Update the story record with the audio URL and voice (if we have a valid storyId)
      if (storyId && !storyId.startsWith('temp_')) {
        console.log("📝 API: Updating story record with audio URL");
        const { error: updateError } = await supabase
          .from('stories')
          .update({ 
            audio_url: publicUrlData.publicUrl,
            audio_voice: voice,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId);
          
        if (updateError) {
          console.warn("⚠️ API: Failed to update story record:", updateError);
          console.warn("⚠️ API: Story ID during failed update:", storyId);
          // Continue anyway as we have the audio URL
        }
      }

      // Return successful response with the audio URL
      return NextResponse.json({
        success: true,
        audioUrl: publicUrlData.publicUrl,
        audioType: "gemini",
        voice: voice,
      });
      
    } catch (geminiError) {
      console.error("❌ API: Error in Gemini audio generation:", geminiError);
      
      const errorMessage = geminiError instanceof Error ? geminiError.message : "Unknown error in audio generation";
      
      return NextResponse.json({ 
        error: "AI audio generation failed", 
        details: errorMessage
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("❌ API: Unhandled error in /api/audio/generate:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate audio", details: message }, { status: 500 });
  }
}
