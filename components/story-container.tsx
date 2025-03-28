"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, Share2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"

export default function StoryContainer({
  story,
  showSidebar,
  toggleSidebar,
}: { story: Story; showSidebar: boolean; toggleSidebar: () => void }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(story.likeCount)
  const [showComments, setShowComments] = useState(false)
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { readingMode } = useReadingSettings()
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  // Calculate container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      // Calculate available height (viewport height minus header and bottom nav)
      const viewportHeight = window.innerHeight
      const headerHeight = 60 // Approximate header height
      const bottomNavHeight = 60 // Bottom nav height

      // Calculate the available height for content
      const availableHeight = viewportHeight - headerHeight - bottomNavHeight - 10
      setContainerHeight(availableHeight)

      // Update content height for responsive text display
      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Set up intersection observer to detect when this story is visible
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Update visibility state based on intersection
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        threshold: 0.7, // Consider visible when 70% of the story is in view
      },
    )

    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Ensure pages are properly centered after any scroll
  const centerCurrentPage = () => {
    if (!pagesContainerRef.current) return

    const container = pagesContainerRef.current

    // Set transitioning state to prevent multiple updates
    setIsTransitioning(true)

    // Snap to the nearest page based on reading mode
    if (readingMode === "page") {
      // In page mode, pages are arranged horizontally
      const pageWidth = container.clientWidth
      const targetScrollPosition = pageWidth * currentPage

      container.scrollTo({
        left: targetScrollPosition,
        behavior: "smooth",
      })
    } else {
      // In scroll mode, pages are arranged vertically
      const pageHeight = container.clientHeight
      const targetScrollPosition = pageHeight * currentPage

      container.scrollTo({
        top: targetScrollPosition,
        behavior: "smooth",
      })
    }

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  // Handle page changes
  const handlePageChange = (index: number) => {
    if (index >= 0 && index < story.pages.length && !isTransitioning) {
      // Update current page immediately for UI feedback
      setCurrentPage(index)
      setIsTransitioning(true)

      // Scroll to the selected page based on reading mode
      if (pagesContainerRef.current) {
        if (readingMode === "page") {
          // In page mode, pages are arranged horizontally
          const pageWidth = pagesContainerRef.current.clientWidth
          pagesContainerRef.current.scrollTo({
            left: pageWidth * index,
            behavior: "smooth",
          })
        } else {
          // In scroll mode, pages are arranged vertically
          const pageHeight = pagesContainerRef.current.clientHeight
          pagesContainerRef.current.scrollTo({
            top: pageHeight * index,
            behavior: "smooth",
          })
        }

        // Reset transitioning state after animation completes
        setTimeout(() => {
          setIsTransitioning(false)
        }, 300)
      }
    }
  }

  // Update current page based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!pagesContainerRef.current || isTransitioning) return

      if (readingMode === "page") {
        // In page mode, pages are arranged horizontally
        const scrollLeft = pagesContainerRef.current.scrollLeft
        const pageWidth = pagesContainerRef.current.clientWidth
        const newPage = Math.round(scrollLeft / pageWidth)

        if (newPage !== currentPage && newPage >= 0 && newPage < story.pages.length) {
          setCurrentPage(newPage)
        }
      } else {
        // In scroll mode, pages are arranged vertically
        const scrollTop = pagesContainerRef.current.scrollTop
        const pageHeight = pagesContainerRef.current.clientHeight
        const newPage = Math.round(scrollTop / pageHeight)

        if (newPage !== currentPage && newPage >= 0 && newPage < story.pages.length) {
          setCurrentPage(newPage)
        }
      }
    }

    const handleScrollEnd = () => {
      if (isTransitioning) return
      centerCurrentPage()
    }

    const container = pagesContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      container.addEventListener("touchend", handleScrollEnd)

      return () => {
        container.removeEventListener("scroll", handleScroll)
        container.removeEventListener("touchend", handleScrollEnd)
      }
    }
  }, [currentPage, story.pages.length, isTransitioning, readingMode])

  // Ensure pages are centered after any resize
  useEffect(() => {
    const handleResize = () => {
      centerCurrentPage()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentPage, readingMode])

  const toggleLike = () => {
    if (!user) {
      openModal()
      return
    }
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const toggleBookmark = () => {
    if (!user) {
      openModal()
      return
    }
    setIsBookmarked(!isBookmarked)
  }

  const toggleComments = () => {
    if (!user) {
      openModal()
      return
    }
    setShowComments(!showComments)
  }

  const viewAuthorProfile = () => {
    if (!user) {
      openModal()
      return
    }
    // Navigate to author profile or show author details
    console.log("View author profile:", story.author.name)
  }

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K"
    }
    return count.toString()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now()
    setTouchStartTime(now)
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)

    // Handle pinch detection
    if (e.touches.length === 2) {
      const dist = getPinchDistance(e)
      setInitialPinchDistance(dist)
    }

    // Handle double tap detection
    if (now - lastTapTime < 300) {
      // Double tap detected
      toggleSidebar()
      e.preventDefault()
    }
    setLastTapTime(now)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Handle pinch gesture
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getPinchDistance(e)
      const pinchChange = currentDistance - initialPinchDistance

      // If pinch out (zoom in) is detected
      if (pinchChange > 50) {
        toggleSidebar()
        setInitialPinchDistance(null)
        e.preventDefault()
      }
      // If pinch in (zoom out) is detected
      else if (pinchChange < -50) {
        toggleSidebar()
        setInitialPinchDistance(null)
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setInitialPinchDistance(null)

    // Implement faster swipe detection based on reading mode
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      if (readingMode === "page") {
        // In page mode, horizontal swipe changes pages
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0 && currentPage > 0) {
            // Swipe right - go to previous page
            handlePageChange(currentPage - 1)
          } else if (deltaX < 0 && currentPage < story.pages.length - 1) {
            // Swipe left - go to next page
            handlePageChange(currentPage + 1)
          } else {
            // If we can't change page, ensure current page is centered
            centerCurrentPage()
          }
        } else {
          // Small swipe - ensure current page is centered
          centerCurrentPage()
        }
      } else {
        // In scroll mode, vertical swipe changes pages
        if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY > 0 && currentPage > 0) {
            // Swipe down - go to previous page
            handlePageChange(currentPage - 1)
          } else if (deltaY < 0 && currentPage < story.pages.length - 1) {
            // Swipe up - go to next page
            handlePageChange(currentPage + 1)
          } else {
            // If we can't change page, ensure current page is centered
            centerCurrentPage()
          }
        } else {
          // Small swipe - ensure current page is centered
          centerCurrentPage()
        }
      }
    }
  }

  // Helper function to calculate distance between two touch points
  const getPinchDistance = (e: React.TouchEvent) => {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
  }

  // Calculate pagination size based on story length
  const getPaginationSize = () => {
    const pageCount = story.pages.length
    if (pageCount <= 3) return "w-3 h-3" // Default size
    if (pageCount <= 5) return "w-2.5 h-2.5" // Slightly smaller
    if (pageCount <= 8) return "w-2 h-2" // Even smaller
    return "w-1.5 h-1.5" // Smallest size for many pages
  }

  return (
    <div
      ref={containerRef}
      className="story-container relative flex flex-col h-full w-full overflow-hidden"
      style={{ height: containerHeight }}
    >
      {/* Story content area */}
      <div
        ref={pagesContainerRef}
        className={`pages-container flex-1 ${
          readingMode === "page"
            ? "flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
            : "flex flex-col overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        } scrollbar-hide`}
        style={{
          scrollSnapType: readingMode === "page" ? "x mandatory" : "y mandatory",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {story.pages.map((page, index) => (
          <div
            key={index}
            className={`story-page ${
              readingMode === "page"
                ? "min-w-full w-full h-full snap-start snap-always"
                : "min-h-full h-full w-full snap-start snap-always"
            } p-4 md:p-6 lg:p-8 overflow-y-auto`}
          >
            <div
              ref={index === currentPage ? contentRef : null}
              className="story-content max-w-2xl mx-auto"
            >
              {index === 0 && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 text-highlight dark:text-highlight">
                    {story.title}
                  </h1>

                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-highlight/20 flex items-center justify-center text-highlight">
                      {story.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{story.author.name}</div>
                      <div className="text-xs text-ink-light dark:text-ink-light flex items-center gap-1">
                        <span>{story.readTime}</span>
                        <span className="inline-block w-1 h-1 rounded-full bg-ink-light dark:bg-ink-light mx-1"></span>
                        <span>{new Date(story.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {page.type === "text" && (
                <div className="space-y-4">
                  {page.content.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}

              {page.type === "image" && page.image && (
                <div className="my-4">
                  <img
                    src={page.image}
                    alt={page.imageAlt || "Story image"}
                    className="w-full h-auto rounded-lg"
                  />
                  {page.content.map((caption, idx) => (
                    <p key={idx} className="text-sm text-center mt-2 text-ink-light dark:text-ink-light">
                      {caption}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed action buttons - always visible and positioned over content */}
      <div className="action-buttons fixed bottom-16 md:bottom-8 right-4 md:right-8 z-20 flex flex-col gap-3">
        <button
          onClick={toggleLike}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
            isLiked
              ? "bg-red-500 text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={toggleComments}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
            showComments
              ? "bg-highlight text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          }`}
        >
          <MessageCircle className={`h-5 w-5 ${showComments ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={toggleBookmark}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
            isBookmarked
              ? "bg-highlight text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          }`}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={() => console.log("Share button clicked")}
          className="action-button w-10 h-10 rounded-full flex items-center justify-center bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 transition-all shadow-md"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Fixed pagination controls */}
      <div className="pagination-controls fixed inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-2 md:px-4">
        {currentPage > 0 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="pagination-button w-10 h-10 rounded-full flex items-center justify-center bg-paper/80 dark:bg-paper-dark/80 text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 transition-all pointer-events-auto shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1"></div>

        {currentPage < story.pages.length - 1 && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="pagination-button w-10 h-10 rounded-full flex items-center justify-center bg-paper/80 dark:bg-paper-dark/80 text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 transition-all pointer-events-auto shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Page indicator */}
      <div className="page-indicator fixed bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-paper/80 dark:bg-paper-dark/80 text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 text-xs shadow-md">
        {currentPage + 1} / {story.pages.length}
      </div>

      {/* Comments section - slides in from the right */}
      <div
        className={`comments-section fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-paper dark:bg-paper-dark border-l border-paper-dark/20 dark:border-paper/20 transition-transform duration-300 ease-in-out z-30 ${
          showComments ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CommentsSection storyId={story.id} onClose={() => setShowComments(false)} />
      </div>

      {/* Reading mode toggle */}
      <button
        onClick={() => console.log("Reading mode toggle clicked")}
        className="reading-mode-toggle fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-paper/80 dark:bg-paper-dark/80 text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 transition-all z-20 shadow-md"
      >
        {readingMode === "page" ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </button>
    </div>
  )
}
