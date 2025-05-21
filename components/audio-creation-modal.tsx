"use client"

import { useState, useRef, useEffect } from "react"
import {
  Loader2,
  Volume2,
  Mic,
  X,
  Play,
  Pause,
  Save,
  Trash2,
  AudioWaveformIcon as Waveform,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"

interface AudioCreationModalProps {
  storyId: string
  storyText: string
  storyTitle: string
  storyPages: any[] // Using any for simplicity, should match your StoryPage type
  onComplete: (audioUrl: string, audioType: string) => void
  onSkip: () => void
  onClose: () => void
}

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

// Use the client-side Supabase client
const supabase = createClient()

export default function AudioCreationModal({
  storyId,
  storyText,
  storyTitle,
  storyPages,
  onComplete,
  onSkip,
  onClose,
}: AudioCreationModalProps) {
  // State for AI generation
  const [selectedVoice, setSelectedVoice] = useState("zephyr")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [generationDuration, setGenerationDuration] = useState<number | null>(null)

  // State for recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // State for tab selection - changed default to "ai"
  const [activeTab, setActiveTab] = useState<"ai" | "record">("ai")

  // State for story preview
  const [currentPage, setCurrentPage] = useState(0)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => setIsPlaying(false)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [])

  // Update audio element when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl
    }
  }, [audioUrl])

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Navigate through story pages
  const goToNextPage = () => {
    if (storyPages && currentPage < storyPages.length - 1) {
      setCurrentPage(currentPage + 1)
      if (previewRef.current) {
        previewRef.current.scrollTop = 0
      }
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      if (previewRef.current) {
        previewRef.current.scrollTop = 0
      }
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Reset state
      setRecordingTime(0)
      audioChunksRef.current = []
      setAudioBlob(null)
      setAudioUrl(null)

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" })
        const url = URL.createObjectURL(audioBlob)

        setAudioBlob(audioBlob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      toast({
        title: "Recording stopped",
        description: "You can now preview your recording.",
        variant: "default",
      })
    }
  }

  // Play/pause recorded audio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)

    toast({
      title: "Recording deleted",
      description: "You can record a new narration.",
      variant: "default",
    })
  }

  // Upload user recording
  const uploadRecording = async () => {
    if (!audioBlob) return

    setIsUploading(true)

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], `story_${storyId}_recording.mp3`, {
        type: "audio/mp3",
        lastModified: Date.now(),
      })

      // Upload to Supabase storage - using "goodstories" bucket instead of "audio"
      const fileName = `story_audio/${storyId}/user_recording_${Date.now()}.mp3`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("goodstories")
        .upload(fileName, audioFile, {
          contentType: "audio/mpeg",
          cacheControl: "3600",
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("goodstories").getPublicUrl(fileName)

      // Complete the process
      onComplete(publicUrlData.publicUrl, "user-recorded")

      toast({
        title: "Recording uploaded!",
        description: "Your narration has been added to your story.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error uploading recording:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload recording",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  // Generate AI audio
  const generateAudio = async () => {
    // --- BEGIN ADDED CLIENT-SIDE LOGGING AND CHECK FOR storyId ---
    console.log("[AudioCreationModal] Attempting to generate audio. storyId:", storyId, "storyText (first 100 chars):", storyText?.substring(0, 100));

    if (!storyId) {
      console.error("[AudioCreationModal] Error: storyId is missing. Cannot generate audio.");
      toast({
        title: "Generation Failed",
        description: "Cannot generate audio: Story ID is missing. Please try again or contact support.",
        variant: "destructive",
      });
      setIsGenerating(false); // Ensure loading state is reset
      return;
    }
    // --- END ADDED CLIENT-SIDE LOGGING AND CHECK FOR storyId ---

    setIsGenerating(true)
    setGenerationStartTime(Date.now())
    setGenerationDuration(null)

    try {
      // Note: The API will limit text to ~2000 characters to prevent timeouts
      const response = await fetch("/api/audio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: storyId,
          text: storyText,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        let detailedError = "Failed to generate audio. Server returned an error."; // Default message
        
        // Handle 504 Gateway Timeout specifically
        if (response.status === 504) {
          detailedError = "The audio generation request timed out after 60 seconds. Please try with a shorter text (under 500 words).";
          
          toast({
            title: "Generation timed out",
            description: "Due to server limitations, audio generation is limited to 60 seconds. Try shortening your story text.",
            variant: "destructive",
          });
          
          // Still return the error to be handled by the catch block
          throw new Error(detailedError);
        } else {
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
        }
        throw new Error(detailedError);
      }

      const data = await response.json()
      
      // Record generation duration
      const endTime = Date.now()
      const duration = endTime - (generationStartTime || endTime)
      setGenerationDuration(duration)

      // Complete the process
      onComplete(data.audioUrl, "ai")

      toast({
        title: "Audio generated!",
        description: `AI narration has been added to your story in ${Math.round(duration/1000)} seconds.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error generating audio:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate audio",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      if (generationStartTime) {
        setGenerationDuration(Date.now() - generationStartTime)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-paper dark:bg-paper-dark z-50 flex flex-col">
      {/* Header - Fixed to ensure it's always visible */}
      <div className="sticky top-0 left-0 right-0 z-50 p-4 flex justify-between items-center border-b border-paper-dark/20 dark:border-paper/20 bg-white dark:bg-paper-dark shadow-sm">
        <h2 className="text-xl font-bold text-highlight dark:text-highlight flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Add Audio to Your Story
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-paper-dark/10 dark:hover:bg-paper/10 text-ink-light dark:text-ink-light"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tab Navigation - Swapped order to make AI Narration first */}
      <div className="flex border-b border-paper-dark/20 dark:border-paper/20">
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === "ai" ? "text-highlight border-b-2 border-highlight" : "text-ink-light hover:text-ink"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI Narration
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === "record" ? "text-highlight border-b-2 border-highlight" : "text-ink-light hover:text-ink"
          }`}
          onClick={() => setActiveTab("record")}
        >
          Record Yourself
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* AI Generation Tab - Improved UI with story preview and generation time */}
        {activeTab === "ai" && (
          <div className="flex flex-col h-full">
            {/* Voice Selection and Generation Controls */}
            <div className="w-full p-4">
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-paper-dark/5 dark:bg-paper/5 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium mb-2 text-highlight flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    AI Narration
                  </h3>
                  <p className="text-sm text-ink-light dark:text-ink-light">
                    Our AI will read your story with natural expression. Generation typically takes 30-50 seconds.
                    {generationDuration && !isGenerating && (
                      <span className="block mt-2 text-highlight font-medium">
                        Last generation took {Math.round(generationDuration/1000)} seconds
                      </span>
                    )}
                    {isGenerating && generationStartTime && (
                      <span className="block mt-2 text-highlight font-medium animate-pulse">
                        Generating... {Math.round((Date.now() - generationStartTime) / 1000)} seconds
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-light mt-2">
                    For best results, stories should be under 500 words. Very long stories may time out after 60 seconds due to server limitations.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Select Voice</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto p-1 border border-paper-dark/10 dark:border-paper/10 rounded-lg">
                    {VOICES.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-3 rounded-md text-left text-sm transition-all ${
                          selectedVoice === voice.id
                            ? "bg-highlight text-white shadow-sm"
                            : "bg-paper-dark/5 dark:bg-paper/5 hover:bg-paper-dark/10 dark:hover:bg-paper/10"
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
                  className="w-full py-3 px-4 bg-highlight text-white rounded-lg hover:bg-highlight/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Audio... {generationStartTime && (
                        <span className="ml-1">({Math.round((Date.now() - generationStartTime) / 1000)}s)</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5" />
                      Generate AI Narration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording Tab - Improved layout for mobile */}
        {activeTab === "record" && (
          <div className="flex flex-col md:flex-row">
            {/* Story Preview Panel - Fixed width, no expand/collapse */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-paper-dark/20 dark:border-paper/20 flex flex-col">
              <div className="p-4 border-b border-paper-dark/20 dark:border-paper/20">
                <h3 className="font-medium">Story Preview</h3>
              </div>

              <div
                ref={previewRef}
                className="flex-1 overflow-y-auto p-4 bg-paper dark:bg-paper-dark max-h-[40vh] md:max-h-none"
              >
                {storyPages && storyPages.length > 0 && (
                  <>
                    {currentPage === 0 && (
                      <h2 className="text-xl md:text-2xl font-bold mb-4 text-highlight">{storyTitle}</h2>
                    )}

                    {storyPages[currentPage]?.type === "text" ? (
                      <div className="story-text leading-relaxed mb-4 text-ink dark:text-ink wysiwyg-content">
                        {storyPages[currentPage].content.map((paragraph: string, pIndex: number) => (
                          <div key={pIndex} className="mb-4 wysiwyg-paragraph">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: paragraph
                                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
                                  .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
                                  .replace(/# (.*?)(?:\n|$)/g, '<h1 class="text-2xl font-bold mb-2">$1</h1>') // H1
                                  .replace(/## (.*?)(?:\n|$)/g, '<h2 class="text-xl font-bold mb-2">$1</h2>') // H2
                                  .replace(
                                    /> (.*?)(?:\n|$)/g,
                                    '<blockquote class="border-l-4 border-highlight pl-4 italic text-ink-light">$1</blockquote>',
                                  ) // Quote
                                  .replace(/\n/g, "<br>"), // Line breaks
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="my-4">
                        <img
                          src={storyPages[currentPage].image || "/placeholder.svg"}
                          alt={storyPages[currentPage].image_alt || "Story image"}
                          className="w-full h-auto rounded-lg"
                        />
                        {storyPages[currentPage].content.map((caption: string, idx: number) => (
                          <p key={idx} className="text-sm text-ink-light dark:text-ink-light mt-2">
                            {caption}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Page Navigation */}
              {storyPages && storyPages.length > 1 && (
                <div className="p-3 border-t border-paper-dark/20 dark:border-paper/20 flex justify-between items-center">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-full hover:bg-paper-dark/10 dark:hover:bg-paper/10 text-ink-light disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <span className="text-sm text-ink-light">
                    Page {currentPage + 1} of {storyPages.length}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === storyPages.length - 1}
                    className="p-1.5 rounded-full hover:bg-paper-dark/10 dark:hover:bg-paper/10 text-ink-light disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Recording Controls Panel - Improved for mobile */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="p-4 border-b border-paper-dark/20 dark:border-paper/20">
                <h3 className="font-medium">Recording Controls</h3>
              </div>

              <div className="flex-1 p-4 flex flex-col justify-center items-center">
                {!audioBlob ? (
                  <div className="flex flex-col items-center py-6 space-y-6 w-full">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center ${isRecording ? "bg-red text-white animate-pulse" : "bg-highlight text-white"}`}
                    >
                      <Mic className="h-10 w-10" />
                    </div>

                    {isRecording && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red animate-pulse"></div>
                        <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                      </div>
                    )}

                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`py-3 px-8 rounded-full font-medium text-lg ${
                        isRecording
                          ? "bg-red text-white hover:bg-red/90"
                          : "bg-highlight text-white hover:bg-highlight/90"
                      }`}
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>

                    <p className="text-sm text-ink-light dark:text-ink-light text-center max-w-md">
                      Read your story aloud at a comfortable pace. You can navigate through the pages using the controls
                      below the preview.
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-6">
                    <div className="bg-paper-dark/10 dark:bg-paper/10 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlayback}
                          className="w-10 h-10 rounded-full bg-highlight text-white flex items-center justify-center"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>
                        <div>
                          <div className="text-sm font-medium">Your Recording</div>
                          <div className="text-xs text-ink-light">{formatTime(recordingTime)}</div>
                        </div>
                      </div>
                      <button
                        onClick={deleteRecording}
                        className="p-2 text-ink-light hover:text-red"
                        title="Delete recording"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <Waveform className="h-10 w-full text-highlight/50" />
                    </div>

                    <button
                      onClick={uploadRecording}
                      disabled={isUploading}
                      className="w-full py-3 px-4 bg-highlight text-white rounded-md hover:bg-highlight/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Uploading Recording...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Use This Recording
                        </>
                      )}
                    </button>

                    <button
                      onClick={startRecording}
                      className="w-full py-3 px-4 border border-highlight text-highlight rounded-md hover:bg-highlight/10 transition-colors"
                    >
                      Record Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Fixed the skip button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-paper-dark/20 dark:border-paper/20 bg-white dark:bg-paper-dark shadow-sm">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-4 bg-paper-dark/10 dark:bg-paper/10 text-ink-light rounded-lg hover:bg-paper-dark/20 dark:hover:bg-paper/20 transition-colors flex items-center justify-center"
          >
            <span className="md:hidden">Skip Audio</span>
            <span className="hidden md:inline">Skip Audio & Publish Story</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-paper-dark/20 dark:border-paper/20 text-ink dark:text-ink rounded-lg hover:bg-paper-dark/5 dark:hover:bg-paper/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
