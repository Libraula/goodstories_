"use client"

import type React from "react"
import Link from "next/link" // Import Link
import { useState, useEffect, useRef } from "react"
import { Home, Compass, PlusCircle, Bell, User } from "lucide-react"
import StoryContainer from "./story-container"
import DiscoverTab from "./discover-tab"
import CreateTab from "./create-tab"
import NotificationsTab from "./notifications-tab"
import ProfileTab from "./profile-tab"
import { useReadingSettings } from "@/contexts/reading-settings-context"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import LoginModal from "./auth-modal"
import Image from "next/image"
import { getStories } from "@/lib/database"
import type { Story } from "@/lib/types"
import { useRouter } from "next/navigation"
import { AppHeader } from "./app-header"
import DesktopSideNav from "./desktop-side-nav"

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
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const { readingMode, setReadingMode } = useReadingSettings()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { user } = useAuthSafe()
  const { isOpen: isLoginModalOpen, openModal, closeModal } = useAuthModal()
  const [loginMessage, setLoginMessage] = useState<string>("")
  const [requestedTab, setRequestedTab] = useState<string | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Ensure readingMode is set to 'page' (vertical) for TikTok style feed
  useEffect(() => {
    if (readingMode !== 'page') {
      setReadingMode('page')
    }
  }, [readingMode, setReadingMode])

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true)
      try {
        const fetchedStories = await getStories(20, 0)
        setStories(fetchedStories ? (fetchedStories as Story[]) : [])
      } catch (error) {
        console.error("Error fetching stories:", error)
        setStories([])
      } finally {
        setIsLoading(false)
      }
    }
    if (activeTab === "homeTab") { // Only fetch stories for home tab initially
      fetchStories()
    }
  }, [activeTab])

  const navigateToStory = (index: number) => {
    if (!storyFeedRef.current || index < 0 || index >= stories.length || isTransitioning) return
    setIsTransitioning(true)
    const storyHeight = storyFeedRef.current.clientHeight // Assumes each story container is full height
    storyFeedRef.current.scrollTo({
      top: storyHeight * index,
      behavior: "smooth",
    })
    setActiveStoryIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleTabClick = (tabName: string) => {
    if (
      (tabName === "createTab" || tabName === "profileTab" || tabName === "notificationsTab") && !user
    ) {
      setLoginMessage(`Please log in to access the ${tabName.replace("Tab", "")} feature`)
      setRequestedTab(tabName)
      openModal()
      return
    }
    setActiveTab(tabName)
    setActiveStoryIndex(0) // Reset story index when changing tabs
    if (storyFeedRef.current) {
      storyFeedRef.current.scrollTop = 0 // Reset scroll for home feed
    }
  }

  // Simplified scroll handling for vertical feed (Home Tab)
  useEffect(() => {
    const feedContainer = storyFeedRef.current
    if (!feedContainer || activeTab !== "homeTab") return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (isTransitioning) return
        const storyHeight = feedContainer.clientHeight
        const currentScrollTop = feedContainer.scrollTop
        const newIndex = Math.round(currentScrollTop / storyHeight)
        
        if (newIndex !== activeStoryIndex && newIndex >= 0 && newIndex < stories.length) {
          // Snap to the new index, but don't trigger navigateToStory if it's a result of user scroll end
          // navigateToStory will handle smooth scroll if called directly
          // For snapping, we can do a direct scroll or let the browser's snap behavior work
          // feedContainer.scrollTo({ top: newIndex * storyHeight, behavior: 'smooth' })
          setActiveStoryIndex(newIndex)
        }
      }, 150) // Debounce scroll event
    }

    feedContainer.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      clearTimeout(scrollTimeout)
      feedContainer.removeEventListener("scroll", handleScroll)
    }
  }, [activeStoryIndex, stories.length, isTransitioning, activeTab])

  const handleWheel = (e: WheelEvent) => {
    if (activeTab !== "homeTab" || isTransitioning || !storyFeedRef.current) return
    e.preventDefault() // Prevent page scroll, handle with story navigation
    if (e.deltaY > 0 && activeStoryIndex < stories.length - 1) {
      navigateToStory(activeStoryIndex + 1)
    } else if (e.deltaY < 0 && activeStoryIndex > 0) {
      navigateToStory(activeStoryIndex - 1)
    }
  }

  useEffect(() => {
    const currentFeedRef = storyFeedRef.current
    if (activeTab === "homeTab" && currentFeedRef) {
      currentFeedRef.addEventListener('wheel', handleWheel, { passive: false })
    }
    return () => {
      if (activeTab === "homeTab" && currentFeedRef) {
        currentFeedRef.removeEventListener('wheel', handleWheel)
      }
    }
  }, [activeTab, activeStoryIndex, stories.length, isTransitioning])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab !== "homeTab") return
    // Store touch start Y position
    // Simplified, actual TikTok swipe is more nuanced with Y and X delta thresholds
    // touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTab !== "homeTab" || isTransitioning || !storyFeedRef.current || e.changedTouches.length === 0) return
    // Logic for swipe up/down based on touchStartY.current and e.changedTouches[0].clientY
    // For now, relying on native snap scrolling or wheel/keydown. Full touch swipe needs more state.
    // Example: 
    // const touchEndY = e.changedTouches[0].clientY
    // const deltaY = touchEndY - touchStartY.current
    // if (Math.abs(deltaY) > 50) { // Threshold for swipe
    //   if (deltaY > 0 && activeStoryIndex > 0) {
    //     navigateToStory(activeStoryIndex - 1)
    //   } else if (deltaY < 0 && activeStoryIndex < stories.length - 1) {
    //     navigateToStory(activeStoryIndex + 1)
    //   }
    // }
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "homeTab" || isTransitioning) return
      if (e.key === "ArrowDown" && activeStoryIndex < stories.length - 1) {
        navigateToStory(activeStoryIndex + 1)
      } else if (e.key === "ArrowUp" && activeStoryIndex > 0) {
        navigateToStory(activeStoryIndex - 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeStoryIndex, stories.length, isTransitioning, activeTab])

  const handleLoginModalClose = () => {
    closeModal()
    setLoginMessage("")
    setRequestedTab(null)
  }

  useEffect(() => {
    if (user && requestedTab) {
      setActiveTab(requestedTab)
      setRequestedTab(null)
      setLoginMessage("")
      closeModal()
    }
  }, [user, requestedTab, closeModal])

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-paper text-ink">
      {/* Desktop Side Navigation - part of the flex flow */}
      <DesktopSideNav 
        activeTab={activeTab} 
        onTabClick={handleTabClick} 
        className="hidden lg:flex flex-col w-60 h-full sticky top-0 overflow-y-auto z-20 border-r border-border"
      />
      
      {/* Main application area: flex column that takes remaining space and handles its own overflow */} 
      <div className="flex flex-col flex-1 overflow-hidden"> 
        <AppHeader /> {/* Global App Header - takes its own height */} 

        {/* Main Content Area - Switches based on activeTab - this area will allow content to scroll */} 
        <main className="flex-1 w-full relative"> {/* Removed overflow-y-auto, added relative for potential absolute children in tabs */} 
          {activeTab === "homeTab" && (
            <div
              ref={storyFeedRef}
              className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth" // Fill parent 'main' and handle own scroll
            >
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-foreground">
                  Loading stories...
                </div>
              ) : stories.length > 0 ? (
                stories.map((story, index) => (
                  <div
                    key={story.id}
                    className="h-screen w-full snap-start flex-shrink-0 relative bg-paper"
                  >
                    <StoryContainer
                      story={story}
                      isActive={index === activeStoryIndex}
                    />
                  </div>
                ))
              ) : (
                <div className="h-full w-full flex items-center justify-center text-foreground">
                  No stories yet. Be the first to create!
                </div>
              )}
            </div>
          )}
          {activeTab === "discoverTab" && <DiscoverTab />}
          {activeTab === "createTab" && <CreateTab />}
          {activeTab === "notificationsTab" && <NotificationsTab />}
          {activeTab === "profileTab" && <ProfileTab />}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only - sticky to the bottom of the flex container it's in (which is Main Application Area) */} 
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-border flex justify-around items-center p-2 z-30">
        <NavItem
          icon={<Home className="h-7 w-7 mb-0.5" />}
          label="Home"
          isActive={activeTab === "homeTab"}
          onClick={() => handleTabClick("homeTab")}
        />
        <NavItem
          icon={<Compass className="h-7 w-7 mb-0.5" />}
          label="Discover"
          isActive={activeTab === "discoverTab"}
          onClick={() => handleTabClick("discoverTab")}
        />
        <NavItem
          icon={<PlusCircle className="h-7 w-7 mb-0.5" />}
          label="Create"
          isActive={activeTab === "createTab"}
          onClick={() => handleTabClick("createTab")}
        />
        <NavItem
          icon={<Bell className="h-7 w-7 mb-0.5" />}
          label="Notifications"
          isActive={activeTab === "notificationsTab"}
          onClick={() => handleTabClick("notificationsTab")}
        />
        <NavItem
          icon={<User className="h-7 w-7 mb-0.5" />}
          label="Profile"
          isActive={activeTab === "profileTab"}
          onClick={() => handleTabClick("profileTab")}
        />
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        message={loginMessage}
      />
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
    <button
      className={`flex flex-col items-center justify-center p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-highlight/50 transition-colors duration-150 w-1/5 min-h-[50px] ${isActive ? "text-highlight" : "text-muted-foreground hover:text-highlight/70"}`}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <span className={`text-xs ${isActive ? "text-highlight font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  )
}
