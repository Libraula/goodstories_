"use client"

import Image from "next/image"
import ReadingTools from "./reading-tools"

export default function ProfileTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="profile-tab p-5 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="profile-header flex items-center gap-5 mb-8">
        <Image
          src="https://randomuser.me/api/portraits/women/65.jpg"
          alt="Your Profile"
          width={80}
          height={80}
          className="profile-avatar w-20 h-20 rounded-full object-cover border-2 border-paper-dark dark:border-paper"
        />
        <div className="profile-info">
          <h2 className="text-2xl mb-1 text-highlight dark:text-highlight">Alex Morgan</h2>
          <p className="text-ink-light dark:text-ink-light">Writer & Reader</p>
        </div>
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

      <div className="profile-stories mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  )
}

