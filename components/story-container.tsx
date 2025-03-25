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
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)

  useEffect(() => {
    const pagesContainer = pagesContainerRef.current
    if (!pagesContainer) return

    const handleScroll = () => {
      const scrollPosition = pagesContainer.scrollLeft
      const pageWidth = pagesContainer.clientWidth
      const newCurrentPage = Math.round(scrollPosition / pageWidth)
      setCurrentPage(newCurrentPage)
    }

    pagesContainer.addEventListener("scroll", handleScroll)
    return () => pagesContainer.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToPage = (pageIndex: number) => {
    if (pagesContainerRef.current) {
      pagesContainerRef.current.scrollTo({
        left: pagesContainerRef.current.clientWidth * pageIndex,
        behavior: "smooth",
      })
    }
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked)
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

  const handleTouchEnd = () => {
    setInitialPinchDistance(null)
  }

  // Helper function to calculate distance between two touch points
  const getPinchDistance = (e: React.TouchEvent) => {
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
  }

  return (
    <div
      className="story-container h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] w-full snap-start relative p-0 bg-white dark:bg-paper lg:h-[calc(100%-60px)] lg:min-h-auto lg:pb-[60px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="story-content h-full w-full flex flex-col relative">
        <div
          className="story-pages flex-1 flex overflow-x-auto snap-x snap-mandatory h-[calc(100%-50px)]"
          ref={pagesContainerRef}
        >
          {story.pages.map((page, index) => (
            <div key={index} className="story-page min-w-full snap-start p-5 flex flex-col overflow-hidden">
              <div className="story-page-content flex-1 overflow-y-auto pb-3">
                {index === 0 && (
                  <>
                    <h2 className="story-title text-4xl mb-4 text-highlight dark:text-highlight font-bold leading-tight">
                      {story.title}
                    </h2>
                    <div className="story-author flex items-center gap-3 text-base text-ink-light dark:text-ink-light mb-5 pb-3 border-b border-paper-dark dark:border-paper-dark">
                      <Image
                        src={story.author.avatar || "/placeholder.svg"}
                        alt={story.author.name}
                        width={36}
                        height={36}
                        className="author-avatar-small w-9 h-9 rounded-full object-cover border border-paper-dark dark:border-paper-dark"
                      />
                      <span>By {story.author.name}</span>
                    </div>
                  </>
                )}

                {page.type === "text" ? (
                  <div className="story-text text-xl leading-relaxed mb-5 text-justify text-ink dark:text-ink">
                    {page.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-6">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="screenshot-essay bg-white dark:bg-paper-dark rounded-md p-1 shadow-md my-4">
                      <Image
                        src={page.image || "/placeholder.svg?height=400&width=800"}
                        alt={page.imageAlt || "Essay image"}
                        width={800}
                        height={400}
                        className="rounded aspect-video object-cover"
                      />
                    </div>
                    <div className="story-text text-xl leading-relaxed mb-5 text-justify text-ink dark:text-ink">
                      {page.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-6">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </>
                )}

                {index === story.pages.length - 1 && (
                  <div className="story-meta flex justify-between items-center mt-5 pt-4 border-t border-dashed border-paper-dark dark:border-paper-dark">
                    <div className="story-tags flex flex-wrap gap-2">
                      {story.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="story-tag bg-paper-dark dark:bg-paper py-1.5 px-3.5 rounded-full text-sm text-ink-light dark:text-ink-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="story-time text-base text-ink-light dark:text-ink-light">{story.readTime}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="story-pagination flex justify-center gap-2 py-3 bg-white dark:bg-paper absolute bottom-0 w-full z-10 lg:fixed lg:bottom-[60px] lg:left-[300px] lg:right-0 lg:w-auto">
          {story.pages.map((_, index) => (
            <div
              key={index}
              className={`page-indicator ${currentPage === index ? "bg-highlight dark:bg-highlight w-6 rounded-md" : "bg-paper-dark dark:bg-paper w-2.5 rounded-full"} h-2.5 transition-all duration-300`}
              onClick={() => scrollToPage(index)}
            ></div>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      {showSidebar && (
        <div className="story-sidebar absolute right-4 bottom-[60px] flex flex-col items-center gap-5 lg:right-8 lg:bottom-[80px]">
          <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleLike}>
            <div
              className={`action-icon w-[50px] h-[50px] rounded-full bg-white/70 dark:bg-paper-dark/70 flex justify-center items-center text-xl ${isLiked ? "text-red dark:text-red" : "text-ink dark:text-ink"} mb-1 transition-all duration-300 shadow-md`}
            >
              <Heart className={`${isLiked ? "fill-current" : ""}`} />
            </div>
            <span className="action-count text-sm text-ink-light dark:text-ink-light font-medium">
              {formatCount(likeCount)}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer">
            <div className="action-icon w-[50px] h-[50px] rounded-full bg-white/70 dark:bg-paper-dark/70 flex justify-center items-center text-xl text-ink dark:text-ink mb-1 transition-all duration-300 shadow-md">
              <MessageCircle />
            </div>
            <span className="action-count text-sm text-ink-light dark:text-ink-light font-medium">
              {formatCount(story.commentCount)}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer" onClick={toggleBookmark}>
            <div
              className={`action-icon w-[50px] h-[50px] rounded-full bg-white/70 dark:bg-paper-dark/70 flex justify-center items-center text-xl ${isBookmarked ? "text-bookmark dark:text-bookmark" : "text-ink dark:text-ink"} mb-1 transition-all duration-300 shadow-md`}
            >
              <Bookmark className={`${isBookmarked ? "fill-current" : ""}`} />
            </div>
            <span className="action-count text-sm text-ink-light dark:text-ink-light font-medium">
              {isBookmarked ? "Saved" : "Save"}
            </span>
          </div>

          <div className="action-button flex flex-col items-center cursor-pointer">
            <div className="action-icon w-[50px] h-[50px] rounded-full bg-white/70 dark:bg-paper-dark/70 flex justify-center items-center text-xl text-ink dark:text-ink mb-1 transition-all duration-300 shadow-md">
              <Share2 />
            </div>
            <span className="action-count text-sm text-ink-light dark:text-ink-light font-medium">Share</span>
          </div>

          <div className="author-avatar w-[50px] h-[50px] rounded-full object-cover border-2 border-paper-dark dark:border-paper shadow-md overflow-hidden">
            <Image
              src={story.author.avatar || "/placeholder.svg"}
              alt={story.author.name}
              width={50}
              height={50}
              className="w-full h-full object-cover"
            />
          </div>

          <button onClick={toggleSidebar} className="action-button flex flex-col items-center cursor-pointer mt-2">
            <div className="action-icon w-[50px] h-[50px] rounded-full bg-white/70 dark:bg-paper-dark/70 flex justify-center items-center text-xl text-ink dark:text-ink mb-1 transition-all duration-300 shadow-md">
              <EyeOff className="w-5 h-5" />
            </div>
            <span className="action-count text-sm text-ink-light dark:text-ink-light font-medium">Hide</span>
          </button>
        </div>
      )}

      {!showSidebar && (
        <button
          onClick={toggleSidebar}
          className="absolute right-4 bottom-[60px] p-3 bg-white/70 dark:bg-paper-dark/70 rounded-full shadow-md text-ink dark:text-ink"
        >
          <Eye className="w-5 h-5" />
        </button>
      )}
      <CommentsSection />
    </div>
  )
}

