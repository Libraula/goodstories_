"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, BookmarkIcon, Home, Compass, PlusCircle, Bell, User } from "lucide-react"
import StoryContainer from "./story-container"
import { stories } from "@/lib/data"
import DiscoverTab from "./discover-tab"
import CreateTab from "./create-tab"
import NotificationsTab from "./notifications-tab"
import ProfileTab from "./profile-tab"
import { ThemeToggle } from "./theme-toggle"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { X } from "lucide-react"
import AuthWrapper from "./auth-wrapper"
import AuthModal from "./auth-modal"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { Heart, MessageCircle } from "lucide-react"

export default function StoryFeed() {
  const [activeTab, setActiveTab] = useState("homeTab")
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const { readingMode } = useReadingSettings()
  const storyFeedRef = useRef<HTMLDivElement>(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<"none" | "horizontal" | "vertical">("none")
  const { user } = useAuth()
  const { openModal, closeModal } = useAuthModal()

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
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

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Reset active story index when changing tabs
    setActiveStoryIndex(0)
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // Handle scroll events
  const handleScroll = () => {
    if (!storyFeedRef.current || isTransitioning) return

    // Determine the current story index based on scroll position
    if (readingMode === "page") {
      // In page mode, calculate based on vertical scroll
      const scrollTop = storyFeedRef.current.scrollTop
      const storyHeight = storyFeedRef.current.clientHeight
      const newIndex = Math.round(scrollTop / storyHeight)

      if (newIndex !== activeStoryIndex && newIndex >= 0 && newIndex < stories.length) {
        setActiveStoryIndex(newIndex)
      }
    } else {
      // In scroll mode, calculate based on horizontal scroll
      const scrollLeft = storyFeedRef.current.scrollLeft
      const storyWidth = storyFeedRef.current.clientWidth
      const newIndex = Math.round(scrollLeft / storyWidth)

      if (newIndex !== activeStoryIndex && newIndex >= 0 && newIndex < stories.length) {
        setActiveStoryIndex(newIndex)
      }
    }
  }

  // Handle touch events for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
    setScrollDirection("none")
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTransitioning) return

    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    const deltaX = touchX - touchStartX
    const deltaY = touchY - touchStartY

    // Determine scroll direction
    if (scrollDirection === "none") {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setScrollDirection("horizontal")
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        setScrollDirection("vertical")
      }
    }
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

  // Enhanced wheel event handling for smoother navigation
  useEffect(() => {
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
      feedContainer.addEventListener("wheel", handleWheel, { passive: false })

      return () => {
        feedContainer.removeEventListener("wheel", handleWheel)
      }
    }
  }, [activeStoryIndex, readingMode, isTransitioning])

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown)
  }

  // Handle sign out
  const handleSignOut = async () => {
    // Sign out logic
    setShowProfileDropdown(false)
  }

  // Handle Google sign in
  const signInWithGoogle = async () => {
    // Google sign in logic
    closeAuthModal()
  }

  // Close auth modal
  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  // Tabs configuration
  const tabs = [
    { id: "homeTab", label: "Home" },
    { id: "discoverTab", label: "Discover" },
    { id: "createTab", label: "Create" },
    { id: "notificationsTab", label: "Notifications" },
    { id: "profileTab", label: "Profile" },
  ]

  return (
    <AuthWrapper>
      <div className="story-feed-container h-screen w-screen flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop sidebar - visible on large screens */}
        <div className="hidden lg:flex flex-col w-64 h-full border-r border-paper-dark/20 dark:border-paper/20 bg-white/95 dark:bg-paper-dark/95 backdrop-blur-md z-10 transition-all duration-300 ease-in-out">
          <div className="p-4 border-b border-paper-dark/20 dark:border-paper/20">
            <h1 className="text-2xl font-bold text-highlight dark:text-highlight flex items-center gap-2">
              <BookmarkIcon className="h-6 w-6" />
              <span>GoodStories</span>
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              <NavItem
                icon={<Home className="h-5 w-5" />}
                label="Home"
                isActive={activeTab === "homeTab"}
                onClick={() => setActiveTab("homeTab")}
              />
              <NavItem
                icon={<Compass className="h-5 w-5" />}
                label="Discover"
                isActive={activeTab === "discoverTab"}
                onClick={() => setActiveTab("discoverTab")}
              />
              <NavItem
                icon={<PlusCircle className="h-5 w-5" />}
                label="Create"
                isActive={activeTab === "createTab"}
                onClick={() => setActiveTab("createTab")}
              />
              <NavItem
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                isActive={activeTab === "notificationsTab"}
                onClick={() => setActiveTab("notificationsTab")}
              />
              <NavItem
                icon={<User className="h-5 w-5" />}
                label="Profile"
                isActive={activeTab === "profileTab"}
                onClick={() => setActiveTab("profileTab")}
              />
            </nav>
          </div>
          
          <div className="p-4 border-t border-paper-dark/20 dark:border-paper/20 flex items-center justify-between">
            <ThemeToggle />
            <div className="text-xs text-ink-light dark:text-ink-light">v1.0.0</div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top header - visible on all screens */}
          <header className="flex items-center justify-between p-3 md:p-4 border-b border-paper-dark/20 dark:border-paper/20 bg-white/95 dark:bg-paper-dark/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              {/* Logo - only visible on mobile */}
              <h1 className="text-xl font-bold text-highlight dark:text-highlight flex items-center gap-2 lg:hidden">
                <BookmarkIcon className="h-5 w-5" />
                <span>GoodStories</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-light dark:text-ink-light" />
                <input 
                  type="text" 
                  placeholder="Search stories..." 
                  className="pl-10 pr-4 py-2 rounded-full bg-paper/50 dark:bg-paper-dark/50 border border-paper-dark/20 dark:border-paper/20 text-sm focus:outline-none focus:ring-2 focus:ring-highlight/50 w-[180px] lg:w-[240px] transition-all"
                />
              </div>
              
              {/* Always visible theme toggle */}
              <ThemeToggle />
              
              {/* Bookmark icon - visible on all screen sizes */}
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink dark:text-ink-light hover:bg-paper-dark/10 dark:hover:bg-paper/10"
                aria-label="Bookmarks"
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
              
              {user ? (
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden cursor-pointer"
                    onClick={() => setActiveTab("profileTab")}
                  >
                    <Image
                      src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {showProfileDropdown && (
                    <div className="absolute top-10 right-0 bg-white dark:bg-paper-dark shadow-lg rounded-lg p-2 z-50 min-w-[150px]">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-paper-dark/10 dark:hover:bg-paper/10 rounded"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openModal}
                  className="px-3 py-1.5 bg-highlight text-white rounded-lg text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-hidden relative">
            {activeTab === "homeTab" && (
              <div
                ref={storyFeedRef}
                className={`story-feed h-full ${
                  readingMode === "page" ? "overflow-y-auto overflow-x-hidden snap-y snap-mandatory" : "overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
                } scrollbar-hide`}
                style={{
                  scrollSnapType: readingMode === "page" ? "y mandatory" : "x mandatory",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onScroll={handleScroll}
              >
                <div
                  className={`stories-container ${
                    readingMode === "page"
                      ? "flex flex-col h-fit"
                      : "flex flex-row w-fit h-full"
                  }`}
                >
                  {stories.map((story, index) => (
                    <div
                      key={index}
                      className={`story-wrapper ${
                        readingMode === "page"
                          ? "h-screen w-full snap-start snap-always"
                          : "h-full w-screen snap-start snap-always"
                      }`}
                    >
                      <StoryContainer
                        story={story}
                        showSidebar={showSidebar}
                        toggleSidebar={() => setShowSidebar(!showSidebar)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "discoverTab" && <DiscoverTab />}
            {activeTab === "createTab" && <CreateTab />}
            {activeTab === "notificationsTab" && <NotificationsTab />}
            {activeTab === "profileTab" && <ProfileTab isMobile={isMobile} />}
          </main>

          {/* Bottom navigation - only visible on mobile and tablets */}
          <nav className="lg:hidden flex items-center justify-around py-2 px-1 border-t border-paper-dark/20 dark:border-paper/20 bg-white/95 dark:bg-paper-dark/95 backdrop-blur-md z-10">
            <NavItem
              icon={<Home className="h-5 w-5" />}
              label="Home"
              isActive={activeTab === "homeTab"}
              onClick={() => setActiveTab("homeTab")}
            />
            <NavItem
              icon={<Compass className="h-5 w-5" />}
              label="Discover"
              isActive={activeTab === "discoverTab"}
              onClick={() => setActiveTab("discoverTab")}
            />
            <NavItem
              icon={<PlusCircle className="h-5 w-5" />}
              label="Create"
              isActive={activeTab === "createTab"}
              onClick={() => setActiveTab("createTab")}
            />
            <NavItem
              icon={<Bell className="h-5 w-5" />}
              label="Notifications"
              isActive={activeTab === "notificationsTab"}
              onClick={() => setActiveTab("notificationsTab")}
            />
            <NavItem
              icon={<User className="h-5 w-5" />}
              label="Profile"
              isActive={activeTab === "profileTab"}
              onClick={() => setActiveTab("profileTab")}
            />
          </nav>
        </div>
      </div>
    </AuthWrapper>
  )
}

// Improved NavItem component
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
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-highlight/10 dark:bg-highlight/20 text-highlight dark:text-highlight font-medium"
          : "text-ink-light dark:text-ink-light hover:bg-paper-dark/10 dark:hover:bg-paper/10"
      }`}
      onClick={onClick}
    >
      <div className={`${isActive ? "text-highlight dark:text-highlight" : "text-ink-light dark:text-ink-light"}`}>
        {icon}
      </div>
      <span className="hidden sm:inline lg:inline">{label}</span>
    </button>
  )
}
