"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, Share2, Eye, EyeOff, PlusCircle, Maximize, Minimize, Volume2 } from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createClient } from "@/utils/supabase/client"
import { handleAuthAction } from "../lib/supabase"

// Use the client-side Supabase client
const supabase = createClient()

export default function StoryContainer({
  story,
  showSidebar,
  toggleSidebar,
  isActive = false,
}: {
  story?: Story
  showSidebar: boolean
  toggleSidebar: () => void
  isActive?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [showActionIcons, setShowActionIcons] = useState(false)
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { readingMode } = useReadingSettings()
  const contentRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const [isStoryLoaded, setIsStoryLoaded] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false) // <-- Add full screen state

  // Constant for transition duration in milliseconds
  const TRANSITION_DURATION = 300

  // Effect to add/remove class to body for hiding nav bars in full screen
  useEffect(() => {
    if (isFullScreen) {
      document.body.classList.add("story-fullscreen-active")
    } else {
      document.body.classList.remove("story-fullscreen-active")
    }
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("story-fullscreen-active")
    }
  }, [isFullScreen])

  // Effect to prevent background scroll when comments are open
  useEffect(() => {
    const storyFeedElement = document.querySelector(".story-feed") // Or a more specific parent if needed

    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    if (showComments && storyFeedElement) {
      // Disable scroll on the underlying feed
      storyFeedElement.addEventListener("wheel", preventScroll, { passive: false })
      storyFeedElement.addEventListener("touchmove", preventScroll, { passive: false })
    } else if (storyFeedElement) {
      // Re-enable scroll
      storyFeedElement.removeEventListener("wheel", preventScroll)
      storyFeedElement.removeEventListener("touchmove", preventScroll)
    }

    // Cleanup function
    return () => {
      if (storyFeedElement) {
        storyFeedElement.removeEventListener("wheel", preventScroll)
        storyFeedElement.removeEventListener("touchmove", preventScroll)
      }
    }
  }, [showComments]) // Re-run effect when showComments changes

  if (!story) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink dark:text-ink-light">Loading story...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleResize = () => {}
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setIsStoryLoaded(!!story)
  }, [story])

  useEffect(() => {
    if (!story) {
      setIsLiked(false)
      setIsBookmarked(false)
      setLikeCount(0)
      setBookmarkCount(0)
      return
    }

    const checkUserInteractions = async () => {
      if (!user) {
        setIsLiked(false)
        setIsBookmarked(false)
        return
      }

      try {
        const likeResponse = await fetch(`/api/likes/check?storyId=${story.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (likeResponse.ok) {
          const likeData = await likeResponse.json()
          setIsLiked(likeData.isLiked || false)
        } else {
          console.warn("Error checking like status:", await likeResponse.text())
          setIsLiked(false)
        }

        const bookmarkResponse = await fetch(`/api/bookmarks/check?storyId=${story.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json()
          setIsBookmarked(bookmarkData.isBookmarked || false)
        } else {
          console.warn("Error checking bookmark status:", await bookmarkResponse.text())
          setIsBookmarked(false)
        }
      } catch (error) {
        console.error("Error checking user interactions:", error)
        setIsLiked(false)
        setIsBookmarked(false)
      }
    }

    checkUserInteractions()
    setLikeCount(story.like_count ?? 0)
    setBookmarkCount(story.bookmark_count ?? 0)
  }, [story, user])

  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight
      const headerHeight = 60
      const bottomNavHeight = 60
      const availableHeight = viewportHeight - headerHeight - bottomNavHeight - 10
      setContainerHeight(availableHeight)
    }
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      { threshold: 0.7 },
    )
    observer.observe(containerRef.current)
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current)
    }
  }, [])

  const scrollToPage = (index: number) => {
    if (!pagesContainerRef.current || isTransitioning || index < 0 || index >= story.pages.length) return
    setIsTransitioning(true)
    setCurrentPage(index)
    const container = pagesContainerRef.current
    const dimension = readingMode === "page" ? container.clientWidth : container.clientHeight
    const position = dimension * index
    container.scrollTo({
      [readingMode === "page" ? "left" : "top"]: position,
      behavior: "auto",
    })
    setTimeout(() => {
      setIsTransitioning(false)
    }, TRANSITION_DURATION)
  }

  useEffect(() => {
    const container = pagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      if (isTransitioning) return
      const dimension = readingMode === "page" ? container.clientWidth : container.clientHeight
      const scrollPosition = readingMode === "page" ? container.scrollLeft : container.scrollTop
      const newPage = Math.round(scrollPosition / dimension)
      if (newPage !== currentPage && newPage >= 0 && newPage < story.pages.length) {
        setCurrentPage(newPage)
        // No need to call scrollToPage here, scroll event handles index update
      }
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [currentPage, story.pages.length, isTransitioning, readingMode]) // Removed scrollToPage dependency

  useEffect(() => {
    // Initial scroll positioning
    const element = pagesContainerRef.current;
    if (element) {
        const dimension = readingMode === "page" ? element.clientWidth : element.clientHeight;
        const position = dimension * currentPage;
        element.scrollTo({
            [readingMode === "page" ? "left" : "top"]: position,
            behavior: "auto",
        });
    }
  }, [readingMode, currentPage]); // Rerun when readingMode or currentPage changes

  const toggleLike = async () => {
    if (!story) return
    try {
      await handleAuthAction(async () => {
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikeCount((prevCount: number) => (newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1)))
        try {
          if (newIsLiked) {
            const response = await fetch("/api/likes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storyId: story.id }),
              credentials: "include",
            })
            if (!response.ok) throw new Error(`Failed to like story: ${response.status}`)
          } else {
            const response = await fetch(`/api/likes?storyId=${story.id}`, {
              method: "DELETE",
              credentials: "include",
            })
            if (!response.ok) throw new Error(`Failed to unlike story: ${response.status}`)
          }
        } catch (error) {
          console.error("Error toggling like:", error)
          setIsLiked(!newIsLiked)
          setLikeCount((prevCount: number) => (!newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1)))
        }
      }, openModal)
    } catch (error) {
      console.error("Error in like action:", error)
    }
  }

  const toggleBookmark = async () => {
    if (!story) return
    try {
      await handleAuthAction(async () => {
        const newIsBookmarked = !isBookmarked
        setIsBookmarked(newIsBookmarked)
        setBookmarkCount((prevCount: number) => (newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1)))
        try {
          if (newIsBookmarked) {
            const response = await fetch("/api/bookmarks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storyId: story.id }),
              credentials: "include",
            })
            if (!response.ok) throw new Error(`Failed to bookmark story: ${response.status}`)
          } else {
            const response = await fetch(`/api/bookmarks?storyId=${story.id}`, {
              method: "DELETE",
              credentials: "include",
            })
            if (!response.ok) throw new Error(`Failed to remove bookmark: ${response.status}`)
          }
        } catch (error) {
          console.error("Error toggling bookmark:", error)
          setIsBookmarked(!newIsBookmarked)
          setBookmarkCount((prevCount: number) => (!newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1)))
        }
      }, openModal)
    } catch (error) {
      console.error("Error in bookmark action:", error)
    }
  }

  const toggleComments = () => {
    if (!user || !story) {
      openModal()
      return
    }
    setShowComments(!showComments)
  }

  const toggleActionIcons = () => {
    setShowActionIcons(!showActionIcons)
  }

  const viewAuthorProfile = () => {
    if (!story?.author?.id) return
    window.location.href = `/profile/${story.author.id}`
  }
    // Function to toggle full screen mode
    const toggleFullScreen = useCallback(() => {
      setIsFullScreen((prev) => !prev)
    }, [])

    // Function to handle audio playback (placeholder)
    const playAudio = useCallback(() => {
      console.log("Play audio for story:", story?.id)
    }, [story])

  // Format count for display (e.g., 1000 -> 1K)
  const formatCount = (count: number | undefined | null): string => {
    const safeCount = typeof count === "number" ? count : 0
    if (safeCount >= 1000) {
      return `${(safeCount / 1000).toFixed(1)}K`
    }
    return safeCount.toString()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now()
    setTouchStartTime(now)
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
    if (e.touches.length === 2) {
      setInitialPinchDistance(getPinchDistance(e))
    }
    if (now - lastTapTime < 300) {
      toggleFullScreen()
      e.preventDefault()
      setLastTapTime(0)
      return
    }
    setLastTapTime(now)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getPinchDistance(e)
      const pinchChange = currentDistance - initialPinchDistance
      const pinchThreshold = 50
      if (pinchChange > pinchThreshold && !isFullScreen) {
        setIsFullScreen(true)
        setInitialPinchDistance(null)
        e.preventDefault()
      } else if (pinchChange < -pinchThreshold && isFullScreen) {
        setIsFullScreen(false)
        setInitialPinchDistance(null)
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setInitialPinchDistance(null)
    if (!e.changedTouches?.length) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const swipeThreshold = 50
    if (readingMode === "page") {
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && currentPage > 0) scrollToPage(currentPage - 1)
        else if (deltaX < 0 && currentPage < story.pages.length - 1) scrollToPage(currentPage + 1)
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0 && currentPage > 0) scrollToPage(currentPage - 1)
        else if (deltaY < 0 && currentPage < story.pages.length - 1) scrollToPage(currentPage + 1)
      }
    }
  }

  const getPinchDistance = (e: React.TouchEvent) =>
    Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)

  const getPaginationSize = () => {
    const pageCount = story.pages.length
    if (pageCount <= 3) return "w-3 h-3"
    if (pageCount <= 5) return "w-2.5 h-2.5"
    if (pageCount <= 8) return "w-2 h-2"
    return "w-1.5 h-1.5"
  }

  return (
    <div
      ref={containerRef}
      className="story-container w-full h-full relative p-0 bg-transparent lg:min-h-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Apply full screen styles conditionally */}
      <div // This outer div becomes the main fullscreen container
        className={`story-content flex flex-col relative transition-all duration-300 ease-in-out ${
          isFullScreen
            ? "fixed inset-0 z-[100] bg-paper dark:bg-paper-dark p-0 overflow-hidden" // Use overflow-hidden as inner div handles scroll
            : "h-full w-full bg-paper dark:bg-paper-dark" // Normal styles
        }`}
      >
        {/* Story header with author info - only on first page */}
        {currentPage === 0 && ( // Show header on first page even in fullscreen
          <div className={`story-header px-4 py-3 flex items-center justify-between ${isFullScreen ? 'absolute top-[5px] left-0 right-0 z-[105] bg-paper dark:bg-paper-dark' : 'relative border-b border-paper-dark/20 dark:border-paper/20'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-paper-dark/20 dark:border-paper/20">
                <Image
                  src={story.author.avatar || "/placeholder.svg"}
                  alt={story.author.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  onClick={viewAuthorProfile}
                />
              </div>
              <div>
                <div className="text-sm font-medium">{story.author.name}</div>
                <div className="text-xs text-ink-light dark:text-ink-light flex items-center gap-1">
                  <span>{story.read_time}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-ink-light dark:bg-ink-light mx-1"></span>
                  <span>{new Date(story.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Story pages */}
        {/* Adjust pages container based on full screen */}
        <div // This becomes the scrollable area in fullscreen
          className={`story-pages ${
            readingMode === "page"
              ? "flex flex-row overflow-x-auto snap-x snap-mandatory" // Keep horizontal scroll for page mode
              : "flex flex-col snap-y snap-mandatory" // Remove overflow-y here for scroll mode
          } ${isFullScreen ? 'absolute top-[57px] bottom-[50px] left-0 right-0 overflow-y-auto z-[101]' : 'flex-1 h-full overflow-y-auto'}`} // Add overflow-y back for normal mode
          ref={pagesContainerRef}
          style={{ // Remove style prop as height is handled by classes now
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: readingMode === "page" ? "x mandatory" : "y mandatory",
          }}
        >
          {story.pages.map((page, index) => (
            <div
              key={index}
              className={`story-page ${
                readingMode === "page" ? "min-w-full snap-center" : "w-full min-h-full snap-start"
              } p-4 flex flex-col overflow-hidden`}
              style={
                !isFullScreen
                  ? {
                      height: readingMode === "page" ? `${containerHeight}px` : "auto",
                    }
                  : {
                      // In full screen, let content determine height, ensure min-height for scroll mode
                      minHeight: readingMode === 'scroll' ? '100vh' : undefined,
                      height: readingMode === 'page' ? '100%' : undefined, // Ensure page takes full height
                      width: readingMode === 'page' ? '100vw' : undefined, // Ensure page takes full width
                    }
              }
            >
              <div className="story-page-content h-full flex flex-col">
                <div ref={index === currentPage ? contentRef : null} className="story-content-wrapper lg:max-w-3xl lg:mx-auto pt-8 pb-16"> {/* Simplified wrapper, width constraint always applied */}
                  {/* Show title always in full screen, only on first page otherwise */}
                  {(index === 0 || isFullScreen) && (
                    <h2 className={`story-title text-xl mb-3 text-highlight dark:text-highlight font-bold leading-tight ${isFullScreen ? 'px-4' : ''}`}>
                      {story.title}
                    </h2>
                  )}

                  {page.type === "text" ? (
                    <div
                      className="story-text leading-relaxed mb-4 text-ink dark:text-ink"
                      style={{
                        fontSize: "var(--story-font-size)",
                        maxHeight: !isFullScreen && readingMode === "page" ? `${containerHeight - 120}px` : "none",
                      }}
                    >
                      {page.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-3 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="my-4">
                        <img
                          src={page.image || "/placeholder.svg"}
                          alt={page.image_alt || "Story image"}
                          className="w-full h-auto rounded-lg"
                        />
                        {page.content.map((caption, idx) => (
                          <p key={idx} className="text-sm text-ink-light dark:text-ink-light mt-2">
                            {caption}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {index === story.pages.length - 1 && (
                  <div className="story-meta mt-auto pt-2 border-t border-dashed border-paper-dark/20 dark:border-paper/20">
                    <div className="story-tags flex flex-wrap gap-2 mb-2">
                      {story.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="story-tag bg-paper-dark/10 dark:bg-paper/10 py-1 px-3 rounded-full text-xs text-ink-light dark:text-ink-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div
        className={`action-buttons fixed bottom-36 right-4 flex flex-col ${isFullScreen ? 'gap-4' : 'gap-3'} z-[110] transition-all duration-300 ${showActionIcons && isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={toggleLike}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center relative transition-all shadow-md ${
            isLiked
              ? "bg-highlight text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          <span className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {formatCount(likeCount)}
          </span>
        </button>

        <button
          onClick={() => setShowComments(true)}
          className="action-button w-10 h-10 rounded-full flex items-center justify-center relative transition-all shadow-md bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
        >
          <MessageCircle className={`h-5 w-5 ${showComments ? "fill-current" : ""}`} />
          <span className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {formatCount(story.comment_count ?? 0)}
          </span>
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
          <span className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {formatCount(bookmarkCount)}
          </span>
        </button>

        <button
          onClick={() => console.log("Share story")}
          className="action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Full Screen Toggle Button */}
        <button
          onClick={toggleFullScreen}
          className="action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        {/* Play Audio Button */}
        <button
          onClick={playAudio}
          className="action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          aria-label="Play story audio"
        >
          <Volume2 className="h-5 w-5" />
        </button>

        {/* Author Profile Button (only if not full screen) */}
        {!isFullScreen && (
          <button
            onClick={viewAuthorProfile}
            className="action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 overflow-hidden relative"
          >
            <Image
              src={story.author.avatar || "/placeholder.svg"}
              alt={story.author.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
            <div
              onClick={(e) => {
                e.stopPropagation()
                console.log("Follow author:", story.author.name)
              }}
              className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm"
            >
              <PlusCircle className="h-3 w-3" />
            </div>
          </button>
        )}
      </div>

      {/* Eye toggle button */}
      {isActive && ( // Reverted condition: Show only when active
        <button
          className={`reading-mode-toggle fixed ${isFullScreen ? 'bottom-[5px] z-[120]' : 'bottom-24 z-20'} right-4 w-10 h-10 rounded-full flex items-center justify-center bg-highlight text-white border border-paper-dark/20 dark:border-paper/20 transition-all shadow-md`}
          onClick={toggleActionIcons}
          aria-label={showActionIcons ? "Hide action icons" : "Show action icons"}
        >
          {showActionIcons ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}

      {/* Page indicator */}
      {isActive && (
          <div className={`page-indicator fixed ${isFullScreen ? 'bottom-[5px] z-[120]' : 'bottom-24 z-20'} left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-highlight text-white font-bold border border-paper-dark/20 dark:border-paper/20 text-xs shadow-md`}> {/* Increased fullscreen z-index */}
            {currentPage + 1} / {story.pages.length}
          </div>
        )}
      {/* Comments section */}
      {showComments && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center"
          onClick={() => setShowComments(false)}
        >
          <div
            className="bg-paper dark:bg-paper-dark w-full sm:w-[600px] max-h-[80vh] rounded-t-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CommentsSection storyId={story.id} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
