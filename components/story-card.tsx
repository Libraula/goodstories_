"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatTimeAgo } from "@/lib/utils"
import { BookmarkIcon, HeartIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { useToast } from "@/hooks/use-toast"
import type { Story } from "@/lib/types"

interface StoryCardProps {
  story: Story
  onClick?: () => void // Add onClick prop
}

export default function StoryCard({ story, onClick }: StoryCardProps) {
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const { toast } = useToast()
  const [isBookmarkedByUser, setIsBookmarkedByUser] = useState(false)
  const [isLikedByUser, setIsLikedByUser] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeCount, setLikeCount] = useState(story.like_count || 0)
  const [bookmarkCount, setBookmarkCount] = useState(story.bookmark_count || 0)

  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user) return

      try {
        // Check bookmark status
        const bookmarkResponse = await fetch(`/api/bookmarks/check?storyId=${story.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json()
          setIsBookmarkedByUser(bookmarkData.isBookmarked || false)
        }

        // Check like status
        const likeResponse = await fetch(`/api/likes/check?storyId=${story.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (likeResponse.ok) {
          const likeData = await likeResponse.json()
          setIsLikedByUser(likeData.isLiked || false)
        }
      } catch (error) {
        console.error("Error checking user interactions:", error)
      }
    }

    checkUserInteractions()
  }, [user, story.id])

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!user) {
      openModal()
      return
    }

    setBookmarkLoading(true)
    try {
      const newIsBookmarked = !isBookmarkedByUser

      // Optimistic UI update
      setIsBookmarkedByUser(newIsBookmarked)
      setBookmarkCount((prevCount) => (newIsBookmarked ? prevCount + 1 : Math.max(0, prevCount - 1)))

      if (newIsBookmarked) {
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId: story.id }),
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to bookmark story")
        }

        toast({
          title: "Story bookmarked!",
          description: "This story has been added to your bookmarks.",
          variant: "default",
        })
      } else {
        const response = await fetch(`/api/bookmarks?storyId=${story.id}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to remove bookmark")
        }

        toast({
          title: "Bookmark removed",
          description: "This story has been removed from your bookmarks.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      
      // Revert optimistic update on error
      setIsBookmarkedByUser(!isBookmarkedByUser)
      setBookmarkCount((prevCount) => (!isBookmarkedByUser ? prevCount + 1 : Math.max(0, prevCount - 1)))
      
      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!user) {
      openModal()
      return
    }

    setLikeLoading(true)
    try {
      const newIsLiked = !isLikedByUser

      // Optimistic UI update
      setIsLikedByUser(newIsLiked)
      setLikeCount((prevCount) => (newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1)))

      if (newIsLiked) {
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId: story.id }),
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to like story")
        }

        toast({
          title: "Story liked!",
          description: "This story has been added to your likes.",
          variant: "default",
        })
      } else {
        const response = await fetch(`/api/likes?storyId=${story.id}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to unlike story")
        }

        toast({
          title: "Like removed",
          description: "This story has been removed from your likes.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      
      // Revert optimistic update on error
      setIsLikedByUser(!isLikedByUser)
      setLikeCount((prevCount) => (!isLikedByUser ? prevCount + 1 : Math.max(0, prevCount - 1)))
      
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLikeLoading(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault() // Prevent default navigation
      onClick()
    }
  }

  // Get the first page image as cover if available
  const coverImage = story.pages?.[0]?.image || "/placeholder.svg"
  const excerpt = story.pages?.[0]?.content?.[0]?.substring(0, 120) || "No description available"

  return (
    <div
      className="bg-paper dark:bg-paper-dark rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
      onClick={handleCardClick} // Add click handler
    >
      <div className="relative w-full h-40">
        <Image
          src={coverImage}
          alt={story.title || "Story cover"}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{story.title}</h3>
        <p className="text-ink-light dark:text-ink-light mb-4 line-clamp-3">{excerpt}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
              <Image
                src={story.author?.avatar || "/placeholder.svg"}
                alt={story.author?.name || "Author"}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div>
              <Link
                href={`/profile/${story.author_id}`}
                className="text-sm font-medium hover:underline"
                onClick={(e) => e.stopPropagation()} // Prevent card click when clicking author link
              >
                {story.author?.name || "Anonymous"}
              </Link>
              <p className="text-xs text-ink-light dark:text-ink-light">{formatTimeAgo(new Date(story.created_at))}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeToggle}
              disabled={likeLoading}
              className="flex items-center space-x-1 text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight transition-colors"
              aria-label={isLikedByUser ? "Unlike story" : "Like story"}
            >
              {likeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HeartIcon
                  className={`h-5 w-5 ${isLikedByUser ? "fill-highlight text-highlight" : "fill-none"} transition-colors`}
                />
              )}
              <span className="text-xs">{likeCount}</span>
            </button>
            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              className={`p-1 rounded-full ${
                isBookmarkedByUser
                  ? "text-highlight"
                  : "text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
              } transition-colors`}
              aria-label={isBookmarkedByUser ? "Remove bookmark" : "Bookmark story"}
            >
              {bookmarkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkIcon className={`h-5 w-5 ${isBookmarkedByUser ? "fill-highlight" : "fill-none"}`} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
