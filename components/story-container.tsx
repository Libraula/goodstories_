"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, Share2, Eye, EyeOff, PlusCircle, User, ChevronLeft, ChevronRight } from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';
import { isUserLoggedIn, handleAuthAction } from '../lib/supabase';

// Use the client-side Supabase client
const supabase = createClient();

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
  const [likeCount, setLikeCount] = useState(story?.like_count ?? 0)
  const [bookmarkCount, setBookmarkCount] = useState(story?.bookmark_count ?? 0)
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

  // Constant for transition duration in milliseconds
  const TRANSITION_DURATION = 300

  // Effect to prevent background scroll when comments are open
  useEffect(() => {
    const storyFeedElement = document.querySelector('.story-feed'); // Or a more specific parent if needed

    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (showComments && storyFeedElement) {
      // Disable scroll on the underlying feed
      storyFeedElement.addEventListener('wheel', preventScroll, { passive: false });
      storyFeedElement.addEventListener('touchmove', preventScroll, { passive: false });
      // Optionally add a class to body or container if needed for visual cues or further styling
      // document.body.classList.add('comments-open');
    } else if (storyFeedElement) {
      // Re-enable scroll
      storyFeedElement.removeEventListener('wheel', preventScroll);
      storyFeedElement.removeEventListener('touchmove', preventScroll);
      // document.body.classList.remove('comments-open');
    }

    // Cleanup function
    return () => {
      if (storyFeedElement) {
        storyFeedElement.removeEventListener('wheel', preventScroll);
        storyFeedElement.removeEventListener('touchmove', preventScroll);
        // document.body.classList.remove('comments-open'); // Ensure cleanup on unmount
      }
    };
  }, [showComments]); // Re-run effect when showComments changes

  if (!story) {
    return <div className="flex items-center justify-center w-full h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ink dark:text-ink-light">Loading story...</p>
      </div>
    </div>
  }

  useEffect(() => {
    const handleResize = () => {
      // Removed setIsMobile since it's not used anywhere
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (story) {
      setIsStoryLoaded(true)
    } else {
      setIsStoryLoaded(false)
    }
  }, [story])

  useEffect(() => {
    if (!story) return;

    const checkUserInteractions = async () => {
      if (!user) {
        // If user is not authenticated, set default values
        setIsLiked(false);
        setIsBookmarked(false);
        return;
      }

      try {
        // Check if the user has liked the story - use API route instead of direct Supabase call
        const likeResponse = await fetch(`/api/likes/check?storyId=${story.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.isLiked || false);
        } else {
          console.warn('Error checking like status:', await likeResponse.text());
          setIsLiked(false);
        }

        // Check if the user has bookmarked the story - use API route instead of direct Supabase call
        const bookmarkResponse = await fetch(`/api/bookmarks/check?storyId=${story.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json();
          setIsBookmarked(bookmarkData.isBookmarked || false);
        } else {
          console.warn('Error checking bookmark status:', await bookmarkResponse.text());
          setIsBookmarked(false);
        }
      } catch (error) {
        console.error('Error checking user interactions:', error);
        setIsLiked(false);
        setIsBookmarked(false);
      }
    };

    checkUserInteractions();
  }, [story, user]);

  // Set initial like count from story data
  useEffect(() => {
    if (story) {
      setLikeCount(story.like_count ?? 0)
      setBookmarkCount(story.bookmark_count ?? 0)
    }
  }, [story])

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
    
    // Set the current page immediately to update UI
    setCurrentPage(index)

    const container = pagesContainerRef.current
    const dimension = readingMode === "page" ? container.clientWidth : container.clientHeight
    const position = dimension * index

    // Scroll immediately without animation
    container.scrollTo({
      [readingMode === "page" ? "left" : "top"]: position,
      behavior: "auto",
    })

    // Keep the transition state active for a realistic amount of time
    // This prevents rapid successive page changes and gives content time to render
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
        scrollToPage(newPage)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [currentPage, story.pages.length, isTransitioning, readingMode])

  useEffect(() => {
    scrollToPage(currentPage)
  }, [readingMode])

  const toggleLike = async () => {
    if (!story) return;

    try {
      await handleAuthAction(async () => {
        // Optimistically update UI
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prevCount: number) => newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1));

        try {
          if (newIsLiked) {
            const response = await fetch('/api/likes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ storyId: story.id }),
              credentials: 'include', // Include cookies for authentication
            });

            if (!response.ok) {
              throw new Error(`Failed to like story: ${response.status}`);
            }
          } else {
            const response = await fetch(`/api/likes?storyId=${story.id}`, {
              method: 'DELETE',
              credentials: 'include', // Include cookies for authentication
            });

            if (!response.ok) {
              throw new Error(`Failed to unlike story: ${response.status}`);
            }
          }
        } catch (error) {
          console.error('Error toggling like:', error);
          // Revert UI changes on error
          setIsLiked(!newIsLiked);
          setLikeCount((prevCount: number) => !newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
        }
      }, openModal);
    } catch (error) {
      console.error('Error in like action:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!story) return;

    try {
      await handleAuthAction(async () => {
        // Optimistically update UI
        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);
        setBookmarkCount((prevCount: number) => newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1));

        try {
          if (newIsBookmarked) {
            const response = await fetch('/api/bookmarks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ storyId: story.id }),
              credentials: 'include', // Include cookies for authentication
            });

            if (!response.ok) {
              throw new Error(`Failed to bookmark story: ${response.status}`);
            }
          } else {
            const response = await fetch(`/api/bookmarks?storyId=${story.id}`, {
              method: 'DELETE',
              credentials: 'include', // Include cookies for authentication
            });

            if (!response.ok) {
              throw new Error(`Failed to remove bookmark: ${response.status}`);
            }
          }
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          // Revert UI changes on error
          setIsBookmarked(!newIsBookmarked);
          setBookmarkCount((prevCount: number) => !newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1));
        }
      }, openModal);
    } catch (error) {
      console.error('Error in bookmark action:', error);
    }
  };

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
    if (!story?.author?.id) return;
    
    // Navigate to author profile page
    window.location.href = `/profile/${story.author.id}`;
  }

  // Format count for display (e.g., 1000 -> 1K)
  const formatCount = (count: number | undefined | null): string => {
    // Ensure count is a valid number
    const safeCount = typeof count === 'number' ? count : 0;
    
    if (safeCount >= 1000) {
      return `${(safeCount / 1000).toFixed(1)}K`;
    }
    return safeCount.toString();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now()
    setTouchStartTime(now)
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)

    if (e.touches.length === 2) {
      setInitialPinchDistance(getPinchDistance(e))
    }

    if (now - lastTapTime < 300) {
      toggleSidebar()
      e.preventDefault()
    }
    setLastTapTime(now)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getPinchDistance(e)
      const pinchChange = currentDistance - initialPinchDistance
      if (Math.abs(pinchChange) > 50) {
        toggleSidebar()
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
      className="story-container w-full h-full relative p-0 bg-paper dark:bg-paper-dark lg:min-h-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="story-content h-full w-full flex flex-col relative">
        {/* Story header with author info - only on first page */}
        {currentPage === 0 && (
          <div className="story-header px-4 py-3 flex items-center justify-between border-b border-paper-dark/20 dark:border-paper/20">
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
        <div
          className={`story-pages flex-1 ${
            readingMode === "page"
              ? "flex flex-row overflow-x-auto snap-x snap-mandatory"
              : "flex flex-col overflow-y-auto snap-y snap-mandatory"
          } h-full`}
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
                readingMode === "page" ? "min-w-full snap-center" : "w-full min-h-full snap-start"
              } p-4 flex flex-col overflow-hidden`}
              style={{
                height: readingMode === "page" ? `${containerHeight}px` : "auto",
              }}
            >
              <div className="story-page-content h-full flex flex-col justify-between">
                <div
                  ref={index === currentPage ? contentRef : null}
                  className="story-content-wrapper overflow-y-auto flex-1"
                >
                  {index === 0 && (
                    <h2 className="story-title text-xl mb-3 text-highlight dark:text-highlight font-bold leading-tight">
                      {story.title}
                    </h2>
                  )}

                  {page.type === "text" ? (
                    <div
                      className="story-text leading-relaxed mb-4 text-ink dark:text-ink"
                      style={{ 
                        fontSize: "var(--story-font-size)",
                        maxHeight: readingMode === "page" ? `${containerHeight - 120}px` : "auto",
                        overflowY: "auto"
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
                          src={page.image}
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
      <div className={`action-buttons fixed bottom-36 right-4 flex flex-col gap-3 z-30 transition-opacity duration-300 ${showActionIcons && isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
              e.stopPropagation();
              console.log("Follow author:", story.author.name);
            }}
            className="absolute -right-1 -top-1 bg-highlight text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm"
          >
            <PlusCircle className="h-3 w-3" />
          </div>
        </button>
      </div>

      {/* Eye toggle button - only visible when story is active */}
      {isActive && (
        <button
          onClick={toggleActionIcons}
          className="reading-mode-toggle fixed bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-highlight text-white border border-paper-dark/20 dark:border-paper/20 transition-all z-20 shadow-md"
        >
          {showActionIcons ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}

      {/* Page indicator - only visible when story is active */}
      {isActive && (
        <div className="page-indicator fixed bottom-24 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-paper/80 dark:bg-paper-dark/80 text-ink dark:text-ink-light border border-paper-dark/20 dark:border-paper/20 text-xs shadow-md">
          {currentPage + 1} / {story.pages.length}
        </div>
      )}
      {/* Comments section - slides in from the bottom */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center" onClick={() => setShowComments(false)}>
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
