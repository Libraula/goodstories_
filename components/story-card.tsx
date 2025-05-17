"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatTimeAgo } from "@/lib/utils"
import { BookmarkIcon, HeartIcon } from "lucide-react"
import { toggleBookmark, isBookmarked, toggleLike, isLiked } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import type { Story } from "@/lib/types"

interface StoryCardProps {
  story: Story
  onClick?: () => void // Add onClick prop
}

export default function StoryCard({ story, onClick }: StoryCardProps) {
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const [isBookmarkedByUser, setIsBookmarkedByUser] = useState(false)
  const [isLikedByUser, setIsLikedByUser] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeCount, setLikeCount] = useState(story.like_count || 0)

  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user) return

      try {
        const [bookmarkStatus, likeStatus] = await Promise.all([
          isBookmarked(user.id, story.id),
          isLiked(user.id, story.id),
        ])
        setIsBookmarkedByUser(bookmarkStatus)
        setIsLikedByUser(likeStatus)
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
      const newStatus = await toggleBookmark(user.id, story.id)
      setIsBookmarkedByUser(newStatus)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
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
      const result = await toggleLike(user.id, story.id)
      setIsLikedByUser(result.status)
      setLikeCount(result.count)
    } catch (error) {
      console.error("Error toggling like:", error)
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

  return (
    <div
      className="bg-paper dark:bg-paper-dark rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
      onClick={handleCardClick} // Add click handler
    >
      {story.cover_image && (
        <div className="relative w-full h-40">
          <Image
            src={story.cover_image || "/placeholder.svg"}
            alt={story.title || "Story cover"}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{story.title}</h3>
        <p className="text-ink-light dark:text-ink-light mb-4 line-clamp-3">{story.excerpt || story.content}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
              <Image
                src={story.author?.avatar_url || "/placeholder.svg"}
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
              <HeartIcon
                className={`h-5 w-5 ${isLikedByUser ? "fill-highlight text-highlight" : "fill-none"} transition-colors`}
              />
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
              <BookmarkIcon className={`h-5 w-5 ${isBookmarkedByUser ? "fill-highlight" : "fill-none"}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
