"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, Share2, Eye, EyeOff } from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"

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
  const [isTransitioning, setIsTransitioning] = useState(false)

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
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Ensure pages are properly centered after any scroll
  const centerCurrentPage = () => {
    if (!pagesContainerRef.current) return

    const container = pagesContainerRef.current
    const pageWidth = container.clientWidth

    // Set transitioning state to prevent multiple updates
    setIsTransitioning(true)

    // Snap to the nearest page
    const targetScrollPosition = pageWidth * currentPage

    container.scrollTo({
      left: targetScrollPosition,
      behavior: "auto",
    })

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 100)
  }

  // Handle page changes
  const handlePageChange = (index: number) => {
    if (index >= 0 && index < story.pages.length && !isTransitioning) {
      // Update current page immediately for UI feedback
      setCurrentPage(index)
      setIsTransitioning(true)

      // Scroll to the selected page
      if (pagesContainerRef.current) {
        const pageWidth = pagesContainerRef.current.clientWidth
        pagesContainerRef.current.scrollTo({
          left: pageWidth * index,
          behavior: "auto",
        })

        // Reset transitioning state after animation completes
        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }
    }
  }

  // Update current page based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!pagesContainerRef.current || isTransitioning) return

      const scrollLeft = pagesContainerRef.current.scrollLeft
      const pageWidth = pagesContainerRef.current.clientWidth
      const newPage = Math.round(scrollLeft / pageWidth)

      if (newPage !== currentPage && newPage >= 0 && newPage < story.pages.length) {
        setCurrentPage(newPage)
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
  }, [currentPage, story.pages.length, isTransitioning])

  // Ensure pages are centered after any resize
  useEffect(() => {
    const handleResize = () => {
      centerCurrentPage()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentPage])

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const toggleComments = () => {
    setShowComments(!showComments)
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

    // Implement faster swipe detection
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX

      // If swipe distance is significant
      if (Math.abs(deltaX) > 50) {
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
    }
  }

  // Helper function to calculate distance between two touch points
  const getPinchDistance = (e: React.TouchEvent) => {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
  }

  return (
    <div
      className="story-container w-full snap-start relative p-0 bg-white dark:bg-paper lg:min-h-auto"
      style={{ height: `${containerHeight}px` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="story-content h-full w-full flex flex-col relative">
        {/* Story Pages Container */}
        <div
          className="story-pages flex-1 flex overflow-x-auto snap-x snap-mandatory h-full"
          ref={pagesContainerRef}
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          {story.pages.map((page, index) => (
            <div
              key={index}
              className="story-page min-w-full snap-center p-4 flex flex-col overflow-hidden"
              style={{ height: `${containerHeight}px` }}
            >
              <div className="story-page-content h-full flex flex-col justify-between">
                <div className="story-content-wrapper overflow-y-auto flex-1">
                  {index === 0 && (
                    <>
                      <h2 className="story-title text-xl mb-3 text-highlight dark:text-highlight font-bold leading-tight">
                        {story.title}
                      </h2>
                      <div className="story-author flex items-center gap-3 text-sm text-ink-light dark:text-ink-light mb-4 pb-2 border-b border-paper-dark dark:border-paper-dark">
                        <Image
                          src={story.author.avatar || "/placeholder.svg"}
                          alt={story.author.name}
                          width={36}
                          height={36}
                          className="author-avatar-small w-8 h-8 rounded-full object-cover border border-paper-dark dark:border-paper-dark"
                        />
                        <span>By {story.author.name}</span>
                      </div>
                    </>
                  )}

                  {page.type === "text" ? (
                    <div
                      className="story-text leading-relaxed mb-4 text-justify text-ink dark:text-ink"
                      style={{ fontSize: "var(--story-font-size)" }}
                    >
                      {page.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="screenshot-essay bg-white dark:bg-paper-dark rounded-md p-1 shadow-md my-3">
                        <Image
                          src={page.image || "/placeholder.svg?height=400&width=800"}
                          alt={page.imageAlt || "Essay image"}
                          width={800}
                          height={400}
                          className="rounded aspect-video object-cover responsive-image"
                          priority={index === currentPage || index === currentPage + 1}
                        />
                      </div>
                      <div
                        className="story-text leading-relaxed mb-4 text-justify text-ink dark:text-ink"
                        style={{ fontSize: "var(--story-font-size)" }}
                      >
                        {page.content.map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-4">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {index === story.pages.length - 1 && (
                  <div className="story-meta flex justify-between items-center mt-3 pt-2 border-t border-dashed border-paper-dark dark:border-paper-dark">
                    <div className="story-tags flex flex-wrap gap-2">
                      {story.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="story-tag bg-paper-dark dark:bg-paper py-1 px-3 rounded-full text-xs text-ink-light dark:text-ink-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="story-time text-sm text-ink-light dark:text-ink-light">{story.readTime}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls - Aligned with action icons */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-[80px] z-30 lg:absolute">
        <div className="pagination-container flex items-center justify-center gap-2 py-2 px-4 bg-white/80 dark:bg-paper-dark/80 backdrop-blur-sm rounded-full shadow-md border border-paper-dark/30 dark:border-paper/30">
          {story.pages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${
                currentPage === index
                  ? "bg-highlight dark:bg-highlight scale-110"
                  : "bg-ink-light/50 dark:bg-ink-light/50"
              }`}
              onClick={() => handlePageChange(index)}
              aria-label={`Go to page ${index + 1}`}
              aria-current={currentPage === index ? "true" : "false"}
            />
          ))}
        </div>
      </div>

      {/* Action Icons */}
      {showSidebar && (
        <div className="story-sidebar fixed right-4 bottom-[80px] flex flex-col items-center gap-4 z-30 lg:absolute">
          <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleLike}>
            <div
              className={`action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl ${isLiked ? "text-red dark:text-red" : "text-highlight dark:text-highlight"} mb-1 transition-all duration-300 shadow-md`}
            >
              <Heart className={`${isLiked ? "fill-current" : ""} w-5 h-5`} />
            </div>
            <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium">
              {formatCount(likeCount)}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleComments}>
            <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium">
              {formatCount(story.commentCount)}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleBookmark}>
            <div
              className={`action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl ${isBookmarked ? "text-bookmark dark:text-bookmark" : "text-highlight dark:text-highlight"} mb-1 transition-all duration-300 shadow-md`}
            >
              <Bookmark className={`${isBookmarked ? "fill-current" : ""} w-5 h-5`} />
            </div>
            <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium">
              {isBookmarked ? "Saved" : "Save"}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer">
            <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium">Share</span>
          </div>

          <div className="author-avatar w-[45px] h-[45px] rounded-full object-cover border-2 border-paper-dark dark:border-paper shadow-md overflow-hidden">
            <Image
              src={story.author.avatar || "/placeholder.svg"}
              alt={story.author.name}
              width={45}
              height={45}
              className="w-full h-full object-cover"
            />
          </div>

          <button onClick={toggleSidebar} className="action-button flex flex-col items-center cursor-pointer mt-1">
            <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
              <EyeOff className="w-5 h-5" />
            </div>
            <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium">Hide</span>
          </button>
        </div>
      )}

      {!showSidebar && (
        <button
          onClick={toggleSidebar}
          className="fixed right-4 bottom-[80px] p-3 bg-highlight/80 dark:bg-highlight/80 rounded-full shadow-md text-white dark:text-white hover:bg-highlight transition-colors duration-200 z-30 lg:absolute"
        >
          <Eye className="w-5 h-5" />
        </button>
      )}

      {/* Comments Modal */}
      <CommentsSection isOpen={showComments} onClose={() => setShowComments(false)} commentCount={story.commentCount} />
    </div>
  )
}

