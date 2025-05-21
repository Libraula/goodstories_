"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import StoryContainer from "./story-container"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import type { Story } from "@/lib/types"
import { cn } from "@/lib/utils" // Assuming you have a utility for class names

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  onClose: () => void
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const storyViewerRef = useRef<HTMLDivElement>(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(initialIndex)
  const { readingMode } = useReadingSettings()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [activeAudio, setActiveAudio] = useState<string | null>(null)

  // Function to navigate to a specific story with smooth scrolling
  const navigateToStory = useCallback(
    (index: number) => {
      if (
        !storyViewerRef.current ||
        index < 0 ||
        index >= stories.length ||
        index === activeStoryIndex
      )
        return

      setIsTransitioning(true)
      setActiveStoryIndex(index) // Update index immediately for visual feedback if needed

      // Update active audio to the new story's audio
      setActiveAudio(stories[index]?.audio_url || null)

      const element = storyViewerRef.current
      
      // Calculate target position
      const targetPosition = readingMode === "page" 
        ? index * element.clientHeight 
        : index * element.clientWidth;
      
      // Update the z-index and visibility of story items
      const storyItems = element.querySelectorAll('.story-item');
      storyItems.forEach((item, i) => {
        const htmlItem = item as HTMLElement;
        // Update z-index and opacity to ensure proper visibility
        htmlItem.style.zIndex = i === index ? '10' : '1';
        htmlItem.style.opacity = '1';
      });
      
      // Perform scroll with smooth behavior
      element.scrollTo({
        [readingMode === "page" ? "top" : "left"]: targetPosition,
        behavior: "smooth"
      });
      
      // Set a timeout to verify and correct scroll position
      setTimeout(() => {
        // Verify the scroll position and adjust if needed
        const currentPosition = readingMode === "page" 
          ? element.scrollTop 
          : element.scrollLeft;
          
        const expectedPosition = readingMode === "page" 
          ? index * element.clientHeight 
          : index * element.clientWidth;
        
        // If position is not correct, force it
        if (Math.abs(currentPosition - expectedPosition) > 10) {
          element.scrollTo({
            [readingMode === "page" ? "top" : "left"]: expectedPosition,
            behavior: "auto" // Use instant positioning as fallback
          });
        }
        
        setIsTransitioning(false);
      }, 500);
    },
    [stories.length, readingMode, activeStoryIndex],
  )

  // Scroll snapping and index update logic (simplified from StoryFeed)
  useEffect(() => {
    const element = storyViewerRef.current
    if (!element) return

    const handleScroll = () => {
      if (isTransitioning) return // Don't update index during programmatic scroll

      let newIndex: number
      if (readingMode === "page") {
        const storyHeight = element.clientHeight
        newIndex = Math.round(element.scrollTop / storyHeight)
      } else {
        const storyWidth = element.clientWidth
        newIndex = Math.round(element.scrollLeft / storyWidth)
      }

      if (newIndex >= 0 && newIndex < stories.length && newIndex !== activeStoryIndex) {
        setActiveStoryIndex(newIndex)
        // Update active audio when story changes
        setActiveAudio(stories[newIndex]?.audio_url || null)
      }
    }

    // Use debounce or throttle if performance becomes an issue
    element.addEventListener("scroll", handleScroll, { passive: true })
    return () => element.removeEventListener("scroll", handleScroll)
  }, [isTransitioning, readingMode, stories.length, activeStoryIndex])

  // Handle touch events for story navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!storyViewerRef.current || e.changedTouches.length === 0) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // Determine if this is a significant swipe (lower threshold for better response)
    const isSignificantHorizontalSwipe = Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)
    const isSignificantVerticalSwipe = Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)

    if (readingMode === "page") {
      // In page mode, vertical swipe navigates
      if (isSignificantVerticalSwipe) {
        if (deltaY > 0 && activeStoryIndex > 0) {
          // Swipe down - previous story
          e.preventDefault()
          navigateToStory(activeStoryIndex - 1)
          return true
        } else if (deltaY < 0 && activeStoryIndex < stories.length - 1) {
          // Swipe up - next story
          e.preventDefault()
          navigateToStory(activeStoryIndex + 1)
          return true
        }
      }
    } else {
      // In scroll mode, horizontal swipe navigates
      if (isSignificantHorizontalSwipe) {
        if (deltaX > 0 && activeStoryIndex > 0) {
          // Swipe right - previous story 
          e.preventDefault()
          navigateToStory(activeStoryIndex - 1)
          return true
        } else if (deltaX < 0 && activeStoryIndex < stories.length - 1) {
          // Swipe left - next story
          e.preventDefault()
          navigateToStory(activeStoryIndex + 1)
          return true
        }
      }
    }
    
    return false
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return

      if (readingMode === "page") {
        if (e.key === "ArrowUp" && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
        } else if (e.key === "ArrowDown" && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
        } else if (e.key === "Escape") {
          onClose()
        }
      } else {
        if (e.key === "ArrowLeft" && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
        } else if (e.key === "ArrowRight" && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
        } else if (e.key === "Escape") {
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeStoryIndex, readingMode, stories.length, isTransitioning, navigateToStory, onClose])

  // Effect to scroll to the initial index when the component mounts or initialIndex changes
  useEffect(() => {
    const element = storyViewerRef.current
    if (element) {
      // Use a slight delay to ensure the layout is stable, especially on initial load
      const timer = setTimeout(() => {
        if (readingMode === "page") {
          const storyHeight = element.clientHeight
          element.scrollTo({ top: storyHeight * initialIndex, behavior: "auto" }) // Use 'auto' for initial positioning
        } else {
          const storyWidth = element.clientWidth
          element.scrollTo({ left: storyWidth * initialIndex, behavior: "auto" }) // Use 'auto' for initial positioning
        }
        // Set active index after initial scroll positioning
        setActiveStoryIndex(initialIndex)
      }, 50) // Small delay

      return () => clearTimeout(timer)
    }
  }, [initialIndex, readingMode, stories]) // Rerun if initialIndex or readingMode changes

  // Initialize active audio when component mounts
  useEffect(() => {
    if (stories[initialIndex]?.audio_url) {
      setActiveAudio(stories[initialIndex].audio_url)
    }
  }, [initialIndex, stories])

  return (
    <div className="story-viewer fixed inset-0 z-50 bg-paper dark:bg-paper-dark">
      {/* Back button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 bg-paper dark:bg-paper-dark rounded-full shadow-md"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6 text-ink dark:text-ink-light" />
      </button>

      {/* Story pagination indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => navigateToStory(index)}
            aria-label={`Go to story ${index + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 bg-paper-dark/50 dark:bg-paper/50",
              index === activeStoryIndex
                ? "w-6 bg-highlight dark:bg-highlight"
                : "w-1.5 hover:bg-paper-dark dark:hover:bg-paper",
            )}
          />
        ))}
      </div>

      {/* Stories container */}
      <div
        ref={storyViewerRef}
        className={`story-list h-full w-full ${
          readingMode === "page" ? "flex flex-col overflow-y-auto" : "flex flex-row overflow-x-auto"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: "auto",
          minHeight: "100%",
          scrollSnapType: readingMode === "page" ? "y mandatory" : "x mandatory",
          scrollBehavior: "smooth"
        }}
      >
        {stories.map((story, index) => (
          <div
            key={index}
            className={`story-item min-w-full min-h-full h-auto ${readingMode === "page" ? "" : "inline-block"} sm:px-1 md:px-2 lg:px-3 w-full box-border overflow-auto`}
            style={{ 
              scrollSnapAlign: "start", 
              position: "relative", 
              zIndex: index === activeStoryIndex ? 10 : 1,
              opacity: 1,
              flex: "0 0 100%",
              maxWidth: "100%"
            }}
          >
            <StoryContainer
              story={story}
              showSidebar={false}
              toggleSidebar={() => {}}
              isActive={index === activeStoryIndex}
              activeAudio={index === activeStoryIndex}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
