"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface ReadingSettingsContextType {
  fontSize: string
  readingMode: string
  setFontSize: (size: string) => void
  setReadingMode: (mode: string) => void
}

// Create context with default values to avoid the "undefined" error
const defaultContextValue: ReadingSettingsContextType = {
  fontSize: "medium",
  readingMode: "page", // Default is page mode
  setFontSize: () => {},
  setReadingMode: () => {},
}

const ReadingSettingsContext = createContext<ReadingSettingsContextType>(defaultContextValue)

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState("medium") // Default to medium
  const [readingMode, setReadingMode] = useState("page") // Default to page mode

  // Apply font size when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const fontSizeValue =
        fontSize === "small"
          ? "var(--font-size-small)"
          : fontSize === "medium"
            ? "var(--font-size-medium)"
            : "var(--font-size-large)"

      document.documentElement.style.setProperty("--story-font-size", fontSizeValue)
    }
  }, [fontSize])

  // Apply reading mode when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Update story feed container
      const storyFeed = document.querySelector(".story-feed")
      if (storyFeed instanceof HTMLElement) {
        if (readingMode === "page") {
          // In page mode, stories are stacked vertically
          storyFeed.classList.remove("flex", "overflow-x-auto", "snap-x")
          storyFeed.classList.add("flex-col", "overflow-y-auto", "snap-y")
          storyFeed.style.scrollSnapType = "y mandatory"
        } else {
          // In scroll mode, stories are arranged horizontally
          storyFeed.classList.remove("flex-col", "overflow-y-auto", "snap-y")
          storyFeed.classList.add("flex", "overflow-x-auto", "snap-x")
          storyFeed.style.scrollSnapType = "x mandatory"
        }
      }

      // Update story wrappers
      const storyWrappers = document.querySelectorAll(".story-wrapper")
      storyWrappers.forEach((wrapper) => {
        if (wrapper instanceof HTMLElement) {
          if (readingMode === "page") {
            // In page mode, stories take full height
            wrapper.classList.remove("min-w-full", "snap-center")
            wrapper.classList.add("min-h-full", "snap-start")
          } else {
            // In scroll mode, stories take full width
            wrapper.classList.remove("min-h-full", "snap-start")
            wrapper.classList.add("min-w-full", "snap-center")
          }
        }
      })

      // Update story pages containers
      const storyPages = document.querySelectorAll(".story-pages")
      storyPages.forEach((container) => {
        if (readingMode === "page") {
          // In page mode, pages are arranged horizontally
          container.classList.remove("overflow-y-auto", "snap-y")
          container.classList.add("flex", "overflow-x-auto", "snap-x")

          // Make sure all story pages have snap-center
          const pages = container.querySelectorAll(".story-page")
          pages.forEach((page) => {
            if (page instanceof HTMLElement) {
              page.classList.remove("min-h-full")
              page.classList.add("min-w-full", "snap-center")
              page.style.scrollSnapStop = "always"
            }
          })

          // Set scroll behavior
          if (container instanceof HTMLElement) {
            container.style.scrollSnapType = "x mandatory"
            container.style.scrollBehavior = "auto"
          }
        } else {
          // In scroll mode, pages are arranged vertically
          container.classList.remove("flex", "overflow-x-auto", "snap-x")
          container.classList.add("overflow-y-auto", "snap-y")

          // Make sure all story pages have snap-center
          const pages = container.querySelectorAll(".story-page")
          pages.forEach((page) => {
            if (page instanceof HTMLElement) {
              page.classList.remove("min-w-full")
              page.classList.add("min-h-full", "snap-center")
              page.style.scrollSnapStop = "always"
            }
          })

          // Set scroll behavior
          if (container instanceof HTMLElement) {
            container.style.scrollSnapType = "y mandatory"
            container.style.scrollBehavior = "auto"
          }
        }
      })
    }
  }, [readingMode])

  const value = {
    fontSize,
    readingMode,
    setFontSize,
    setReadingMode,
  }

  return <ReadingSettingsContext.Provider value={value}>{children}</ReadingSettingsContext.Provider>
}

export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext)
  return context
}
