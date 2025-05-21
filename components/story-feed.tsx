"use client"

import type React from "react"
import Link from "next/link" // Import Link
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
import { useRouter } from "next/navigation"
// Add the import for SidebarNavItem at the top of the file
import SidebarNavItem from "./sidebar-nav-item"
import { useAudio } from "@/contexts/audio-context"

// At the top of the file, after the imports
// Replace the current useAuth line with this safer implementation
// that provides fallback values when the context isn't available
const useAuthSafe = () => {
  try {
    return useAuth()
  } catch (error) {
    // Return default values if auth context is not available
    return {
      user: null,
      session: null,
      isLoading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    }
  }
}

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
  // Then in the StoryFeed component, replace:
  // const { user } = useAuth()
  // with:
  const { user } = useAuthSafe()
  const { isOpen: isLoginModalOpen, openModal, closeModal } = useAuthModal()
  const [loginMessage, setLoginMessage] = useState<string>("")
  const [requestedTab, setRequestedTab] = useState<string | null>(null)
  const userAvatarUrl = user?.user_metadata?.avatar_url || "/placeholder.svg"
  const userDisplayName = user?.user_metadata?.full_name || "User"
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Make sure the router is initialized
  const router = useRouter()
  // Add audio context
  const { stopAudio } = useAudio()

  // Add a new state for tracking sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Add a function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true)
      try {
        const fetchedStories = await getStories(20, 0)
        if (fetchedStories && fetchedStories.length > 0) {
          // Explicitly cast the fetched stories to ensure TypeScript recognizes them as Story[]
          setStories(fetchedStories as Story[])
        } else {
          console.warn("No stories found or empty array returned")
          setStories([])
        }
      } catch (error) {
        console.error("Error fetching stories:", error)
        setStories([])
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

  // Set home-tab class on mount if activeTab is homeTab
  useEffect(() => {
    if (activeTab === "homeTab") {
      document.body.classList.add('home-tab')
    } else {
      document.body.classList.remove('home-tab')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('home-tab')
    }
  }, [activeTab])

  // Function to navigate to a specific story with smooth scrolling
  const navigateToStory = (index: number) => {
    if (!storyFeedRef.current || index < 0 || index >= stories.length || isTransitioning) return

    setIsTransitioning(true)
    
    // Stop any playing audio when navigating between stories
    stopAudio()

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

  // Function to handle tab switching with authentication check
  const handleTabClick = (tabName: string) => {
    // Check if user is logged in for tabs that require authentication
    if (
      (tabName === "createTab" ||
        tabName === "profileTab" ||
        tabName === "notificationsTab" ||
        tabName === "bookmarksTab") &&
      !user
    ) {
      setLoginMessage(`Please log in to access the ${tabName.replace("Tab", "")} feature`)
      setRequestedTab(tabName)
      openModal()
      return
    }

    // Stop any playing audio when changing tabs
    stopAudio()
    
    setActiveTab(tabName)
    
    // Update body class based on active tab
    if (tabName === "homeTab") {
      document.body.classList.add('home-tab')
    } else {
      document.body.classList.remove('home-tab')
    }

    // Reset scroll position when switching tabs
    if (storyFeedRef.current) {
      if (readingMode === "page") {
        storyFeedRef.current.scrollTop = 0
      } else {
        storyFeedRef.current.scrollLeft = 0
      }
    }

    setActiveStoryIndex(0)
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
          
          // Stop audio when scrolling to a different story
          stopAudio()
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
          
          // Stop audio when changing to a different story
          stopAudio()
        }
      } else {
        const storyWidth = feedContainer.clientWidth
        const index = Math.round(feedContainer.scrollLeft / storyWidth)

        if (index >= 0 && index < stories.length && index !== activeStoryIndex) {
          setActiveStoryIndex(index)
          
          // Stop audio when changing to a different story
          stopAudio()
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
    <div className="app-container relative w-full h-screen mx-auto overflow-hidden shadow-md bg-paper dark:bg-paper-dark md:h-screen md:w-full md:my-0 md:rounded-none lg:w-full lg:grid lg:grid-cols-[auto_1fr] lg:grid-rows-[60px_1fr]">
      {/* Desktop Sidebar - Only visible on large screens */}
      <div
        className={`desktop-sidebar hidden lg:flex lg:flex-col lg:row-span-3 lg:border-r lg:border-paper-dark/20 dark:lg:border-paper/20 lg:bg-paper dark:lg:bg-paper-dark transition-all duration-300 ${
          isSidebarCollapsed ? "lg:w-[70px]" : "lg:w-[250px]"
        }`}
      >
        {/* App Logo */}
        <div className="sidebar-header p-4 flex items-center justify-between border-b border-paper-dark/20 dark:border-paper/20">
          {!isSidebarCollapsed && (
            <div className="app-title text-xl font-bold text-highlight dark:text-highlight tracking-wide">
              GoodStories
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight transition-colors"
          >
            {isSidebarCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-right"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-left"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav flex-1 overflow-y-auto py-4">
          <SidebarNavItem
            icon={<Home className="w-6 h-6" />}
            label="Home"
            isActive={activeTab === "homeTab"}
            onClick={() => handleTabClick("homeTab")}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarNavItem
            icon={<Compass className="w-6 h-6" />}
            label="Discover"
            isActive={activeTab === "discoverTab"}
            onClick={() => handleTabClick("discoverTab")}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarNavItem
            icon={<PlusCircle className="w-6 h-6" />}
            label="Create"
            isActive={activeTab === "createTab"}
            onClick={() => handleTabClick("createTab")}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarNavItem
            icon={<Bell className="w-6 h-6" />}
            label="Notifications"
            isActive={activeTab === "notificationsTab"}
            onClick={() => handleTabClick("notificationsTab")}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarNavItem
            icon={<User className="w-6 h-6" />}
            label="Profile"
            isActive={activeTab === "profileTab"}
            onClick={() => handleTabClick("profileTab")}
            isCollapsed={isSidebarCollapsed}
          />

          {!isSidebarCollapsed && (
            <>
              <div className="mx-4 my-4 border-t border-paper-dark/20 dark:border-paper/20"></div>

              <div className="px-4 py-2">
                <h3 className="text-xs uppercase text-ink-light dark:text-ink-light font-semibold tracking-wider">
                  Library
                </h3>
              </div>

              <SidebarNavItem
                icon={<BookmarkIcon className="w-6 h-6" />}
                label="Bookmarks"
                isActive={false}
                onClick={() => router.push("/bookmarks")}
                isCollapsed={isSidebarCollapsed}
              />
            </>
          )}
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="sidebar-footer border-t border-paper-dark/20 dark:border-paper/20 p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer">
              <Image
                src={userAvatarUrl || "/placeholder.svg"}
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 truncate">
                <div className="text-sm font-medium truncate">{userDisplayName}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* App Header - Adjust to span only the content area on desktop */}
      <header className="app-header fixed top-0 w-full py-4 px-4 flex items-center bg-paper dark:bg-paper-dark z-[100] border-b border-paper-dark/20 dark:border-paper/20 lg:static lg:col-start-2 lg:col-end-3 lg:pr-6">
        {" "}
        {/* Removed justify-between, added lg:pr-6 */}
        <div className="app-title text-2xl font-bold text-highlight dark:text-highlight lg:hidden">GoodStories</div>
        <div className="header-icons flex items-center gap-4 ml-auto">
          {" "}
          {/* Added ml-auto */}
          <Search className="w-6 h-6 text-ink dark:text-ink-light cursor-pointer" />
          <Link href="/bookmarks" passHref>
            <BookmarkIcon className="w-6 h-6 text-ink dark:text-ink-light cursor-pointer" />
          </Link>
          <ThemeToggle />
          {user && (
            <div
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer lg:hidden"
              onClick={() => handleTabClick("profileTab")}
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
        className={`tab-content ${activeTab === "homeTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-[calc(100vh-60px)] lg:pt-0`}
        id="homeTab"
      >
        <div
          className={`story-feed h-full w-full ${
            readingMode === "page"
              ? "flex flex-col overflow-y-auto snap-y snap-mandatory"
              : "flex overflow-x-auto snap-x snap-mandatory"
          } lg:max-h-[calc(100vh-60px)]`}
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
                className={`story-wrapper ${readingMode === "page" ? "min-h-full snap-start" : "min-w-full snap-center"} sm:px-1 md:px-2 lg:px-4 w-full box-border overflow-hidden`}
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
                  onClick={() => handleTabClick("createTab")}
                  className="px-4 py-2 bg-highlight text-white rounded-full"
                >
                  Create a Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discover Tab */}
      <div
        className={`tab-content ${activeTab === "discoverTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-[calc(100vh-60px)] lg:pt-0`}
        id="discoverTab"
      >
        <DiscoverTab />
      </div>

      {/* Create Tab */}
      <div
        className={`tab-content ${activeTab === "createTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-[calc(100vh-60px)] lg:pt-0`}
        id="createTab"
      >
        <CreateTab />
      </div>

      {/* Notifications Tab */}
      <div
        className={`tab-content ${activeTab === "notificationsTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-[calc(100vh-60px)] lg:pt-0`}
        id="notificationsTab"
      >
        <NotificationsTab />
      </div>

      {/* Profile Tab */}
      <div
        className={`tab-content ${activeTab === "profileTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-[calc(100vh-60px)] lg:pt-0`}
        id="profileTab"
      >
        <ProfileTab isMobile={isMobile} />
      </div>

      {/* Bottom Navigation - Hide on desktop */}
      <nav className="bottom-nav fixed bottom-0 w-full flex justify-around py-4 bg-paper dark:bg-paper-dark border-t border-paper-dark/20 dark:border-paper/20 z-[100] lg:hidden">
        <NavItem
          icon={<Home className="w-6 h-6 mb-1" />}
          label="Home"
          isActive={activeTab === "homeTab"}
          onClick={() => handleTabClick("homeTab")}
        />
        <NavItem
          icon={<Compass className="w-6 h-6 mb-1" />}
          label="Discover"
          isActive={activeTab === "discoverTab"}
          onClick={() => handleTabClick("discoverTab")}
        />
        <NavItem
          icon={<PlusCircle className="w-6 h-6 mb-1" />}
          label="Create"
          isActive={activeTab === "createTab"}
          onClick={() => handleTabClick("createTab")}
        />
        <NavItem
          icon={<Bell className="w-6 h-6 mb-1" />}
          label="Notifications"
          isActive={activeTab === "notificationsTab"}
          onClick={() => handleTabClick("notificationsTab")}
        />
        <NavItem
          icon={<User className="w-6 h-6 mb-1" />}
          label="Profile"
          isActive={activeTab === "profileTab"}
          onClick={() => handleTabClick("profileTab")}
        />
      </nav>

      {/* Login Modal - Only show for non-authenticated users */}
      {!user && isLoginModalOpen && (
        <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} message={loginMessage} />
      )}
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
      className={`nav-item flex flex-col items-center ${
        isActive ? "text-highlight dark:text-highlight" : "text-ink-light dark:text-ink-light"
      } no-underline text-sm transition-colors duration-300`}
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
