"use client"

import { useState, useEffect } from "react" // Added useState, useEffect
import Image from "next/image"
import ReadingTools from "./reading-tools"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { LogOut } from "lucide-react"
import { getUserStories } from "@/lib/database" // Import function to get user stories
import type { Story } from "@/lib/types" // Import Story type
import StoryCard from "./story-card" // Import StoryCard component
import { useRouter } from "next/navigation" // Import useRouter

export default function ProfileTab({ isMobile }: { isMobile: boolean }) {
  const { user, signOut } = useAuth()
  const { openModal } = useAuthModal()
  const [userStories, setUserStories] = useState<Story[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(true)
  const [errorLoadingStories, setErrorLoadingStories] = useState<string | null>(null)
  const router = useRouter() // Initialize router

  // Fetch user stories when user is available
  useEffect(() => {
    const fetchStories = async () => {
      if (user) {
        setIsLoadingStories(true)
        setErrorLoadingStories(null)
        try {
          const stories = await getUserStories(user.id)
          setUserStories(stories || []) // Ensure it's an array
        } catch (error) {
          console.error("Error fetching user stories:", error)
          setErrorLoadingStories("Failed to load your stories. Please try again.")
          setUserStories([])
        } finally {
          setIsLoadingStories(false)
        }
      } else {
        // Clear stories if user logs out
        setUserStories([])
        setIsLoadingStories(false)
      }
    }

    fetchStories()
  }, [user]) // Re-run when user changes

  // Handle clicking on a story card
  const handleStoryClick = (storyId: string) => {
    // Navigate to the story detail page (assuming a route like /story/[id])
    // TODO: Implement the actual story detail page/viewer logic
    // For now, let's just log it or navigate if the route exists
    console.log("Navigate to story:", storyId)
    // router.push(`/story/${storyId}`); // Uncomment when story page exists
    alert(`Navigate to story: ${storyId} (page not implemented yet)`)
  }

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
  const userAvatar = user.user_metadata?.avatar_url || "/placeholder.svg" // Use placeholder

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
          {/* Update story count dynamically */}
          <div className="stat-number text-xl font-bold text-highlight dark:text-highlight">
            {isLoadingStories ? "..." : userStories.length}
          </div>
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
        <h3 className="text-xl font-bold mb-4 text-highlight dark:text-highlight">Your Stories</h3>
        {isLoadingStories ? (
          <div className="text-center p-8">Loading your stories...</div>
        ) : errorLoadingStories ? (
          <div className="text-center p-8 text-red">{errorLoadingStories}</div>
        ) : userStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {userStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={() => handleStoryClick(story.id)} // Add onClick handler
              />
            ))}
          </div>
        ) : (
          <div className="empty-state p-8 text-center bg-white dark:bg-paper-dark rounded-lg border border-paper-dark dark:border-paper">
            <div className="text-5xl mb-4 text-ink-light dark:text-ink-light">
              <i className="fas fa-book-open"></i>
            </div>
            <h4 className="text-lg font-medium mb-2 text-ink dark:text-ink">No stories yet</h4>
            <p className="text-ink-light dark:text-ink-light mb-4">You haven't created any stories yet.</p>
            {/* TODO: Link this button to the Create Tab */}
            <button className="px-4 py-2 bg-highlight dark:bg-highlight text-white rounded-lg font-medium hover:bg-highlight/90 transition-colors">
              Create your first story
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
