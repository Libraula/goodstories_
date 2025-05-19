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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div 
        className="comments-section flex flex-col bg-paper dark:bg-paper-dark text-ink dark:text-ink-light w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent click bubbling to the overlay
      >
        {/* Header */}
        <div className="comments-header sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-border bg-paper dark:bg-paper-dark">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Comments ({comments?.length || 0})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-ink p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div ref={commentsContainerRef} className="comments-list flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
          {isLoading ? (
            <div className="text-center py-8 text-ink-light dark:text-ink-light">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-highlight mb-3" />
                <p className="text-lg font-medium">Loading comments...</p>
              </div>
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 text-ink-light dark:text-ink-light">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className={`comment-item py-3 px-2 rounded-lg hover:bg-paper-dark/5 dark:hover:bg-paper/5 transition-colors ${animatingCommentId === comment.id ? "animate-pulse bg-highlight/5" : ""}`}
                >
                  <div className="comment-header flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <Link href={`/profile/${comment.author_id}`} className="flex-shrink-0">
                        <Image
                          src={comment.profiles.avatar_url || "/placeholder.svg"}
                          alt={comment.profiles.name || comment.profiles.username}
                          width={40}
                          height={40}
                          className="rounded-full mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </Link>
                      <div>
                        <div className="font-medium">{comment.profiles.name || comment.profiles.username}</div>
                        <div className="text-xs text-ink-light dark:text-ink-light">
                          {formatTimeAgo(comment.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="comment-text text-sm bg-paper-light dark:bg-paper-dark/50 p-3 rounded-lg ml-[52px] shadow-sm">
                    {comment.content}
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-ink-light dark:text-ink-light ml-2 italic">(edited)</span>
                    )}
                  </div>
                  {/* Like button and count */}
                  <div className="comment-actions flex items-center mt-2 ml-[52px]">
                    <button
                      onClick={() =>
                        handleLikeComment(
                          comment.id,
                          optimisticLikes[comment.id]?.liked ?? comment.user_has_liked,
                          optimisticLikes[comment.id]?.count ?? comment.likes_count ?? 0,
                        )
                      }
                      className={`flex items-center text-xs mr-4 transition-colors duration-150 ${
                        (optimisticLikes[comment.id]?.liked ?? comment.user_has_liked ?? false)
                          ? "text-red-500 hover:text-red-600"
                          : "text-ink-light dark:text-ink-light hover:text-red-500"
                      }`}
                      aria-label={
                        (optimisticLikes[comment.id]?.liked ?? comment.user_has_liked ?? false)
                          ? "Unlike comment"
                          : "Like comment"
                      }
                    >
                      <Heart
                        className={`w-4 h-4 mr-1 ${
                          (optimisticLikes[comment.id]?.liked ?? comment.user_has_liked ?? false) ? "fill-current" : ""
                        } ${animatingCommentId === comment.id ? "animate-ping" : ""}`}
                      />
                      <span>{optimisticLikes[comment.id]?.count ?? comment.likes_count ?? 0}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Comment input - improved for mobile */}
        <div className="comment-input-container sticky bottom-0 border-t border-border p-3 sm:p-4 bg-paper dark:bg-paper-dark">
          <div className="flex items-start space-x-3">
            <Image
              src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
              alt={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You"}
              width={40}
              height={40}
              className="rounded-full mr-3 flex-shrink-0"
            />
            <div className="flex-1 relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="w-full border border-border rounded-lg p-3 pr-12 resize-none bg-paper-light dark:bg-stone-700 text-sm min-h-[50px] focus:ring-1 focus:ring-highlight focus:border-highlight shadow-sm transition-colors duration-150"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="absolute right-3 bottom-3 bg-highlight text-white p-2 rounded-full disabled:bg-highlight/50 disabled:text-white/70 transition-colors"
                aria-label="Send comment"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-xs text-ink-light dark:text-ink-light mt-2 text-right">
            Press Enter to post (Shift+Enter for new line)
          </div>
        </div>
      </div>
    </div>
  )
}
