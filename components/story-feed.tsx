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
import { useTheme } from "next-themes"
import { ThemeToggle } from "./theme-toggle"
import { useReadingSettings } from "@/contexts/reading-settings-context"

export default function StoryFeed() {
  const [activeTab, setActiveTab] = useState("homeTab")
  const storyFeedRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const { theme } = useTheme()
  const [currentStory, setCurrentStory] = useState(0)
  const { readingMode } = useReadingSettings()
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const centerCurrentStory = () => {
    if (!storyFeedRef.current) return
    const container = storyFeedRef.current
    setIsTransitioning(true)

    if (readingMode === "scroll") {
      const storyWidth = container.clientWidth
      const targetScrollPosition = storyWidth * currentStory
      container.scrollTo({
        left: targetScrollPosition,
        behavior: "smooth",
      })
    } else {
      const storyHeight = container.clientHeight
      const targetScrollPosition = storyHeight * currentStory
      container.scrollTo({
        top: targetScrollPosition,
        behavior: "smooth",
      })
    }

    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  const handleStoryChange = (index: number) => {
    if (index >= 0 && index < stories.length && !isTransitioning) {
      setCurrentStory(index)
      setIsTransitioning(true)

      if (storyFeedRef.current) {
        const container = storyFeedRef.current
        if (readingMode === "scroll") {
          const storyWidth = container.clientWidth
          container.scrollTo({
            left: storyWidth * index,
            behavior: "smooth",
          })
        } else {
          const storyHeight = container.clientHeight
          container.scrollTo({
            top: storyHeight * index,
            behavior: "smooth",
          })
        }
        setTimeout(() => {
          setIsTransitioning(false)
        }, 300)
      }
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!storyFeedRef.current || isTransitioning) return
      const container = storyFeedRef.current

      if (readingMode === "scroll") {
        const scrollLeft = container.scrollLeft
        const storyWidth = container.clientWidth
        const newStory = Math.round(scrollLeft / storyWidth)
        if (newStory !== currentStory && newStory >= 0 && newStory < stories.length) {
          setCurrentStory(newStory)
        }
      } else {
        const scrollTop = container.scrollTop
        const storyHeight = container.clientHeight
        const newStory = Math.round(scrollTop / storyHeight)
        if (newStory !== currentStory && newStory >= 0 && newStory < stories.length) {
          setCurrentStory(newStory)
        }
      }
    }

    const handleScrollEnd = () => {
      if (isTransitioning) return
      centerCurrentStory()
    }

    const container = storyFeedRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      container.addEventListener("touchend", handleScrollEnd)
      return () => {
        container.removeEventListener("scroll", handleScroll)
        container.removeEventListener("touchend", handleScrollEnd)
      }
    }
  }, [currentStory, stories.length, isTransitioning, readingMode])

  useEffect(() => {
    const handleResize = () => {
      centerCurrentStory()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentStory, readingMode])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    if (readingMode === "scroll") {
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && currentStory > 0) {
          handleStoryChange(currentStory - 1)
        } else if (deltaX < 0 && currentStory < stories.length - 1) {
          handleStoryChange(currentStory + 1)
        } else {
          centerCurrentStory()
        }
      } else {
        centerCurrentStory()
      }
    } else {
      if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0 && currentStory > 0) {
          handleStoryChange(currentStory - 1)
        } else if (deltaY < 0 && currentStory < stories.length - 1) {
          handleStoryChange(currentStory + 1)
        } else {
          centerCurrentStory()
        }
      } else {
        centerCurrentStory()
      }
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <div className="app-container relative w-full h-screen mx-auto overflow-hidden shadow-md bg-paper dark:bg-paper md:h-screen md:w-full md:my-0 md:rounded-none lg:w-full lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[60px_1fr_60px]">
      <header className="app-header fixed top-0 w-full py-4 px-4 flex justify-between items-center bg-paper dark:bg-paper z-[100] border-b border-paper-dark dark:border-paper-dark lg:static lg:col-span-2">
        <div className="app-title text-2xl font-bold text-highlight dark:text-highlight tracking-wide">GoodStories</div>
        <div className="header-icons flex items-center gap-4">
          <Search className="w-6 h-6 text-ink dark:text-ink cursor-pointer" />
          <BookmarkIcon className="w-6 h-6 text-ink dark:text-ink cursor-pointer" />
          <ThemeToggle />
        </div>
      </header>

      <div
        className={`tab-content ${activeTab === "homeTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="homeTab"
      >
        <div
          className={`story-feed h-full w-full ${
            readingMode === "scroll"
              ? "flex overflow-x-auto snap-x snap-mandatory"
              : "flex flex-col overflow-y-auto snap-y snap-mandatory"
          }`}
          ref={storyFeedRef}
          style={{
            scrollSnapType: readingMode === "scroll" ? "x mandatory" : "y mandatory",
            scrollBehavior: "smooth",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {stories.map((story, index) => (
            <div
              key={index}
              className={`story-wrapper ${readingMode === "scroll" ? "min-w-full snap-center" : "min-h-full snap-start"}`}
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

      {!isMobile && (
        <div className="sidebar hidden lg:block lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 lg:border-r lg:border-paper-dark dark:lg:border-paper-dark lg:p-6 lg:overflow-y-auto bg-paper dark:bg-paper">
          <div className="sidebar-section mb-8">
            <h3 className="text-xl text-highlight dark:text-highlight mb-4 pb-1 border-b border-paper-dark dark:border-paper-dark">
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
            <h3 className="text-xl text-highlight dark:text-highlight mb-4 pb-1 border-b border-paper-dark dark:border-paper-dark">
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

      <div
        className={`tab-content ${activeTab === "discoverTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="discoverTab"
      >
        <DiscoverTab />
      </div>

      <div
        className={`tab-content ${activeTab === "createTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="createTab"
      >
        <CreateTab />
      </div>

      <div
        className={`tab-content ${activeTab === "notificationsTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="notificationsTab"
      >
        <NotificationsTab />
      </div>

      <div
        className={`tab-content ${activeTab === "profileTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-span-2 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="profileTab"
      >
        <ProfileTab isMobile={isMobile} />
      </div>

      <nav className="bottom-nav fixed bottom-0 w-full flex justify-around py-4 bg-paper dark:bg-paper border-t border-paper-dark dark:border-paper-dark z-[100] lg:static lg:col-span-2 lg:row-start-3 lg:row-end-4 lg:flex lg:justify-around">
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
    </div>
  )
}

function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
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