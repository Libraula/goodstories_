"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
  EyeOff,
  PlusCircle,
  Maximize,
  Minimize,
  Volume2,
} from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createClient } from "@/utils/supabase/client"
import { handleAuthAction } from "../lib/supabase"
import { useToast } from "@/hooks/use-toast"

// Add these imports at the top of the file
import AudioPlayer from "./audio-player"
import AudioGenerator from "./audio-generator"

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
  // Initialize all state hooks at the top level
  const [currentPage, setCurrentPage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [showActionIcons, setShowActionIcons] = useState(false)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isStoryLoaded, setIsStoryLoaded] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)
  const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false)
  const [hasStory, setHasStory] = useState(false)
  const [showAudioGenerator, setShowAudioGenerator] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isStoryLoading, setIsStoryLoading] = useState(true)

  // Initialize all refs at the top level
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Initialize all hooks at the top level
  const { readingMode } = useReadingSettings()
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const { toast } = useToast()

  // Constant for transition duration in milliseconds
  const TRANSITION_DURATION = 300

  // Update audioUrl when story changes
  useEffect(() => {
    if (story) {
      setAudioUrl(story.audio_url)
    }
  }, [story])

  // Determine if user is author - must be inside an effect to avoid conditional hook
  const [isAuthor, setIsAuthor] = useState(false)

  useEffect(() => {
    if (user && story) {
      setIsAuthor(user.id === story.author_id)
    } else {
      setIsAuthor(false)
    }
  }, [user, story])

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
    // Disable scrolling on the body when comments are open
    if (showComments) {
      document.body.style.overflow = "hidden"

      // Also disable scrolling on the story feed and pages container
      const storyFeed = document.querySelector(".story-feed")
      const pagesContainer = pagesContainerRef.current

      if (storyFeed) {
        storyFeed.classList.add("overflow-hidden")
      }

      if (pagesContainer) {
        pagesContainer.style.overflow = "hidden"
      }
    } else {
      document.body.style.overflow = isFullScreen ? "hidden" : "auto"

      // Re-enable scrolling
      const storyFeed = document.querySelector(".story-feed")
      const pagesContainer = pagesContainerRef.current

      if (storyFeed) {
        storyFeed.classList.remove("overflow-hidden")
      }

      if (pagesContainer) {
        if (readingMode === "page") {
          pagesContainer.style.overflowX = "auto"
          pagesContainer.style.overflowY = "hidden"
        } else {
          pagesContainer.style.overflowY = "auto"
          pagesContainer.style.overflowX = "hidden"
        }
      }
    }

    return () => {
      document.body.style.overflow = ""

      // Clean up
      const storyFeed = document.querySelector(".story-feed")
      if (storyFeed) {
        storyFeed.classList.remove("overflow-hidden")
      }
    }
  }, [showComments, isFullScreen, readingMode])

  // Update loading state when story changes
  useEffect(() => {
    if (!story) {
      setIsStoryLoading(true)
    } else {
      setIsStoryLoading(false)
      setIsStoryLoaded(true)
      setHasStory(true)
    }
  }, [story])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {}
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Check user interactions with the story
  useEffect(() => {
    // Ensure story exists before proceeding
    let isMounted = true // Add a flag to track component mount status

    const checkUserInteractions = async () => {
      // Check if user is logged in
      if (!user) {
        setIsLiked(false)
        setIsBookmarked(false)
        return
      }

      // Check if story exists and has an ID
      if (!story || !story.id) {
        console.error("Story ID is missing, cannot check interactions.")
        setIsLiked(false)
        setIsBookmarked(false)
        return
      }

      try {
        // Check likes
        const likeUrl = `/api/likes/check?storyId=${story.id}`
        const likeResponse = await fetch(likeUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (likeResponse.ok) {
          const likeData = await likeResponse.json()
          if (isMounted) {
            setIsLiked(likeData.isLiked || false)
          }
        } else {
          console.warn(
            `Error checking like status (${likeResponse.status}) for story ${story.id}:`,
            await likeResponse.text(),
          )
          if (isMounted) {
            setIsLiked(false) // Default to false on error
          }
        }

        // Check bookmarks
        const bookmarkUrl = `/api/bookmarks/check?storyId=${story.id}`
        const bookmarkResponse = await fetch(bookmarkUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json()
          if (isMounted) {
            setIsBookmarked(bookmarkData.isBookmarked || false)
          }
        } else {
          console.warn(
            `Error checking bookmark status (${bookmarkResponse.status}) for story ${story.id}:`,
            await bookmarkResponse.text(),
          )
          if (isMounted) {
            setIsBookmarked(false) // Default to false on error
          }
        }
      } catch (error) {
        // Catch potential TypeError: Failed to fetch or other network errors
        console.error(`Error fetching interactions for story ${story.id}:`, error)
        if (isMounted) {
          setIsLiked(false)
          setIsBookmarked(false)
        }
      } finally {
        if (isMounted) {
          setHasCheckedInteractions(true)
        }
      }
    }

    // Set counts immediately from story prop
    if (story) {
      setLikeCount(story.like_count ?? 0)
      setBookmarkCount(story.bookmark_count ?? 0)
    } else {
      setIsLiked(false)
      setIsBookmarked(false)
      setLikeCount(0)
      setBookmarkCount(0)
    }

    if (hasStory) {
      checkUserInteractions()
    }

    return () => {
      isMounted = false // Set the flag to false when the component unmounts
    }
  }, [story, user, hasStory]) // Dependencies: story and user

  // Update container height on window resize
  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight
      const headerHeight = 60
      const bottomNavHeight = 60
      const availableHeight = viewportHeight - headerHeight - bottomNavHeight - 10
      setContainerHeight(availableHeight)
    }
    updateHeight()
    const handleResize = () => {
      updateHeight()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Observe container visibility
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

  // Handle scrolling to update current page
  useEffect(() => {
    const container = pagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      if (isTransitioning) return
      const dimension = readingMode === "page" ? container.clientWidth : container.clientHeight
      const scrollPosition = readingMode === "page" ? container.scrollLeft : container.scrollTop
      const newPage = Math.round(scrollPosition / dimension)
      if (newPage !== currentPage && newPage >= 0 && story && newPage < story.pages.length) {
        setCurrentPage(newPage)
      }
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [currentPage, story, isTransitioning, readingMode])

  // Update scroll position when reading mode changes
  useEffect(() => {
    const element = pagesContainerRef.current
    if (element && story) {
      const dimension = readingMode === "page" ? element.clientWidth : element.clientHeight
      const position = dimension * currentPage
      element.scrollTo({
        [readingMode === "page" ? "left" : "top"]: position,
        behavior: "auto",
      })
    }
  }, [readingMode, currentPage, story])

  // Function to scroll to a specific page
  const scrollToPage = (index: number) => {
    if (!pagesContainerRef.current || isTransitioning || !story || index < 0 || index >= story.pages.length) return
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

  // Function to toggle like
  const toggleLike = async () => {
    if (!story || !story.id) return
    try {
      await handleAuthAction(async () => {
        const newIsLiked = !isLiked

        // Start animation
        setIsLikeAnimating(true)

        // Optimistic UI update
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

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to like story: ${response.status}`)
            }

            // Show success toast
            toast({
              title: "Story liked!",
              description: "This story has been added to your likes.",
              variant: "default",
            })
          } else {
            const response = await fetch(`/api/likes?storyId=${story.id}`, {
              method: "DELETE",
              credentials: "include",
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to unlike story: ${response.status}`)
            }

            // Show success toast
            toast({
              title: "Like removed",
              description: "This story has been removed from your likes.",
              variant: "default",
            })
          }
        } catch (error) {
          console.error("Error toggling like:", error)

          // Revert optimistic update
          setIsLiked(!newIsLiked)
          setLikeCount((prevCount: number) => (!newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1)))

          // Show error toast
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update like status",
            variant: "destructive",
          })
        } finally {
          // End animation after a delay
          setTimeout(() => {
            setIsLikeAnimating(false)
          }, 600)
        }
      }, openModal)
    } catch (error) {
      console.error("Error in like action:", error)
    }
  }

  // Function to toggle bookmark
  const toggleBookmark = async () => {
    if (!story || !story.id) return
    try {
      await handleAuthAction(async () => {
        const newIsBookmarked = !isBookmarked

        // Start animation
        setIsBookmarkAnimating(true)

        // Optimistic UI update
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

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to bookmark story: ${response.status}`)
            }

            // Show success toast
            toast({
              title: "Story bookmarked!",
              description: "This story has been added to your bookmarks.",
              variant: "default",
            })
          } else {
            const response = await fetch(`/api/bookmarks?storyId=${story.id}`, {
              method: "DELETE",
              credentials: "include",
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to remove bookmark: ${response.status}`)
            }

            // Show success toast
            toast({
              title: "Bookmark removed",
              description: "This story has been removed from your bookmarks.",
              variant: "default",
            })
          }
        } catch (error) {
          console.error("Error toggling bookmark:", error)

          // Revert optimistic update
          setIsBookmarked(!newIsBookmarked)
          setBookmarkCount((prevCount: number) => (!newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1)))

          // Show error toast
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update bookmark status",
            variant: "destructive",
          })
        } finally {
          // End animation after a delay
          setTimeout(() => {
            setIsBookmarkAnimating(false)
          }, 600)
        }
      }, openModal)
    } catch (error) {
      console.error("Error in bookmark action:", error)
    }
  }

  // Function to toggle comments
  const toggleComments = () => {
    if (!user || !story || !story.id) {
      openModal()
      return
    }
    setShowComments(!showComments)
  }

  // Function to toggle action icons
  const toggleActionIcons = () => {
    setShowActionIcons(!showActionIcons)
  }

  // Function to view author profile
  const viewAuthorProfile = () => {
    if (!story?.author?.id) return
    window.location.href = `/profile/${story.author.id}`
  }

  // Function to toggle full screen mode
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev)
  }, [])

  // Function to handle audio playback
  const toggleAudio = useCallback(() => {
    if (audioUrl) {
      setIsAudioPlaying(!isAudioPlaying)
    } else if (isAuthor) {
      // Only show audio generator if user is the author
      setShowAudioGenerator(true)
    } else {
      toast({
        title: "No audio available",
        description: "This story doesn't have an audio version yet.",
        variant: "default",
      })
    }
  }, [audioUrl, isAudioPlaying, isAuthor, toast])

  // Format count for display (e.g., 1000 -> 1K)
  const formatCount = (count: number | undefined | null): string => {
    const safeCount = typeof count === "number" ? count : 0
    if (safeCount >= 1000) {
      return `${(safeCount / 1000).toFixed(1)}K`
    }
    return safeCount.toString()
  }

  // Touch event handlers
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
        else if (deltaX < 0 && story && currentPage < story.pages.length - 1) scrollToPage(currentPage + 1)
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0 && currentPage > 0) scrollToPage(currentPage - 1)
        else if (deltaY < 0 && story && currentPage < story.pages.length - 1) scrollToPage(currentPage + 1)
      }
    }
  }

  const getPinchDistance = (e: React.TouchEvent) =>
    Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY)

  const getPaginationSize = () => {
    if (!story) return "w-3 h-3"
    const pageCount = story.pages.length
    if (pageCount <= 3) return "w-3 h-3"
    if (pageCount <= 5) return "w-2.5 h-2.5"
    if (pageCount <= 8) return "w-2 h-2"
    return "w-1.5 h-1.5"
  }

  // Function to handle when audio is generated
  const handleAudioGenerated = (newAudioUrl: string) => {
    setAudioUrl(newAudioUrl)
    setShowAudioGenerator(false)
    // Start playing the audio
    setIsAudioPlaying(true)
  }

  // Show loading state if story is not loaded
  if (isStoryLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink dark:text-ink-light">Loading story...</p>
        </div>
      </div>
    )
  }

  // Ensure story exists before rendering
  if (!story) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <p className="text-ink dark:text-ink-light">Story not found</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`story-container w-full h-full relative p-0 bg-transparent lg:min-h-auto ${isFullScreen ? "fullscreen-story" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Apply full screen styles conditionally */}
      <div
        className={`story-content flex flex-col relative transition-all duration-300 ease-in-out story-content-fill ${
          isFullScreen
            ? "fixed inset-0 z-[100] bg-paper dark:bg-paper-dark p-0 overflow-y-auto"
            : "h-full w-full bg-paper dark:bg-paper-dark"
        }`}
      >
        {/* Story header with author info - only on first page */}
        {currentPage === 0 && (
          <div
            className={`story-header px-4 py-3 flex items-center justify-between ${isFullScreen ? "sticky top-0 z-[105] bg-paper dark:bg-paper-dark shadow-sm" : "relative border-b border-paper-dark/20 dark:border-paper/20"}`}
          >
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

        {/* Story pages - update to ensure better space utilization */}
        <div
          className={`story-pages ${
            readingMode === "page"
              ? "flex flex-row overflow-x-auto snap-x snap-mandatory"
              : "flex flex-col snap-y snap-mandatory"
          } ${isFullScreen ? "pb-[55px] flex-1" : "flex-1 h-full overflow-y-auto"}`}
          ref={pagesContainerRef}
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: readingMode === "page" ? "x mandatory" : "y mandatory",
          }}
        >
          {story.pages.map((page, index) => (
            <div
              key={index}
              className={`story-page ${
                readingMode === "page" ? "min-w-full snap-center" : "w-full snap-start"
              } p-4 flex flex-col overflow-hidden`}
              style={!isFullScreen ? { height: readingMode === "page" ? `${containerHeight}px` : "auto" } : {}}
            >
              <div className="story-page-content h-full flex flex-col">
                <div
                  ref={index === currentPage ? contentRef : null}
                  className={`story-content-wrapper lg:max-w-3xl lg:mx-auto pt-8 pb-16 flex-1`}
                >
                  {index === 0 && (
                    <h2
                      className={`story-title text-xl md:text-2xl lg:text-3xl mb-3 text-highlight dark:text-highlight font-bold leading-tight ${isFullScreen ? "px-4" : ""}`}
                    >
                      {story.title}
                    </h2>
                  )}
                  {page.type === "text" ? (
                    <div
                      className="story-text leading-relaxed mb-4 text-ink dark:text-ink px-1 wysiwyg-content"
                      style={{
                        fontSize: "var(--story-font-size)",
                        maxHeight: !isFullScreen && readingMode === "page" ? `${containerHeight - 120}px` : "none",
                      }}
                    >
                      {page.content.map((paragraph, pIndex) => (
                        <div key={pIndex} className="mb-4 wysiwyg-paragraph">
                          {/* Use dangerouslySetInnerHTML to render formatted content */}
                          <div
                            dangerouslySetInnerHTML={{
                              __html: paragraph
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
                                .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
                                .replace(/# (.*?)(?:\n|$)/g, '<h1 class="text-2xl font-bold mb-2">$1</h1>') // H1
                                .replace(/## (.*?)(?:\n|$)/g, '<h2 class="text-xl font-bold mb-2">$1</h2>') // H2
                                .replace(
                                  /> (.*?)(?:\n|$)/g,
                                  '<blockquote class="border-l-4 border-highlight pl-4 italic text-ink-light">$1</blockquote>',
                                ) // Quote
                                .replace(/\n/g, "<br>"), // Line breaks
                            }}
                          />
                        </div>
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

      {/* In the JSX, add the audio player if audio is available */}
      {/* Add this after the story content, before the action buttons */}
      {audioUrl && (
        <div className="audio-player-container px-4 py-2 sticky bottom-0 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur-sm border-t border-paper-dark/10 dark:border-paper/10 z-30">
          <AudioPlayer
            audioUrl={audioUrl}
            isPlaying={isAudioPlaying}
            onPlayPause={(playing) => setIsAudioPlaying(playing)}
          />
        </div>
      )}

      {/* Action buttons - update z-index and positioning for fullscreen */}
      <div
        className={`action-buttons fixed ${isFullScreen ? "bottom-20 right-6" : "bottom-36 right-4"} flex flex-col ${isFullScreen ? "gap-4" : "gap-3"} z-[110] transition-all duration-300 ${showActionIcons && isActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={toggleLike}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center relative transition-all shadow-md ${
            isLiked
              ? "bg-highlight text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          } ${isLikeAnimating ? "animate-pulse scale-110" : ""}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""} ${isLikeAnimating ? "animate-ping" : ""}`} />
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
          } ${isBookmarkAnimating ? "animate-pulse scale-110" : ""}`}
        >
          <Bookmark
            className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""} ${isBookmarkAnimating ? "animate-ping" : ""}`}
          />
          <span className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {formatCount(bookmarkCount)}
          </span>
        </button>

        <button
          onClick={() => {
            toast({
              title: "Share",
              description: "Sharing functionality is coming soon!",
              variant: "default",
            })
          }}
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

        {/* Audio Button - Show for all users, but behavior differs */}
        <button
          onClick={toggleAudio}
          className={`action-button w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
            isAudioPlaying
              ? "bg-highlight text-white"
              : "bg-paper dark:bg-paper-dark text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20"
          }`}
          aria-label={audioUrl ? "Play/pause audio" : isAuthor ? "Generate audio" : "No audio available"}
        >
          <Volume2 className="h-5 w-5" />
          {audioUrl && (
            <span className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              ♪
            </span>
          )}
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
                toast({
                  title: "Follow",
                  description: "Following functionality is coming soon!",
                  variant: "default",
                })
              }}
              className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm"
            >
              <PlusCircle className="h-3 w-3" />
            </div>
          </button>
        )}
      </div>

      {/* Eye toggle button - update positioning for fullscreen */}
      {isActive && (
        <button
          className={`reading-mode-toggle fixed ${isFullScreen ? "bottom-[15px] z-[120]" : "bottom-24 z-20"} right-4 w-10 h-10 rounded-full flex items-center justify-center bg-highlight text-white border border-paper-dark/20 dark:border-paper/20 transition-all shadow-md`}
          onClick={toggleActionIcons}
          aria-label={showActionIcons ? "Hide action icons" : "Show action icons"}
        >
          {showActionIcons ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}

      {/* Page indicator - update positioning for fullscreen */}
      {isActive && (
        <div
          className={`page-indicator fixed ${isFullScreen ? "bottom-[15px] z-[120]" : "bottom-24 z-20"} left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-highlight text-white font-bold border border-paper-dark/20 dark:border-paper/20 text-xs shadow-md`}
        >
          {currentPage + 1} / {story.pages.length}
        </div>
      )}

      {/* Comments section - update for a more modern look */}
      {showComments && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${isFullScreen ? "z-[150]" : "z-40"} flex items-end justify-center`}
          onClick={() => setShowComments(false)}
        >
          <div
            className="bg-paper dark:bg-paper-dark w-full sm:w-[600px] max-h-[80vh] rounded-t-xl overflow-hidden comments-section"
            onClick={(e) => e.stopPropagation()}
          >
            <CommentsSection storyId={story.id} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}

      {/* Add this modal for the audio generator - only shown to authors */}
      {showAudioGenerator && isAuthor && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => setShowAudioGenerator(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <AudioGenerator story={story} onAudioGenerated={handleAudioGenerated} />
          </div>
        </div>
      )}
    </div>
  )
}
