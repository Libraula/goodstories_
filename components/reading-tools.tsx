"use client"

import { ThemeToggle } from "./theme-toggle"
import { Type, Columns, HandIcon as Gesture, Sun, Moon } from "lucide-react"
import { useReadingSettings } from "@/contexts/reading-settings-context"

export default function ReadingTools() {
  const { fontSize, readingMode, setFontSize, setReadingMode } = useReadingSettings()

  return (
    <div className="reading-tools bg-white dark:bg-paper-dark rounded-lg p-4 shadow-sm border border-paper-dark dark:border-paper">
      <div className="mb-6">
        <h4 className="text-base font-bold mb-3 text-highlight dark:text-highlight flex items-center gap-2">
          <Type size={18} />
          <span>Font Size</span>
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setFontSize("small")}
            className={`px-3 py-1 rounded ${fontSize === "small" ? "bg-highlight text-white" : "bg-paper-dark dark:bg-paper text-ink dark:text-ink"}`}
          >
            Small
          </button>
          <button
            onClick={() => setFontSize("medium")}
            className={`px-3 py-1 rounded ${fontSize === "medium" ? "bg-highlight text-white" : "bg-paper-dark dark:bg-paper text-ink dark:text-ink"}`}
          >
            Medium
          </button>
          <button
            onClick={() => setFontSize("large")}
            className={`px-3 py-1 rounded ${fontSize === "large" ? "bg-highlight text-white" : "bg-paper-dark dark:bg-paper text-ink dark:text-ink"}`}
          >
            Large
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-bold mb-3 text-highlight dark:text-highlight flex items-center gap-2">
          <div className="flex">
            <Sun size={18} className="dark:hidden" />
            <Moon size={18} className="hidden dark:block" />
          </div>
          <span>Theme</span>
        </h4>
        <div className="flex items-center">
          <span className="mr-2 text-ink dark:text-ink">Light / Dark</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-bold mb-3 text-highlight dark:text-highlight flex items-center gap-2">
          <Columns size={18} />
          <span>Reading Mode</span>
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setReadingMode("scroll")}
            className={`px-3 py-1 rounded ${readingMode === "scroll" ? "bg-highlight text-white" : "bg-paper-dark dark:bg-paper text-ink dark:text-ink"}`}
          >
            Scroll
          </button>
          <button
            onClick={() => setReadingMode("page")}
            className={`px-3 py-1 rounded ${readingMode === "page" ? "bg-highlight text-white" : "bg-paper-dark dark:bg-paper text-ink dark:text-ink"}`}
          >
            Page
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-base font-bold mb-3 text-highlight dark:text-highlight flex items-center gap-2">
          <Gesture size={18} />
          <span>Gestures</span>
        </h4>
        <ul className="text-sm text-ink dark:text-ink">
          <li className="mb-2 flex items-center gap-2">
            <i className="fas fa-hand-pointer text-highlight dark:text-highlight"></i>
            <span>Double tap: Toggle full screen</span>
          </li>
          <li className="mb-2 flex items-center gap-2">
            <i className="fas fa-expand-arrows-alt text-highlight dark:text-highlight"></i>
            <span>Pinch out/in: Enter/Exit full screen</span>
          </li>
          {readingMode === "page" ? (
            <>
              <li className="mb-2 flex items-center gap-2">
                <i className="fas fa-arrows-alt-v text-highlight dark:text-highlight"></i>
                <span>Scroll up/down: Navigate between stories</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-arrows-alt-h text-highlight dark:text-highlight"></i>
                <span>Swipe left/right: Navigate between pages</span>
              </li>
            </>
          ) : (
            <>
              <li className="mb-2 flex items-center gap-2">
                <i className="fas fa-arrows-alt-h text-highlight dark:text-highlight"></i>
                <span>Scroll left/right: Navigate between stories</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-arrows-alt-v text-highlight dark:text-highlight"></i>
                <span>Swipe up/down: Navigate between pages</span>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

