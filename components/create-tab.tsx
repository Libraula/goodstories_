"use client"

import { useAuth } from "@/contexts/auth-context"

export default function CreateTab() {
  const { user, showLoginModal } = useAuth()

  const handleOptionClick = (option: string) => {
    // Allow all users to view content, but show login modal for interactions if not logged in
    console.log(`Selected ${option}`)

    // For publishing or saving content, we still need authentication
    if (!user && (option.includes("Publish") || option.includes("Save"))) {
      showLoginModal()
      return
    }

    // Otherwise, allow access to the creation tools
    console.log(`Opening ${option} editor`)
    // In a real app, you'd navigate to the editor page or open an editor modal
  }

  return (
    <div className="create-tab p-5 text-center h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleOptionClick("Write a Story")}
      >
        <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4">
          <i className="fas fa-keyboard"></i>
        </div>
        <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Write a Story</h3>
        <p className="create-description text-sm text-ink-light dark:text-ink-light">
          Compose your own short story or flash fiction
        </p>
      </div>

      <div
        className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleOptionClick("Create an Essay")}
      >
        <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4">
          <i className="fas fa-camera"></i>
        </div>
        <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Create an Essay</h3>
        <p className="create-description text-sm text-ink-light dark:text-ink-light">
          Share your thoughts in a visual essay format
        </p>
      </div>

      <div
        className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleOptionClick("Record Audio")}
      >
        <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4">
          <i className="fas fa-microphone"></i>
        </div>
        <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Record Audio</h3>
        <p className="create-description text-sm text-ink-light dark:text-ink-light">
          Narrate your story with your voice
        </p>
      </div>
    </div>
  )
}

