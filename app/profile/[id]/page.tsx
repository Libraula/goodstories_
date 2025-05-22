"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getUserProfile, getUserStories } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import StoryCard from "@/components/story-card"
import StoryViewer from "@/components/story-viewer" // Import StoryViewer
import FollowButton from "@/components/follow-button" // Import the new FollowButton component
import { Loader2, ArrowLeft } from "lucide-react"
import type { Story } from "@/lib/types"

interface ProfileData {
  id: string
  username?: string
  name?: string
  bio?: string
  avatar_url?: string
  story_count?: number
  follower_count?: number
  following_count?: number
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string // Explicitly get id and assert as string
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [isViewingStory, setIsViewingStory] = useState(false) // State for viewer visibility
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null) // State for selected story index

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const profileData = await getUserProfile(id as string)
        setProfile(profileData)

        const userStories = await getUserStories(id as string)
        setStories(userStories)

        // Follow status is now checked by the FollowButton component
        setIsFollowing(false) // Default value, not actually used anymore
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [id, user])

  // Removed handleFollowToggle as we're now using the FollowButton component

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index)
    setIsViewingStory(true)
  }

  const handleCloseViewer = () => {
    setIsViewingStory(false)
    setSelectedStoryIndex(null)
  }

  const handleBackClick = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-highlight" />
      </div>
    )
  }

  // If viewing a story, render the StoryViewer
  if (isViewingStory && selectedStoryIndex !== null && stories.length > 0) {
    return (
      <StoryViewer
        stories={stories}
        initialIndex={selectedStoryIndex!} // Use non-null assertion
        onClose={handleCloseViewer}
      />
    )
  }

  // Otherwise, render the profile page content
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button onClick={handleBackClick} className="flex items-center text-highlight hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </button>
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <p>The author profile you're looking for doesn't exist.</p>
        <Link href="/" className="text-highlight hover:underline mt-4 inline-block">
          Return to home
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <button onClick={handleBackClick} className="flex items-center text-highlight hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Home
      </button>

      {/* Profile Header */}
      <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-highlight">
            <Image
              src={profile.avatar_url || "/placeholder.svg"}
              alt={profile.name || "Author"}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-ink-light dark:text-ink-light mb-2">@{profile.username}</p>

            {profile.bio && <p className="mb-4">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="text-center">
                <span className="block font-bold">{profile.story_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Stories</span>
              </div>
              <div className="text-center">
                <span className="block font-bold">{profile.follower_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Followers</span>
              </div>
              <div className="text-center">
                <span className="block font-bold">{profile.following_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Following</span>
              </div>
            </div>
          </div>

          {user && user.id !== profile.id && (
            <FollowButton 
              authorId={profile.id}
              authorName={profile.name || "Author"}
              showText
              variant="default"
              className="px-4 py-2"
            />
          )}
        </div>
      </div>

      {/* Stories Section */}
      <h2 className="text-xl font-bold mb-4">Stories by {profile.name}</h2>

      {stories.length === 0 ? (
        <p className="text-ink-light dark:text-ink-light">This author hasn't published any stories yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, index) => (
            <div key={story.id}>
              <StoryCard story={story} onClick={() => handleStoryClick(index)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
