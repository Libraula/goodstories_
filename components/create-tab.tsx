"use client"

export default function CreateTab() {
  return (
    <div className="create-tab p-5 text-center h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer">
        <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4">
          <i className="fas fa-keyboard"></i>
        </div>
        <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Write a Story</h3>
        <p className="create-description text-sm text-ink-light dark:text-ink-light">
          Compose your own short story or flash fiction
        </p>
      </div>

      <div className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer">
        <div className="create-icon text-3xl text-highlight dark:text-highlight mb-4">
          <i className="fas fa-camera"></i>
        </div>
        <h3 className="create-title text-xl font-bold mb-2 text-ink dark:text-ink">Create an Essay</h3>
        <p className="create-description text-sm text-ink-light dark:text-ink-light">
          Share your thoughts in a visual essay format
        </p>
      </div>

      <div className="create-option bg-white dark:bg-paper-dark rounded-lg p-6 shadow-sm border border-paper-dark dark:border-paper cursor-pointer">
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

