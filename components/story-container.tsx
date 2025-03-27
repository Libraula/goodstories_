"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, Share2, Eye, EyeOff } from "lucide-react"
import type { Story } from "@/lib/types"
import CommentsSection from "./comments-section"
import { useReadingSettings } from "@/contexts/reading-settings-context"

export default function StoryContainer({
  story,
  showSidebar,
  toggleSidebar,
}: { 
  story?: Story; // Make story optional
  showSidebar: boolean; 
  toggleSidebar: () => void 
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(story?.likeCount ?? 0) // Fallback to 0 if undefined
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

  const TRANSITION_DURATION = 400

  // Early return if no story is provided during prerendering
  if (!story) {
    return <div>Loading story...</div> // Or any placeholder
  }

  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight
      const headerHeight = 60
      const bottomNavHeight = 60
      const availableHeight = viewportHeight - headerHeight - bottomNavHeight - 10
      setContainerHeight(availableHeight)

      if (contentRef.current) {
        setContentHeight(contentRef.current.clientHeight)
      }
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
      { threshold: 0.7 }
    )

    observer.observe(containerRef.current)
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current)
    }
  }, [])

  const scrollToPage = (index: number) => {
    if (!pagesContainerRef.current || isTransitioning || 
        index < 0 || index >= story.pages.length) return;

    setIsTransitioning(true)
    setCurrentPage(index)

    const container = pagesContainerRef.current
    const dimension = readingMode === "page" ? 
      container.clientWidth : container.clientHeight
    const position = dimension * index

    container.scrollTo({
      [readingMode === "page" ? 'left' : 'top']: position,
      behavior: 'smooth'
    })

    setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION)
  }

  useEffect(() => {
    const container = pagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isTransitioning) return

      const dimension = readingMode === "page" ? 
        container.clientWidth : container.clientHeight
      const scrollPosition = readingMode === "page" ? 
        container.scrollLeft : container.scrollTop
      
      const newPage = Math.round(scrollPosition / dimension)
      if (newPage !== currentPage && 
          newPage >= 0 && 
          newPage < story.pages.length) {
        setCurrentPage(newPage)
      }
    }

    const debouncedSnap = debounce(() => {
      if (!isTransitioning) scrollToPage(currentPage)
    }, 100)

    container.addEventListener("scroll", handleScroll)
    container.addEventListener("scroll", debouncedSnap)
    return () => {
      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("scroll", debouncedSnap)
    }
  }, [currentPage, story.pages.length, isTransitioning, readingMode])

  useEffect(() => {
    scrollToPage(currentPage)
  }, [readingMode])

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const toggleBookmark = () => setIsBookmarked(!isBookmarked)
  const toggleComments = () => setShowComments(!showComments)
  const formatCount = (count: number) => 
    count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toString()

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
        if (deltaX > 0) scrollToPage(currentPage - 1)
        else scrollToPage(currentPage + 1)
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) scrollToPage(currentPage - 1)
        else scrollToPage(currentPage + 1)
      }
    }
  }

  const getPinchDistance = (e: React.TouchEvent) => 
    Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    )

  const getPaginationSize = () => {
    const pageCount = story.pages.length
    if (pageCount <= 3) return "w-3 h-3"
    if (pageCount <= 5) return "w-2.5 h-2.5"
    if (pageCount <= 8) return "w-2 h-2"
    return "w-1.5 h-1.5"
  }

  function debounce(func: () => void, wait: number) {
    let timeout: NodeJS.Timeout
    return () => {
      clearTimeout(timeout)
      timeout = setTimeout(func, wait)
    }
  }

  return (
    <div
      ref={containerRef}
      className="story-container w-full h-full relative p-0 bg-white dark:bg-paper lg:min-h-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="story-content h-full w-full flex flex-col relative">
        <div
          className={`story-pages flex-1 ${
            readingMode === "page"
              ? "flex overflow-x-auto snap-x snap-mandatory"
              : "overflow-y-auto snap-y snap-mandatory"
          } h-full`}
          ref={pagesContainerRef}
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: readingMode === "page" ? "x mandatory" : "y mandatory",
            transition: `all ${TRANSITION_DURATION}ms ease-in-out`,
          }}
        >
          {story.pages.map((page, index) => (
            <div
              key={index}
              className={`story-page ${
                readingMode === "page" ? "min-w-full snap-center" : "min-h-full snap-start"
              } p-4 flex flex-col overflow-hidden`}
              style={{ 
                height: readingMode === "page" ? `${containerHeight}px` : 'auto',
                transition: `all ${TRANSITION_DURATION}ms ease-in-out`
              }}
            >
              <div className="story-page-content h-full flex flex-col justify-between">
                <div
                  ref={index === currentPage ? contentRef : null}
                  className="story-content-wrapper overflow-y-auto flex-1"
                >
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
                  <div className="story-meta mt-auto pt-2 border-t border-dashed border-paper-dark dark:border-paper-dark">
                    <div className="story-tags flex flex-wrap gap-2 mb-2">
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

      {isVisible && (
        <>
          {readingMode === "page" && (
            <div className="absolute bottom-[20px] left-1/2 transform -translate-x-1/2 z-30">
              <div className="pagination-container flex gap-2 bg-white/80 dark:bg-paper-dark/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-paper-dark/30 dark:border-paper/30">
                {story.pages.map((_, index) => (
                  <button
                    key={index}
                    className={`${getPaginationSize()} rounded-full transition-all duration-200 cursor-pointer ${
                      currentPage === index
                        ? "bg-highlight dark:bg-highlight scale-110"
                        : "bg-ink-light/50 dark:bg-ink-light/50"
                    }`}
                    onClick={() => scrollToPage(index)}
                    aria-label={`Go to page ${index + 1}`}
                    aria-current={currentPage === index ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
          )}

          {showSidebar && (
            <div className="absolute right-4 bottom-[20px] flex flex-col items-center gap-4 z-30">
              <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleLike}>
                <div
                  className={`action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl ${
                    isLiked ? "text-red dark:text-red" : "text-highlight dark:text-highlight"
                  } mb-1 transition-all duration-300 shadow-md`}
                >
                  <Heart className={`${isLiked ? "fill-current" : ""} w-5 h-5`} />
                </div>
                <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium bg-white/80 dark:bg-paper-dark/80 px-2 py-1 rounded-full">
                  {formatCount(likeCount)}
                </span>
              </div>

              <div className="action-button flex flex-col items-center cursor-pointer mt-4" onClick={toggleComments}>
                <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium bg-white/80 dark:bg-paper-dark/80 px-2 py-1 rounded-full">
                  {formatCount(story.commentCount)}
                </span>
              </div>

              <div className="action-button flex flex-col items-center cursor-pointer mt-4" onClick={toggleBookmark}>
                <div
                  className={`action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl ${
                    isBookmarked ? "text-bookmark dark:text-bookmark" : "text-highlight dark:text-highlight"
                  } mb-1 transition-all duration-300 shadow-md`}
                >
                  <Bookmark className={`${isBookmarked ? "fill-current" : ""} w-5 h-5`} />
                </div>
                <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium bg-white/80 dark:bg-paper-dark/80 px-2 py-1 rounded-full">
                  {isBookmarked ? "Saved" : "Save"}
                </span>
              </div>

              <div className="action-button flex flex-col items-center cursor-pointer mt-4">
                <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium bg-white/80 dark:bg-paper-dark/80 px-2 py-1 rounded-full">
                  Share
                </span>
              </div>

              <div className="author-avatar w-[45px] h-[45px] rounded-full object-cover border-2 border-paper-dark dark:border-paper shadow-md overflow-hidden mt-4">
                <Image
                  src={story.author.avatar || "/placeholder.svg"}
                  alt={story.author.name}
                  width={45}
                  height={45}
                  className="w-full h-full object-cover"
                />
              </div>

              <button onClick={toggleSidebar} className="action-button flex flex-col items-center cursor-pointer mt-4">
                <div className="action-icon w-[45px] h-[45px] rounded-full bg-white/80 dark:bg-paper-dark/80 flex justify-center items-center text-xl text-highlight dark:text-highlight mb-1 transition-all duration-300 shadow-md">
                  <EyeOff className="w-5 h-5" />
                </div>
                <span className="action-count text-xs text-ink-light dark:text-ink-light font-medium bg-white/80 dark:bg-paper-dark/80 px-2 py-1 rounded-full">
                  Hide
                </span>
              </button>
            </div>
          )}

          {!showSidebar && (
            <button
              onClick={toggleSidebar}
              className="absolute right-4 bottom-[20px] p-3 bg-highlight/80 dark:bg-highlight/80 rounded-full shadow-md text-white dark:text-white hover:bg-highlight transition-colors duration-200 z-30"
            >
              <Eye className="w-5 h-5 fill-current" />
            </button>
          )}
        </>
      )}

      <CommentsSection isOpen={showComments} onClose={() => setShowComments(false)} commentCount={story.commentCount} />
    </div>
  )
}