"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import StoryEditor from "./story-editor"
import { Pencil, Camera, Mic, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateTab() {
  const [showEditor, setShowEditor] = useState(false)
  const [editorType, setEditorType] = useState<"story" | "essay" | "audio">("story")
  const [showSuccess, setShowSuccess] = useState(false)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const router = useRouter()

  const handleCreateClick = (type: "story" | "essay" | "audio") => {
    if (!user) {
      openModal()
      return
    }
    setEditorType(type)
    setShowEditor(true)
  }

  const handleEditorClose = () => {
    setShowEditor(false)
  }

  const handleEditorSuccess = () => {
    setShowEditor(false)
    setShowSuccess(true)

    // Refresh the data to show the new story
    router.refresh()

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <>
      {showEditor ? (
        <StoryEditor onClose={handleEditorClose} onSuccess={handleEditorSuccess} />
      ) : (
        <div className="create-tab p-5 text-center h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative">
          {showSuccess && (
            <div className="success-message fixed top-4 right-4 bg-highlight dark:bg-highlight text-white p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 duration-300 z-50">
              <CheckCircle size={20} />
              <span>Story published successfully!</span>
            </div>
          )}

          <div
            className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow duration-300"
            onClick={() => handleCreateClick("story")}
          >
            <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4 flex justify-center">
              <Pencil size={32} strokeWidth={1.5} />
            </div>
            <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Write a Story</h3>
            <p className="create-description text-sm text-ink-light dark:text-ink-light">
              Compose your own short story or flash fiction (max 700 words)
            </p>
          </div>

          <div
            className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow duration-300 opacity-70"
            onClick={() => handleCreateClick("essay")}
          >
            <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4 flex justify-center">
              <Camera size={32} strokeWidth={1.5} />
            </div>
            <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Create an Essay</h3>
            <p className="create-description text-sm text-ink-light dark:text-ink-light">
              Share your thoughts in a visual essay format
            </p>
            <div className="mt-2 text-xs text-highlight dark:text-highlight">Coming soon</div>
          </div>

          <div
            className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow duration-300 opacity-70"
            onClick={() => handleCreateClick("audio")}
          >
            <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4 flex justify-center">
              <Mic size={32} strokeWidth={1.5} />
            </div>
            <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Record Audio</h3>
            <p className="create-description text-sm text-ink-light dark:text-ink-light">
              Narrate your story with your voice
            </p>
            <div className="mt-2 text-xs text-highlight dark:text-highlight">Coming soon</div>
          </div>
        </div>
      )}
    </>
  )
}
