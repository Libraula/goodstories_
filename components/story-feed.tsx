"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, BookmarkIcon, Home, Compass, PlusCircle, Bell, User } from "lucide-react"
import StoryContainer from "./story-container"
import DiscoverTab from "./discover-tab"
import CreateTab from "./create-tab"
import NotificationsTab from "./notifications-tab"
import ProfileTab from "./profile-tab"
import { useTheme } from "next-themes"
import { ThemeToggle } from "./theme-toggle"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import LoginModal from "./auth-modal"
import Image from "next/image"
import { getStories } from "@/lib/database"
import type { Story } from "@/lib/types"

export default function StoryFeed() {
  const [activeTab, setActiveTab] = useState("homeTab")
  const storyFeedRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const { theme } = useTheme()
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const { readingMode } = useReadingSettings()
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [lastScrollTime, setLastScrollTime] = useState(0)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  const [scrollDirection, setScrollDirection] = useState<"none" | "horizontal" | "vertical">("none")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { user } = useAuth()
  const { isOpen: isLoginModalOpen, openModal, closeModal } = useAuthModal()
  const [loginMessage, setLoginMessage] = useState<string>("")
  const [requestedTab, setRequestedTab] = useState<string | null>(null)
  const userAvatarUrl = user?.user_metadata?.avatar_url || "/placeholder.svg"
  const userDisplayName = user?.user_metadata?.full_name || "User"
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true)
      try {
        const fetchedStories = await getStories(20, 0)
        if (fetchedStories && fetchedStories.length > 0) {
          // Explicitly cast the fetched stories to ensure TypeScript recognizes them as Story[]
          setStories(fetchedStories as Story[])
        }
      } catch (error) {
        console.error("Error fetching stories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Function to navigate to a specific story with smooth scrolling
  const navigateToStory = (index: number) => {
    if (!storyFeedRef.current || index < 0 || index >= stories.length || isTransitioning) return

    setIsTransitioning(true)

    if (readingMode === "page") {
      // In page mode, scroll vertically
      const storyHeight = storyFeedRef.current.clientHeight
      storyFeedRef.current.scrollTo({
        top: storyHeight * index,
        behavior: "smooth",
      })
    } else {
      // In scroll mode, scroll horizontally
      const storyWidth = storyFeedRef.current.clientWidth
      storyFeedRef.current.scrollTo({
        left: storyWidth * index,
        behavior: "smooth",
      })
    }

    setActiveStoryIndex(index)

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // Adjust timing to match scroll animation duration
  }

  // Enhanced scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (!storyFeedRef.current || isTransitioning) return

      const now = Date.now()
      const feedContainer = storyFeedRef.current

      // Determine scroll position and direction
      let currentPosition: number
      let direction: "horizontal" | "vertical"

      if (readingMode === "page") {
        currentPosition = feedContainer.scrollTop
        direction = "vertical"
      } else {
        currentPosition = feedContainer.scrollLeft
        direction = "horizontal"
      }

      // Update scroll direction
      setScrollDirection(direction)

      // Calculate scroll speed and determine if user is actively scrolling
      const timeDelta = now - lastScrollTime
      const positionDelta = Math.abs(currentPosition - lastScrollPosition)

      // If scrolling fast enough, mark as actively scrolling
      if (timeDelta < 150 && positionDelta > 5) {
        setIsScrolling(true)
      }

      // If scrolling has slowed down, snap to nearest story
      if (isScrolling && timeDelta > 150 && positionDelta < 5) {
        setIsScrolling(false)

        // Calculate which story we should snap to
        let newIndex: number

        if (readingMode === "page") {
          const storyHeight = feedContainer.clientHeight
          newIndex = Math.round(currentPosition / storyHeight)
        } else {
          const storyWidth = feedContainer.clientWidth
          newIndex = Math.round(currentPosition / storyWidth)
        }

        // Ensure index is valid
        if (newIndex >= 0 && newIndex < stories.length && newIndex !== activeStoryIndex) {
          // Use smooth scrolling for the snap
          if (readingMode === "page") {
            feedContainer.scrollTo({
              top: newIndex * feedContainer.clientHeight,
              behavior: "smooth",
            })
          } else {
            feedContainer.scrollTo({
              left: newIndex * feedContainer.clientWidth,
              behavior: "smooth",
            })
          }
          setActiveStoryIndex(newIndex)
        }
      }

      // Update last scroll position and time
      setLastScrollPosition(currentPosition)
      setLastScrollTime(now)

      // Update active story index based on current scroll position
      if (readingMode === "page") {
        const storyHeight = feedContainer.clientHeight
        const index = Math.round(feedContainer.scrollTop / storyHeight)

        if (index >= 0 && index < stories.length && index !== activeStoryIndex) {
          setActiveStoryIndex(index)
        }
      } else {
        const storyWidth = feedContainer.clientWidth
        const index = Math.round(feedContainer.scrollLeft / storyWidth)

        if (index >= 0 && index < stories.length && index !== activeStoryIndex) {
          setActiveStoryIndex(index)
        }
      }
    }

    // Add wheel event handler for more precise scroll control with smooth transitions
    const handleWheel = (e: WheelEvent) => {
      if (!storyFeedRef.current || isTransitioning) return

      // Prevent default only if we're handling the scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && readingMode === "page") {
        // Vertical scrolling in page mode - navigate between stories
        if (e.deltaY > 0 && activeStoryIndex < stories.length - 1) {
          // Scroll down - next story
          e.preventDefault()
          navigateToStory(activeStoryIndex + 1)
        } else if (e.deltaY < 0 && activeStoryIndex > 0) {
          // Scroll up - previous story
          e.preventDefault()
          navigateToStory(activeStoryIndex - 1)
        }
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && readingMode === "scroll") {
        // Horizontal scrolling in scroll mode - navigate between stories
        if (e.deltaX > 0 && activeStoryIndex < stories.length - 1) {
          // Scroll right - next story
          e.preventDefault()
          navigateToStory(activeStoryIndex + 1)
        } else if (e.deltaX < 0 && activeStoryIndex > 0) {
          // Scroll left - previous story
          e.preventDefault()
          navigateToStory(activeStoryIndex - 1)
        }
      }
    }

    const feedContainer = storyFeedRef.current
    if (feedContainer) {
      feedContainer.addEventListener("scroll", handleScroll, { passive: true })
      feedContainer.addEventListener("wheel", handleWheel, { passive: false })

      return () => {
        feedContainer.removeEventListener("scroll", handleScroll)
        feedContainer.removeEventListener("wheel", handleWheel)
      }
    }
  }, [activeStoryIndex, readingMode, isScrolling, lastScrollTime, lastScrollPosition, stories.length, isTransitioning])

  const handleTabChange = (tabId: string) => {
    // Allow navigation to any tab without showing login modal
    setActiveTab(tabId)
  }

  // Handle login modal close
  const handleLoginModalClose = () => {
    closeModal()
    setLoginMessage("")
    setRequestedTab(null)
  }

  // Effect to change tab after successful login
  useEffect(() => {
    if (user && requestedTab) {
      setActiveTab(requestedTab)
      setRequestedTab(null)
      setLoginMessage("")
      closeModal()
    }
  }, [user, requestedTab, closeModal])

  // Handle touch events for story navigation with smooth transitions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!storyFeedRef.current || e.changedTouches.length === 0 || isTransitioning) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // Determine if this is a significant swipe
    const isSignificantSwipe = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50

    if (!isSignificantSwipe) return

    if (readingMode === "page") {
      // In page mode, vertical swipe navigates between stories
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0 && activeStoryIndex > 0) {
          // Swipe down - go to previous story
          navigateToStory(activeStoryIndex - 1)
        } else if (deltaY < 0 && activeStoryIndex < stories.length - 1) {
          // Swipe up - go to next story
          navigateToStory(activeStoryIndex + 1)
        }
      }
    } else {
      // In scroll mode, horizontal swipe navigates between stories
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && activeStoryIndex > 0) {
          // Swipe right - go to previous story
          navigateToStory(activeStoryIndex - 1)
        } else if (deltaX < 0 && activeStoryIndex < stories.length - 1) {
          // Swipe left - go to next story
          navigateToStory(activeStoryIndex + 1)
        }
      }
    }
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "homeTab" || isTransitioning) return

      if (readingMode === "page") {
        // In page mode, up/down arrows navigate between stories
        if (e.key === "ArrowUp" && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
        } else if (e.key === "ArrowDown" && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
        }
      } else {
        // In scroll mode, left/right arrows navigate between stories
        if (e.key === "ArrowLeft" && activeStoryIndex > 0) {
          navigateToStory(activeStoryIndex - 1)
        } else if (e.key === "ArrowRight" && activeStoryIndex < stories.length - 1) {
          navigateToStory(activeStoryIndex + 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeStoryIndex, readingMode, activeTab, stories.length, isTransitioning])

  return (
    <div className="app-container relative w-full h-screen mx-auto overflow-hidden shadow-md bg-paper dark:bg-paper-dark md:h-screen md:w-full md:my-0 md:rounded-none lg:w-full lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[60px_1fr_60px]">
      {/* App Header */}
      <header className="app-header fixed top-0 w-full py-4 px-4 flex justify-between items-center bg-paper dark:bg-paper-dark z-[100] border-b border-paper-dark/20 dark:border-paper/20 lg:static lg:col-span-2">
        <div className="app-title text-2xl font-bold text-highlight dark:text-highlight tracking-wide">GoodStories</div>
        <div className="header-icons flex items-center gap-4">
          <Search className="w-6 h-6 text-ink dark:text-ink-light cursor-pointer" />
          <BookmarkIcon className="w-6 h-6 text-ink dark:text-ink-light cursor-pointer" />
          <ThemeToggle />
          {user && (
            <div
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
              onClick={() => setActiveTab("profileTab")}
            >
              <Image
                src={userAvatarUrl || "/placeholder.svg"}
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {/* Home Tab */}
      <div
        className={`tab-content ${activeTab === "homeTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="homeTab"
      >
        <div
          className={`story-feed h-full w-full ${
            readingMode === "page"
              ? "flex flex-col overflow-y-auto snap-y snap-mandatory"
              : "flex overflow-x-auto snap-x snap-mandatory"
          }`}
          ref={storyFeedRef}
          style={{
            scrollSnapType: readingMode === "page" ? "y mandatory" : "x mandatory",
            scrollBehavior: "smooth",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-ink dark:text-ink-light">Loading stories...</p>
              </div>
            </div>
          ) : stories.length > 0 ? (
            stories.map((story, index) => (
              <div
                key={index}
                className={`story-wrapper ${readingMode === "page" ? "min-h-full snap-start" : "min-w-full snap-center"}`}
              >
                <StoryContainer
                  story={story}
                  showSidebar={showSidebar}
                  toggleSidebar={() => setShowSidebar(!showSidebar)}
                  isActive={index === activeStoryIndex}
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center p-8">
                <h3 className="text-xl font-bold mb-2">No stories found</h3>
                <p className="text-ink-light dark:text-ink-light mb-4">
                  There are no stories available right now. Be the first to create one!
                </p>
                <button 
                  onClick={() => setActiveTab("createTab")}
                  className="px-4 py-2 bg-highlight text-white rounded-full"
                >
                  Create a Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <div className="sidebar hidden lg:block lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 lg:border-r lg:border-paper-dark/20 dark:lg:border-paper/20 lg:p-6 lg:overflow-y-auto bg-paper dark:bg-paper-dark">
          <div className="sidebar-section mb-8">
            <h3 className="text-xl text-highlight dark:text-highlight mb-4 pb-1 border-b border-paper-dark/20 dark:border-paper/20">
              Library
            </h3>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-book text-lg"></i>
              <span>My Stories</span>
            </div>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-bookmark text-lg"></i>
              <span>Bookmarks</span>
            </div>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-history text-lg"></i>
              <span>History</span>
            </div>
          </div>

          <div className="sidebar-section mb-8">
            <h3 className="text-xl text-highlight dark:text-highlight mb-4 pb-1 border-b border-paper-dark/20 dark:border-paper/20">
              Categories
            </h3>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-magic text-lg"></i>
              <span>Fantasy</span>
            </div>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-rocket text-lg"></i>
              <span>Sci-Fi</span>
            </div>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-heart text-lg"></i>
              <span>Romance</span>
            </div>
            <div className="flex items-center gap-3 py-3 cursor-pointer hover:text-highlight">
              <i className="fas fa-ghost text-lg"></i>
              <span>Horror</span>
            </div>
          </div>
        </div>
      )}

      {/* Discover Tab */}
      <div
        className={`tab-content ${activeTab === "discoverTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="discoverTab"
      >
        <DiscoverTab />
      </div>

      {/* Create Tab */}
      <div
        className={`tab-content ${activeTab === "createTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="createTab"
      >
        <CreateTab />
      </div>

      {/* Notifications Tab */}
      <div
        className={`tab-content ${activeTab === "notificationsTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="notificationsTab"
      >
        <NotificationsTab />
      </div>

      {/* Profile Tab */}
      <div
        className={`tab-content ${activeTab === "profileTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="profileTab"
      >
        <ProfileTab isMobile={isMobile} />
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav fixed bottom-0 w-full flex justify-around py-4 bg-paper dark:bg-paper-dark border-t border-paper-dark/20 dark:border-paper/20 z-[100] lg:static lg:col-span-2 lg:row-start-3 lg:row-end-4 lg:flex lg:justify-around">
        <NavItem
          icon={<Home className="w-6 h-6 mb-1" />}
          label="Home"
          isActive={activeTab === "homeTab"}
          onClick={() => handleTabChange("homeTab")}
        />
        <NavItem
          icon={<Compass className="w-6 h-6 mb-1" />}
          label="Discover"
          isActive={activeTab === "discoverTab"}
          onClick={() => handleTabChange("discoverTab")}
        />
        <NavItem
          icon={<PlusCircle className="w-6 h-6 mb-1" />}
          label="Create"
          isActive={activeTab === "createTab"}
          onClick={() => handleTabChange("createTab")}
        />
        <NavItem
          icon={<Bell className="w-6 h-6 mb-1" />}
          label="Notifications"
          isActive={activeTab === "notificationsTab"}
          onClick={() => handleTabChange("notificationsTab")}
        />
        <NavItem
          icon={<User className="w-6 h-6 mb-1" />}
          label="Profile"
          isActive={activeTab === "profileTab"}
          onClick={() => handleTabChange("profileTab")}
        />
      </nav>

      {/* Login Modal - Only show for non-authenticated users */}
      {!user && isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} message={loginMessage} />}
    </div>
  )
}

function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <a
      href="#"
      className={`nav-item flex flex-col items-center ${isActive ? "text-highlight dark:text-highlight" : "text-ink-light dark:text-ink-light"} no-underline text-sm transition-colors duration-300`}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}
