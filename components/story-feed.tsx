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

export default function StoryFeed() {
  const [activeTab, setActiveTab] = useState("homeTab")
  const storyFeedRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  return (
    <div className="app-container relative w-full max-w-[500px] h-screen mx-auto overflow-hidden shadow-md bg-paper dark:bg-paper md:max-w-[400px] md:h-[90vh] md:my-[5vh] md:rounded-xl lg:max-w-[1000px] lg:w-[95vw] lg:grid lg:grid-cols-[300px_1fr] lg:grid-rows-[60px_1fr_60px]">
      {/* App Header */}
      <header className="app-header fixed top-0 w-full max-w-[500px] py-4 px-4 flex justify-between items-center bg-paper dark:bg-paper z-[100] border-b border-paper-dark dark:border-paper-dark md:max-w-[400px] lg:static lg:max-w-none lg:col-span-2">
        <div className="app-title text-2xl font-bold text-highlight dark:text-highlight tracking-wide">GoodStories</div>
        <div className="header-icons flex gap-4">
          <Search className="header-icon text-xl text-ink dark:text-ink cursor-pointer" />
          <BookmarkIcon className="header-icon text-xl text-ink dark:text-ink cursor-pointer" />
          <ThemeToggle />
        </div>
      </header>

      {/* Home Tab */}
      <div
        className={`tab-content ${activeTab === "homeTab" ? "block" : "hidden"} h-[calc(100vh-120px)] overflow-hidden pt-[60px] lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:h-full lg:pt-0`}
        id="homeTab"
      >
        <div className="story-feed h-full w-full overflow-y-scroll snap-y snap-mandatory" ref={storyFeedRef}>
          {stories.map((story, index) => (
            <StoryContainer
              key={index}
              story={story}
              showSidebar={showSidebar}
              toggleSidebar={() => setShowSidebar(!showSidebar)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar (Desktop) */}
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
      <nav className="bottom-nav fixed bottom-0 w-full max-w-[500px] flex justify-around py-4 bg-paper dark:bg-paper border-t border-paper-dark dark:border-paper-dark z-[100] md:max-w-[400px] lg:static lg:max-w-none lg:col-span-2">
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

