"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2 } from "lucide-react"
import { Send, X, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/utils"
import { handleAuthAction } from "@/lib/supabase"

// Comment type definition
type Comment = {
  id: string
  author_id: string
  story_id: string
  content: string
  created_at: string
  updated_at?: string
  likes_count: number | null
  user_has_liked: boolean
  profiles: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

// Props for the CommentsSection component
type CommentsSectionProps = {
  storyId: string
  onClose: () => void
}

export default function CommentsSection({ storyId, onClose }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animatingCommentId, setAnimatingCommentId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const { toast } = useToast()
  const [optimisticLikes, setOptimisticLikes] = useState<{ [commentId: string]: { liked: boolean; count: number } }>({})

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments()
  }, [storyId])

  // Focus the comment input when the component mounts
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }, [])

  // Fetch comments from the API
  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/comments?storyId=${storyId}`, {
        credentials: "include", // Include cookies for authentication
      })
      if (!response.ok) throw new Error("Failed to fetch comments")
      const { data } = await response.json()
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
      setComments([]) // Ensure comments is always an array
    } finally {
      setIsLoading(false)
    }
  }

  // Handle comment input change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)

    // Auto-resize the textarea
    if (commentInputRef.current) {
      commentInputRef.current.style.height = "80px" // Reset height
      commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 200)}px` // Set new height with max limit
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return

    try {
      await handleAuthAction(async () => {
        setIsSubmitting(true)

        try {
          const response = await fetch("/api/comments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storyId,
              content: newComment.trim(),
            }),
            credentials: "include", // Include cookies for authentication
          })

          if (!response.ok) {
            throw new Error("Failed to post comment")
          }

          const { data } = await response.json()

          // Add animation class to the new comment
          setAnimatingCommentId(data.id)

          // Add the new comment to the top of the list
          setComments([data, ...comments])
          setNewComment("")

          // Reset textarea height
          if (commentInputRef.current) {
            commentInputRef.current.style.height = "80px"
          }

          // Scroll to top to show the new comment
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = 0
          }

          // Show success toast
          toast({
            title: "Comment posted!",
            description: "Your comment has been added to the discussion.",
            variant: "default",
          })

          // Remove animation class after a delay
          setTimeout(() => {
            setAnimatingCommentId(null)
          }, 1500)
        } catch (error) {
          console.error("Error posting comment:", error)
          toast({
            title: "Error",
            description: "Failed to post your comment. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsSubmitting(false)
        }
      }, openModal)
    } catch (error) {
      console.error("Error in comment submission:", error)
    }
  }

  // Handle keyboard shortcuts for comment submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without shift for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCommentSubmit()
    }
  }

  // Handle liking/unliking a comment
  const handleLikeComment = async (commentId: string, currentLiked: boolean, currentLikesCount: number) => {
    await handleAuthAction(async () => {
      const originalComments = [...comments] // Store original state for rollback
      const originalOptimisticState = { ...optimisticLikes }

      // Optimistic UI update
      const newLiked = !currentLiked
      const newLikesCount = currentLiked ? currentLikesCount - 1 : currentLikesCount + 1

      // Start animation
      setAnimatingCommentId(commentId)

      setOptimisticLikes((prev) => ({
        ...prev,
        [commentId]: { liked: newLiked, count: newLikesCount },
      }))

      // Update the main comments state optimistically as well for immediate visual feedback
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, user_has_liked: newLiked, likes_count: newLikesCount } : comment,
        ),
      )

      try {
        const method = newLiked ? "POST" : "DELETE"
        const url = newLiked ? "/api/comments/likes" : `/api/comments/likes?commentId=${commentId}`
        const body = newLiked ? JSON.stringify({ commentId }) : undefined

        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: body,
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to ${newLiked ? "like" : "unlike"} comment`)
        }

        // Success - API call confirmed the optimistic update
        toast({
          title: newLiked ? "Comment liked!" : "Like removed",
          description: newLiked ? "You liked this comment." : "You removed your like from this comment.",
          variant: "default",
        })
      } catch (error: any) {
        console.error("Error liking/unliking comment:", error)
        toast({
          title: "Error",
          description: error.message || "Could not update like status.",
          variant: "destructive",
        })

        // Rollback optimistic update on error
        setComments(originalComments)
        setOptimisticLikes(originalOptimisticState)
      } finally {
        // End animation after a delay
        setTimeout(() => {
          setAnimatingCommentId(null)
        }, 600)
      }
    }, openModal)
  }

  return (
    <div className="comments-section flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="comments-header sticky top-0 z-10 flex items-center justify-between p-4 border-b border-paper-dark/20 dark:border-paper/20 bg-paper dark:bg-paper-dark">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-highlight" />
          <h2 className="text-lg font-semibold text-ink dark:text-ink-light">Comments</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-paper-dark/10 dark:hover:bg-paper/10 transition-colors"
          aria-label="Close comments"
        >
          <X className="h-5 w-5 text-ink-light dark:text-ink-light" />
        </button>
      </div>

      {/* Comments list */}
      <div
        ref={commentsContainerRef}
        className="comments-list flex-1 overflow-y-auto p-4 space-y-4 bg-paper/50 dark:bg-paper-dark/50"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 text-highlight animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            // Check if we have optimistic UI state for this comment
            const optimisticState = optimisticLikes[comment.id]
            const isLiked = optimisticState ? optimisticState.liked : comment.user_has_liked
            const likesCount = optimisticState ? optimisticState.count : comment.likes_count || 0

            return (
              <div
                key={comment.id}
                className={`comment bg-paper dark:bg-paper-dark rounded-lg shadow-sm p-4 transition-all ${
                  animatingCommentId === comment.id ? "animate-pulse border-l-4 border-highlight" : ""
                }`}
              >
                <div className="comment-header flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-paper-dark/20 dark:border-paper/20 flex-shrink-0">
                      <Link href={`/profile/${comment.profiles.id}`}>
                        <Image
                          src={comment.profiles.avatar_url || "/placeholder.svg"}
                          alt={comment.profiles.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    </div>
                    <div>
                      <Link
                        href={`/profile/${comment.profiles.id}`}
                        className="font-medium text-sm hover:text-highlight dark:hover:text-highlight transition-colors"
                      >
                        {comment.profiles.name}
                      </Link>
                      <div className="text-xs text-ink-light dark:text-ink-light">
                        {formatTimeAgo(new Date(comment.created_at))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="comment-body pl-12 mb-3">
                  <p className="text-sm text-ink dark:text-ink-light whitespace-pre-line">{comment.content}</p>
                </div>
                <div className="comment-actions pl-12 flex items-center gap-4">
                  <button
                    onClick={() => handleLikeComment(comment.id, isLiked, likesCount)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      isLiked
                        ? "text-highlight"
                        : "text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
                    }`}
                    aria-label={isLiked ? "Unlike comment" : "Like comment"}
                  >
                    <Heart
                      className={`h-4 w-4 transition-all ${
                        isLiked ? "fill-current" : ""
                      } ${animatingCommentId === comment.id ? "scale-125" : ""}`}
                    />
                    <span>{likesCount > 0 ? likesCount : ""}</span>
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageCircle className="h-8 w-8 text-ink-light dark:text-ink-light mb-2 opacity-50" />
            <p className="text-ink-light dark:text-ink-light">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="comment-input-container sticky bottom-0 p-4 border-t border-paper-dark/20 dark:border-paper/20 bg-paper dark:bg-paper-dark">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="w-full h-12 p-3 pr-10 bg-paper-dark/10 dark:bg-paper/10 rounded-lg resize-none focus:ring-2 focus:ring-highlight/50 focus:outline-none text-ink dark:text-ink-light placeholder:text-ink-light/50 dark:placeholder:text-ink-light/50"
              disabled={isSubmitting || !user}
            />
          </div>
          <button
            onClick={handleCommentSubmit}
            disabled={!newComment.trim() || isSubmitting || !user}
            className={`h-12 w-12 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              !newComment.trim() || isSubmitting || !user
                ? "bg-paper-dark/20 dark:bg-paper/20 text-ink-light/50 dark:text-ink-light/50 cursor-not-allowed"
                : "bg-highlight text-white hover:bg-highlight/80"
            }`}
            aria-label="Post comment"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        {!user && (
          <p className="mt-2 text-center text-xs text-ink-light dark:text-ink-light">
            <button
              onClick={openModal}
              className="text-highlight hover:underline"
            >
              Sign in
            </button>{" "}
            to join the conversation
          </p>
        )}
      </div>
    </div>
  )
}
