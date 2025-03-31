"use client"

import Image from "next/image"
import ReadingTools from "./reading-tools"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { LogOut } from "lucide-react"

export default function ProfileTab({ isMobile }: { isMobile: boolean }) {
  const { user, signOut } = useAuth()
  const { openModal } = useAuthModal()

  // If no user, show login prompt
  if (!user) {
    return (
      <div className="profile-tab p-5 h-full flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-highlight dark:text-highlight">Sign in to view your profile</h2>
          <p className="text-ink-light dark:text-ink-light mb-6">
            Create an account or sign in to access your profile, save stories, and connect with other readers.
          </p>
          <button
            onClick={openModal}
            className="px-6 py-3 bg-highlight dark:bg-highlight text-white rounded-full font-medium hover:bg-highlight/90 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  // Get user info from Supabase auth
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const userAvatar = user.user_metadata?.avatar_url || "https://randomuser.me/api/portraits/women/65.jpg"

  return (
    <div className="profile-tab p-5 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="profile-header flex items-center gap-5 mb-8">
        <Image
          src={userAvatar}
          alt="Your Profile"
          width={80}
          height={80}
          className="profile-avatar w-20 h-20 rounded-full object-cover border-2 border-paper-dark dark:border-paper"
        />
        <div className="profile-info flex-1">
          <h2 className="text-2xl mb-1 text-highlight dark:text-highlight">{userName}</h2>
          <p className="text-ink-light dark:text-ink-light">Reader & Storyteller</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-paper dark:bg-paper-dark text-ink dark:text-ink hover:bg-paper-dark dark:hover:bg-paper transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>

      <div className="profile-stats flex gap-4 mb-5">
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">0</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Stories</div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">0</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Followers</div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">0</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Following</div>
        </div>
      </div>

      <div className="profile-bio mb-5 leading-relaxed text-ink dark:text-ink">
        <p>
          Welcome to GoodStories! This is your profile where you can manage your stories and connect with other readers.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-highlight dark:text-highlight">Reading Tools</h3>
        <ReadingTools />
      </div>

      <div className="profile-stories mt-8">
        <h3 className="text-xl font-bold mb-4 text-highlight dark:text-highlight">Your Activity</h3>
        <div className="empty-state p-8 text-center bg-white dark:bg-paper-dark rounded-lg border border-paper-dark dark:border-paper">
          <div className="text-5xl mb-4 text-ink-light dark:text-ink-light">
            <i className="fas fa-book-open"></i>
          </div>
          <h4 className="text-lg font-medium mb-2 text-ink dark:text-ink">No stories yet</h4>
          <p className="text-ink-light dark:text-ink-light mb-4">
            You haven't created any stories or saved any bookmarks yet.
          </p>
          <button className="px-4 py-2 bg-highlight dark:bg-highlight text-white rounded-lg font-medium hover:bg-highlight/90 transition-colors">
            Create your first story
          </button>
        </div>
      </div>
    </div>
  )
}

