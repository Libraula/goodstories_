"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface ReadingSettingsContextType {
  fontSize: string
  readingMode: string
  setFontSize: (size: string) => void
  setReadingMode: (mode: string) => void
}

const ReadingSettingsContext = createContext<ReadingSettingsContextType | undefined>(undefined)

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState("medium") // Default to medium
  const [readingMode, setReadingMode] = useState("scroll")

  // Apply font size when it changes
  useEffect(() => {
    const fontSizeValue =
      fontSize === "small"
        ? "var(--font-size-small)"
        : fontSize === "medium"
          ? "var(--font-size-medium)"
          : "var(--font-size-large)"

    document.documentElement.style.setProperty("--story-font-size", fontSizeValue)
  }, [fontSize])

  // Apply reading mode when it changes
  useEffect(() => {
    const storyPages = document.querySelectorAll(".story-pages")

    storyPages.forEach((container) => {
      if (readingMode === "page") {
        // Page mode: enable snap effect
        container.classList.add("snap-x", "snap-mandatory")

        // Make sure all story pages have snap-center
        const pages = container.querySelectorAll(".story-page")
        pages.forEach((page) => {
          if (page instanceof HTMLElement) {
            // Remove first, then add to avoid any issues
            page.classList.remove("snap-start")
            page.classList.add("snap-center")
            page.style.scrollSnapStop = "always"
          }
        })

        // Set scroll behavior - use auto for faster transitions
        if (container instanceof HTMLElement) {
          container.style.scrollSnapType = "x mandatory"
          container.style.scrollBehavior = "auto"
        }
      } else {
        // Scroll mode: enable smooth scrolling
        container.classList.remove("snap-x", "snap-mandatory")

        // Set scroll behavior
        if (container instanceof HTMLElement) {
          container.style.scrollSnapType = "none"
          container.style.scrollBehavior = "auto"
        }

        // Remove snap from pages
        const pages = container.querySelectorAll(".story-page")
        pages.forEach((page) => {
          if (page instanceof HTMLElement) {
            page.classList.remove("snap-center")
            page.classList.remove("snap-start")
            page.style.scrollSnapStop = "normal"
          }
        })
      }
    })
  }, [readingMode])

  return (
    <ReadingSettingsContext.Provider value={{ fontSize, readingMode, setFontSize, setReadingMode }}>
      {children}
    </ReadingSettingsContext.Provider>
  )
}

export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext)
  if (context === undefined) {
    throw new Error("useReadingSettings must be used within a ReadingSettingsProvider")
  }
  return context
}

