"use client"

import { useState } from "react"
import { Loader2, Volume2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Story } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

interface AudioGeneratorProps {
  story: Story
  onAudioGenerated: (audioUrl: string) => void
}

const VOICES = [
  { id: "alloy", name: "Fenrir", description: "Deep male voice" },
  { id: "echo", name: "Nimbus", description: "Soft and calm female voice" },
  { id: "fable", name: "Monarch", description: "British-sounding voice" },
  { id: "onyx", name: "Fenrir Alt", description: "Deep and authoritative male voice" },
  { id: "nova", name: "Prism", description: "Warm and engaging female voice" },
  { id: "shimmer", name: "Halo", description: "Clear and expressive female voice" },
]

export default function AudioGenerator({ story, onAudioGenerated }: AudioGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState("nova")
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if current user is the author of the story
  const isAuthor = user?.id === story.author_id

  const generateAudio = async () => {
    if (isGenerating || !isAuthor) return

    setIsGenerating(true)

    try {
      // Combine all text content from story pages
      const storyText = story.pages
        .filter((page) => page.type === "text")
        .flatMap((page) => page.content)
        .join(" ")

      // Limit text length to avoid API limits (most TTS APIs have character limits)
      const maxLength = 4000
      const truncatedText = storyText.length > maxLength ? storyText.substring(0, maxLength) + "..." : storyText

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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate audio")
      }

      const data = await response.json()

      toast({
        title: "Audio generated with Gemini!",
        description: "Your story now has an audio version powered by Google Gemini.",
        variant: "default",
      })

      onAudioGenerated(data.audioUrl)
    } catch (error) {
      console.error("Error generating audio:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate audio",
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
