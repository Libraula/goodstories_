"use client"

import { useState, useEffect } from "react"
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { useToast } from "@/hooks/use-toast"

interface FollowButtonProps {
  authorId: string
  authorName: string
  className?: string
  variant?: "default" | "small" | "large"
  showText?: boolean
}

export default function FollowButton({
  authorId,
  authorName,
  className = "",
  variant = "default",
  showText = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const { toast } = useToast()

  // Check if user is following the author
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !authorId || user.id === authorId) {
        setHasChecked(true)
        return
      }

      try {
        setFollowLoading(true)
        const response = await fetch(`/api/follows?followingId=${authorId}`, {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.isFollowing)
        } else {
          console.error("Error checking follow status:", await response.text())
          setIsFollowing(false)
        }
      } catch (error) {
        console.error("Failed to check follow status:", error)
        setIsFollowing(false)
      } finally {
        setFollowLoading(false)
        setHasChecked(true)
      }
    }

    checkFollowStatus()
  }, [user, authorId])

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    // If not logged in, show login modal
    if (!user) {
      openModal()
      return
    }

    // Prevent following yourself
    if (user.id === authorId) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile.",
        variant: "default",
      })
      return
    }

    if (followLoading) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        // Unfollow request
        setIsFollowing(false) // Optimistic update
        const response = await fetch(`/api/follows?followingId=${authorId}`, {
          method: "DELETE",
          credentials: "include",
        })

        if (response.ok) {
          toast({
            title: "Unfollowed",
            description: `You've unfollowed ${authorName}`,
            variant: "default",
          })
        } else {
          // Revert UI on error
          setIsFollowing(true)
          throw new Error("Failed to unfollow")
        }
      } else {
        // Follow request
        setIsFollowing(true) // Optimistic update
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId: authorId }),
          credentials: "include",
        })

        if (response.ok) {
          toast({
            title: "Following",
            description: `You're now following ${authorName}`,
            variant: "default",
          })
        } else {
          // Revert UI on error
          setIsFollowing(false)
          throw new Error("Failed to follow")
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
      toast({
        title: "Error",
        description: "Could not update follow status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Don't render if this is the user's own profile
  if (user && user.id === authorId) {
    return null
  }

  // Size and style variants
  let sizeClasses = ""
  let iconSize = ""
  switch (variant) {
    case "small":
      sizeClasses = "w-6 h-6 text-xs"
      iconSize = "h-3 w-3"
      break
    case "large":
      sizeClasses = "w-10 h-10 text-sm"
      iconSize = "h-5 w-5"
      break
    default:
      sizeClasses = "w-8 h-8 text-xs"
      iconSize = "h-4 w-4"
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={followLoading || !hasChecked}
      aria-label={isFollowing ? `Unfollow ${authorName}` : `Follow ${authorName}`}
      className={`flex items-center justify-center rounded-full ${sizeClasses} ${
        isFollowing
          ? "bg-paper-dark dark:bg-paper text-ink-light dark:text-ink hover:bg-red-100 dark:hover:bg-red-900"
          : "bg-highlight text-white hover:bg-highlight/90"
      } transition-colors ${className}`}
    >
      {followLoading ? (
        <Loader2 className={`animate-spin ${iconSize}`} />
      ) : isFollowing ? (
        <div className="flex items-center gap-1">
          <MinusCircle className={iconSize} />
          {showText && <span>{isFollowing ? "Unfollow" : "Follow"}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <PlusCircle className={iconSize} />
          {showText && <span>Follow</span>}
        </div>
      )}
    </button>
  )
} 