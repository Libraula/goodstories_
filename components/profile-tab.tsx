"use client"

import Image from "next/image"
import ReadingTools from "./reading-tools"
import { useAuth } from "@/contexts/auth-context"
import { LogOut } from "lucide-react"

export default function ProfileTab({ isMobile }: { isMobile: boolean }) {
  const { user, signOut, showLoginModal, userDisplayName, userAvatarUrl } = useAuth()

  // If user is not logged in, show login prompt but don't automatically show modal
  if (!user) {
    return (
      <div className="profile-tab p-5 h-full overflow-y-auto max-w-4xl mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-highlight dark:text-highlight">Sign in to GoodStories</h2>
          <p className="text-ink-light dark:text-ink-light mb-6">
            Sign in to access your profile, bookmarks, and personalized recommendations.
          </p>
          <button
            onClick={showLoginModal}
            className="flex items-center justify-center gap-3 bg-white dark:bg-paper-dark border border-paper-dark dark:border-paper rounded-lg p-3 text-ink dark:text-ink hover:bg-paper-dark dark:hover:bg-paper transition-colors mx-auto"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  // User is logged in, show profile with actual user data
  return (
    <div className="profile-tab p-5 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="profile-header flex items-center gap-5 mb-8">
        <Image
          src={userAvatarUrl || "/placeholder.svg"}
          alt={userDisplayName}
          width={80}
          height={80}
          className="profile-avatar w-20 h-20 rounded-full object-cover border-2 border-paper-dark dark:border-paper"
        />
        <div className="profile-info flex-1">
          <h2 className="text-2xl mb-1 text-highlight dark:text-highlight">{userDisplayName}</h2>
          <p className="text-ink-light dark:text-ink-light">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="p-3 rounded-lg bg-white dark:bg-paper-dark border border-paper-dark dark:border-paper hover:bg-paper-dark dark:hover:bg-paper text-ink-light dark:text-ink-light hover:text-ink dark:hover:text-ink flex items-center gap-2"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="profile-stats flex gap-4 mb-5">
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">142</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Stories</div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">5.8K</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Followers</div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">327</div>
          <div className="stat-label text-xs text-ink-light dark:text-ink-light">Following</div>
        </div>
      </div>

      <div className="profile-bio mb-5 leading-relaxed text-ink dark:text-ink">
        <p>
          Short story enthusiast. Believer in the power of flash fiction. Writing about the spaces between reality and
          imagination.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-highlight dark:text-highlight">Reading Tools</h3>
        <ReadingTools />
      </div>

      <div className="profile-stories mt-8">
        <h3 className="text-xl font-bold mb-4 text-highlight dark:text-highlight">Your Stories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="profile-story bg-white dark:bg-paper-dark rounded-lg p-4 shadow-sm border border-paper-dark dark:border-paper">
            <h4 className="profile-story-title text-lg font-bold mb-1 text-highlight dark:text-highlight">
              The Last Bookstore
            </h4>
            <div className="profile-story-meta flex justify-between text-sm text-ink-light dark:text-ink-light">
              <span>1.2K likes</span>
              <span>3 days ago</span>
            </div>
          </div>
          <div className="profile-story bg-white dark:bg-paper-dark rounded-lg p-4 shadow-sm border border-paper-dark dark:border-paper">
            <h4 className="profile-story-title text-lg font-bold mb-1 text-highlight dark:text-highlight">
              Why We Need Short Fiction
            </h4>
            <div className="profile-story-meta flex justify-between text-sm text-ink-light dark:text-ink-light">
              <span>2.4K likes</span>
              <span>1 week ago</span>
            </div>
          </div>
          <div className="profile-story bg-white dark:bg-paper-dark rounded-lg p-4 shadow-sm border border-paper-dark dark:border-paper">
            <h4 className="profile-story-title text-lg font-bold mb-1 text-highlight dark:text-highlight">
              The Sound of Pages Turning
            </h4>
            <div className="profile-story-meta flex justify-between text-sm text-ink-light dark:text-ink-light">
              <span>893 likes</span>
              <span>2 weeks ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

