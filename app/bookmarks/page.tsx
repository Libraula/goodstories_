"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserBookmarks } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import StoryCard from "@/components/story-card"
import StoryViewer from "@/components/story-viewer" // Import StoryViewer
import { Loader2, BookmarkIcon, ArrowLeft } from "lucide-react"
import type { Story } from "@/lib/types"

export default function BookmarksPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const [bookmarks, setBookmarks] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isViewingStory, setIsViewingStory] = useState(false) // State for viewer visibility
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null) // State for selected story index

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        // Don't open modal immediately, let the other effect handle it
        // openModal();
        setIsLoading(false) // Stop loading if no user
        return
      }

      setIsLoading(true)
      try {
        const bookmarkedStories = await getUserBookmarks(user.id)
        console.log("Fetched bookmarked stories:", bookmarkedStories)
        setBookmarks(bookmarkedStories)
      } catch (error) {
        console.error("Error fetching bookmarks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarks()
  }, [user]) // Removed openModal dependency here

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    // Corrected line 48
    if (!isLoading && !user) {
      openModal()
    }
  }, [user, isLoading, openModal])

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index)
    setIsViewingStory(true)
  }

  const handleCloseViewer = () => {
    setIsViewingStory(false)
    setSelectedStoryIndex(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-highlight" />
      </div>
    )
  }

  // If viewing a story, render the StoryViewer
  // Corrected line 72
  if (isViewingStory && selectedStoryIndex !== null && bookmarks.length > 0) {
    return <StoryViewer stories={bookmarks} initialIndex={selectedStoryIndex!} onClose={handleCloseViewer} />
  }

  // Otherwise, render the bookmarks grid or empty state
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/")}
          className="p-1 rounded-full hover:bg-paper-light dark:hover:bg-paper-dark transition-colors"
          aria-label="Back to feed"
        >
          <ArrowLeft className="h-6 w-6 text-ink dark:text-ink-light" />
        </button>
        <div className="flex items-center gap-2">
          <BookmarkIcon className="h-6 w-6 text-highlight" />
          <h1 className="text-2xl font-bold">Your Bookmarks</h1>
        </div>
      </div>

      {!user ? (
        <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md p-8 text-center">
          <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-ink-light/50 dark:text-ink-light/50" />
          <h2 className="text-xl font-semibold mb-2">Log in to see your bookmarks</h2>
          <p className="text-ink-light dark:text-ink-light mb-4">Please log in to view your saved stories.</p>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-highlight text-white rounded-md hover:bg-highlight/90 transition-colors"
          >
            Log In / Sign Up
          </button>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md p-8 text-center">
          <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-ink-light/50 dark:text-ink-light/50" />
          <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
          <p className="text-ink-light dark:text-ink-light mb-4">
            You haven't bookmarked any stories yet. Browse stories and click the bookmark icon to save them for later.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-highlight text-white rounded-md hover:bg-highlight/90 transition-colors"
          >
            Discover Stories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((story, index) => (
            <div key={story.id}>
              <StoryCard story={story} onClick={() => handleStoryClick(index)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

