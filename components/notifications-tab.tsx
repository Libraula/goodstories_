"use client"

import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"

export default function NotificationsTab() {
  const { user, showLoginModal } = useAuth()

  // If user is not logged in, show login prompt but don't automatically show modal
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-highlight dark:text-highlight">Sign in to View Notifications</h2>
          <p className="text-ink-light dark:text-ink-light mb-6">
            Please sign in to see your notifications and stay updated with the latest activity.
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

  return (
    <div className="notifications-tab p-5 h-full overflow-y-auto max-w-3xl mx-auto">
      <div className="notification bg-white dark:bg-paper-dark rounded-lg p-4 mb-4 shadow-sm border border-paper-dark dark:border-paper flex items-center gap-4">
        <Image
          src="https://randomuser.me/api/portraits/women/33.jpg"
          alt="Clara Bennett"
          width={40}
          height={40}
          className="notification-avatar w-10 h-10 rounded-full object-cover"
        />
        <div className="notification-content flex-1">
          <p className="notification-text text-sm mb-1 text-ink dark:text-ink">
            <strong>Clara Bennett</strong> liked your comment on "The Library of Lost Voices"
          </p>
          <p className="notification-time text-xs text-ink-light dark:text-ink-light">2 hours ago</p>
        </div>
      </div>

      <div className="notification bg-white dark:bg-paper-dark rounded-lg p-4 mb-4 shadow-sm border border-paper-dark dark:border-paper flex items-center gap-4">
        <Image
          src="https://randomuser.me/api/portraits/men/22.jpg"
          alt="James Wilson"
          width={40}
          height={40}
          className="notification-avatar w-10 h-10 rounded-full object-cover"
        />
        <div className="notification-content flex-1">
          <p className="notification-text text-sm mb-1 text-ink dark:text-ink">
            <strong>James Wilson</strong> started following you
          </p>
          <p className="notification-time text-xs text-ink-light dark:text-ink-light">5 hours ago</p>
        </div>
      </div>

      <div className="notification bg-white dark:bg-paper-dark rounded-lg p-4 mb-4 shadow-sm border border-paper-dark dark:border-paper flex items-center gap-4">
        <Image
          src="https://randomuser.me/api/portraits/women/15.jpg"
          alt="Sophia Lee"
          width={40}
          height={40}
          className="notification-avatar w-10 h-10 rounded-full object-cover"
        />
        <div className="notification-content flex-1">
          <p className="notification-text text-sm mb-1 text-ink dark:text-ink">
            <strong>Sophia Lee</strong> commented on your story: "Beautiful writing!"
          </p>
          <p className="notification-time text-xs text-ink-light dark:text-ink-light">1 day ago</p>
        </div>
      </div>

      <div className="notification bg-white dark:bg-paper-dark rounded-lg p-4 mb-4 shadow-sm border border-paper-dark dark:border-paper flex items-center gap-4">
        <Image
          src="https://randomuser.me/api/portraits/men/45.jpg"
          alt="David Park"
          width={40}
          height={40}
          className="notification-avatar w-10 h-10 rounded-full object-cover"
        />
        <div className="notification-content flex-1">
          <p className="notification-text text-sm mb-1 text-ink dark:text-ink">
            <strong>David Park</strong> published a new essay: "The Psychology of Reading"
          </p>
          <p className="notification-time text-xs text-ink-light dark:text-ink-light">2 days ago</p>
        </div>
      </div>
    </div>
  )
}

