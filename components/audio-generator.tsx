"use client"

import { useState } from "react"
import { Loader2, Volume2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Story } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { useAudio } from "@/contexts/audio-context"

interface AudioGeneratorProps {
  story: Story
  onAudioGenerated: (audioUrl: string) => void
}

// All 30 Gemini voice options
const VOICES = [
  { id: "zephyr", name: "Zephyr", description: "Bright" },
  { id: "puck", name: "Puck", description: "Upbeat" },
  { id: "charon", name: "Charon", description: "Informative" },
  { id: "kore", name: "Kore", description: "Firm" },
  { id: "fenrir", name: "Fenrir", description: "Excitable" },
  { id: "leda", name: "Leda", description: "Youthful" },
  { id: "orus", name: "Orus", description: "Firm" },
  { id: "aoede", name: "Aoede", description: "Breezy" },
  { id: "callirhoe", name: "Callirhoe", description: "Easy-going" },
  { id: "autonoe", name: "Autonoe", description: "Bright" },
  { id: "enceladus", name: "Enceladus", description: "Breathy" },
  { id: "iapetus", name: "Iapetus", description: "Clear" },
  { id: "umbriel", name: "Umbriel", description: "Easy-going" },
  { id: "algieba", name: "Algieba", description: "Smooth" },
  { id: "despina", name: "Despina", description: "Smooth" },
  { id: "erinome", name: "Erinome", description: "Clear" },
  { id: "algenib", name: "Algenib", description: "Gravelly" },
  { id: "rasalgethi", name: "Rasalgethi", description: "Informative" },
  { id: "laomedeia", name: "Laomedeia", description: "Upbeat" },
  { id: "achernar", name: "Achernar", description: "Soft" },
  { id: "alnilam", name: "Alnilam", description: "Firm" },
  { id: "schedar", name: "Schedar", description: "Even" },
  { id: "gacrux", name: "Gacrux", description: "Mature" },
  { id: "pulcherrima", name: "Pulcherrima", description: "Forward" },
  { id: "achird", name: "Achird", description: "Friendly" },
  { id: "zubenelgenubi", name: "Zubenelgenubi", description: "Casual" },
  { id: "vindemiatrix", name: "Vindemiatrix", description: "Gentle" },
  { id: "sadachbia", name: "Sadachbia", description: "Lively" },
  { id: "sadaltager", name: "Sadaltager", description: "Knowledgeable" },
  { id: "sulafar", name: "Sulafar", description: "Warm" },
]

export default function AudioGenerator({ story, onAudioGenerated }: AudioGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState("zephyr") // Default to Zephyr
  const { toast } = useToast()
  const { user } = useAuth()
  const { setAudioUrl } = useAudio()

  // Check if current user is the author of the story
  const isAuthor = user?.id === story.author_id

  const generateAudio = async () => {
    if (isGenerating || !isAuthor) return

    setIsGenerating(true)
    toast({
      title: "Generating audio...",
      description: "This may take up to 90 seconds for longer stories.",
      variant: "default",
    })

    try {
      // Combine all text content from story pages
      const storyText = story.pages
        .filter((page) => page.type === "text")
        .flatMap((page) => page.content)
        .join(" ")

      // Limit text length to avoid API limits
      const maxLength = 4000
      const truncatedText = storyText.length > maxLength ? storyText.substring(0, maxLength) + "..." : storyText

      console.log("Generating audio for story", {
        storyId: story.id,
        voice: selectedVoice,
        textLength: truncatedText.length,
      })

      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch("/api/audio/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storyId: story.id,
            text: truncatedText,
            voice: selectedVoice,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);

        // Check for timeout or server errors
        if (!response.ok) {
          let errorMessage = "Failed to generate audio.";
          
          if (response.status === 504) {
            errorMessage = "The request timed out. Try with a shorter story or try again later.";
          }
          
          // Try to get detailed error message
          let detailedError = errorMessage;
          try {
            const errorData = await response.json();
            detailedError = errorData.details || errorData.error || detailedError;
          } catch (e) {
            console.error("Could not parse error response as JSON:", e);
            // Try to get text from the response if JSON parsing fails
            try {
              const textResponse = await response.text();
              if (textResponse) {
                detailedError = textResponse;
              }
            } catch (textErr) {
              console.error("Could not get text from error response:", textErr);
            }
          }
          
          throw new Error(detailedError);
        }

        const data = await response.json()
        console.log("Audio generated successfully", data)

        // Set the audio URL in the global audio context
        setAudioUrl(data.audioUrl, story.id)

        toast({
          title: "Audio generated successfully!",
          description: `Your story now has audio in the ${VOICES.find((v) => v.id === selectedVoice)?.name || selectedVoice} voice.`,
          variant: "default",
        })

        onAudioGenerated(data.audioUrl)
      } catch (fetchError: unknown) {
        // Handle AbortController timeout
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("The audio generation request timed out. Please try with a shorter text or try again later.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error generating audio:", error)
      
      // Provide user-friendly error messages
      let errorMessage = error instanceof Error ? error.message : "Failed to generate audio";
      
      // Check for specific error conditions and provide helpful messages
      if (errorMessage.includes("timed out") || errorMessage.includes("timeout")) {
        errorMessage = "The request took too long. Try using less text (under 2000 characters) or try again later.";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Error generating audio",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // If user is not the author, don't show the generator
  if (!isAuthor) {
    return null
  }

  return (
    <div className="audio-generator bg-paper dark:bg-paper-dark rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-highlight" />
        Generate Audio with Gemini
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Voice</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {VOICES.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelectedVoice(voice.id)}
              className={`p-2 rounded-md text-left text-sm ${
                selectedVoice === voice.id
                  ? "bg-highlight text-white"
                  : "bg-paper-dark/10 dark:bg-paper/10 hover:bg-paper-dark/20 dark:hover:bg-paper/20"
              }`}
            >
              <div className="font-medium">{voice.name}</div>
              <div className="text-xs opacity-80">{voice.description}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generateAudio}
        disabled={isGenerating}
        className="w-full py-2 px-4 bg-highlight text-white rounded-md hover:bg-highlight/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Audio with Gemini...
          </>
        ) : story.audio_url && story.audio_voice === selectedVoice ? (
          <>
            <Check className="h-4 w-4" />
            Regenerate Audio
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            Generate Audio
          </>
        )}
      </button>

      {story.audio_url && story.audio_voice && story.audio_voice !== selectedVoice && (
        <p className="text-xs text-ink-light dark:text-ink-light mt-2">
          Note: This story already has audio in the "{story.audio_voice}" voice. Generating new audio will replace it.
        </p>
      )}
    </div>
  )
}
