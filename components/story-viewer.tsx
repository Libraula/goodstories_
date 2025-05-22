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
        index === activeStoryIndex ||
        isTransitioning // Prevent new navigation if already transitioning
      )
        return

      setIsTransitioning(true) // Set transitioning flag
      setActiveStoryIndex(index)
      setActiveAudio(stories[index]?.audio_url || null)

      const element = storyViewerRef.current
      const targetPosition =
        readingMode === "page" ? index * element.clientHeight : index * element.clientWidth

      // Ensure all items are correctly styled for smooth transition
      const storyItems = element.querySelectorAll('.story-item') as NodeListOf<HTMLElement>;
      storyItems.forEach((item, i) => {
        item.style.zIndex = i === index ? '10' : '1';
        item.style.opacity = '1'; // Ensure all are opaque for scrolling
        item.style.visibility = 'visible'; // Ensure all are visible
      });

      // Scroll to the target position
      element.scrollTo({
        [readingMode === "page" ? "top" : "left"]: targetPosition,
        behavior: "smooth", // Use smooth scrolling
      })

      // Force a reflow before the final check if necessary
      void element.offsetHeight;

      // Timeout to reset transitioning state and verify scroll position
      setTimeout(() => {
        const currentPosition =
          readingMode === "page" ? element.scrollTop : element.scrollLeft
        // If scroll hasn't reached the target, snap to it
        if (Math.abs(currentPosition - targetPosition) > 10) { // Increased tolerance
          element.scrollTo({
            [readingMode === "page" ? "top" : "left"]: targetPosition,
            behavior: "auto", // Use auto for instant snap
          })
        }
        setIsTransitioning(false) // Reset transitioning flag
      }, 550) // Slightly longer timeout to ensure smooth scroll completes
    },
    [stories, readingMode, activeStoryIndex, isTransitioning], // Added isTransitioning to dependencies
  )

  // Scroll snapping and index update logic
  useEffect(() => {
    const element = storyViewerRef.current
    if (!element) return

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (isTransitioning) return

      // Clear any existing timeout to avoid premature index updates
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Set a new timeout to update index only after scrolling has likely stopped
      scrollTimeout = setTimeout(() => {
        let newIndex: number
        if (readingMode === "page") {
          const storyHeight = element.clientHeight
          newIndex = storyHeight > 0 ? Math.round(element.scrollTop / storyHeight) : activeStoryIndex;
        } else {
          const storyWidth = element.clientWidth
          newIndex = storyWidth > 0 ? Math.round(element.scrollLeft / storyWidth) : activeStoryIndex;
        }

        if (newIndex >= 0 && newIndex < stories.length && newIndex !== activeStoryIndex) {
          setActiveStoryIndex(newIndex)
          setActiveAudio(stories[newIndex]?.audio_url || null)
        }
      }, 150); // Debounce scroll events
    }

    element.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      element.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    }
  }, [isTransitioning, readingMode, stories, activeStoryIndex]) // Updated dependencies

  // Handle touch events for story navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return; // Ignore touch if transitioning
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!storyViewerRef.current || e.changedTouches.length === 0 || isTransitioning) return;

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // Lower threshold for better responsiveness
    const swipeThreshold = 30; 
    const isSignificantHorizontalSwipe = Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5; // Prioritize horizontal if more significant
    const isSignificantVerticalSwipe = Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX) * 1.5; // Prioritize vertical if more significant

    let navigated = false;
    if (readingMode === "page") {
      if (isSignificantVerticalSwipe) {
        if (deltaY > 0 && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
          navigated = true;
        } else if (deltaY < 0 && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
          navigated = true;
        }
      }
    } else { // Scroll mode
      if (isSignificantHorizontalSwipe) {
        if (deltaX > 0 && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
          navigated = true;
        } else if (deltaX < 0 && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
          navigated = true;
        }
      }
    }
    if (navigated) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        className={cn(
          "story-list h-full w-full overflow-hidden",
          readingMode === "page" ? "flex flex-col" : "flex flex-row"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          scrollSnapType: readingMode === "page" ? "y mandatory" : "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {stories.map((story, index) => (
          <div
            key={story.id || index}
            className={cn(
              "story-item relative flex-shrink-0 w-full h-full overflow-auto",
              readingMode === "page" ? "snap-start" : "snap-center"
            )}
            style={{ 
              zIndex: index === activeStoryIndex ? 10 : 1,
              scrollSnapStop: "always",
            }}
          >
            <StoryContainer
              story={story}
              showSidebar={false}
              toggleSidebar={() => {}}
              isActive={index === activeStoryIndex}
              activeAudio={index === activeStoryIndex}
              isInStoryViewer={true}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


