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
        <div className="create-tab p-5 h-full overflow-y-auto relative">
          {showSuccess && (
            <div className="success-message fixed top-4 right-4 bg-highlight dark:bg-highlight text-white p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 duration-300 z-50">
              <CheckCircle size={20} />
              <span>Story published successfully!</span>
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-highlight dark:text-highlight text-center">Create New Content</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div
                className="create-option bg-white dark:bg-paper-dark rounded-xl p-6 shadow-sm border border-paper-dark/10 dark:border-paper/10 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => handleCreateClick("story")}
              >
                <div className="create-icon text-highlight dark:text-highlight mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center">
                    <Pencil size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink text-center">Write a Story</h3>
                <p className="create-description text-sm text-ink-light dark:text-ink-light text-center">
                  Compose your own short story or flash fiction (max 700 words)
                </p>
              </div>

              <div
                className="create-option bg-white dark:bg-paper-dark rounded-xl p-6 shadow-sm border border-paper-dark/10 dark:border-paper/10 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 opacity-70"
                onClick={() => handleCreateClick("essay")}
              >
                <div className="create-icon text-highlight dark:text-highlight mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center">
                    <Camera size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink text-center">Create an Essay</h3>
                <p className="create-description text-sm text-ink-light dark:text-ink-light text-center">
                  Share your thoughts in a visual essay format
                </p>
                <div className="mt-2 text-xs text-highlight dark:text-highlight text-center">Coming soon</div>
              </div>

              <div
                className="create-option bg-white dark:bg-paper-dark rounded-xl p-6 shadow-sm border border-paper-dark/10 dark:border-paper/10 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 md:col-span-1 lg:col-span-1 md:mx-auto lg:mx-0"
                onClick={() => handleCreateClick("story")}
              >
                <div className="create-icon text-highlight dark:text-highlight mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center">
                    <Mic size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink text-center">Add Audio to Story</h3>
                <p className="create-description text-sm text-ink-light dark:text-ink-light text-center">
                  Add AI narration to your stories
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
