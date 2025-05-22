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
  const [commentCount, setCommentCount] = useState(0)
  const [isDraggedUp, setIsDraggedUp] = useState(false)
  const startY = useRef<number | null>(null)

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
      setCommentCount(data?.length || 0)
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
      commentInputRef.current.style.height = "56px" // Reset height
      commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 120)}px` // Set new height with max limit
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
          setCommentCount(prev => prev + 1)

          // Reset textarea height
          if (commentInputRef.current) {
            commentInputRef.current.style.height = "56px"
          }

          // Scroll to top to show the new comment
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = 0
          }

          // Remove animation class after a delay
          setTimeout(() => {
            setAnimatingCommentId(null)
          }, 800)
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
      } catch (error: any) {
        console.error("Error liking/unliking comment:", error)
        
        // Rollback optimistic update on error
        setComments(originalComments)
        setOptimisticLikes(originalOptimisticState)
        
        toast({
          title: "Error",
          description: error.message || "Could not update like status.",
          variant: "destructive",
        })
      } finally {
        // End animation after a delay
        setTimeout(() => {
          setAnimatingCommentId(null)
        }, 400)
      }
    }, openModal)
  }
  
  // Add touch gesture handlers for TikTok-like interaction  
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    // If user drags down more than 50px, close the comments
    if (diff > 100) {
      setIsDraggedUp(false)
      startY.current = null
      onClose()
    }
  }
  
  const handleTouchEnd = () => {
    startY.current = null
  }
  
  useEffect(() => {
    // Animate in on mount
    const timer = setTimeout(() => {
      setIsDraggedUp(true)
    }, 10)
    
    // Add class to body to prevent scrolling
    document.body.classList.add('comments-open')
    
    // Clean up
    return () => {
      clearTimeout(timer)
      document.body.classList.remove('comments-open')
    }
  }, [])

  return (
    <div 
      className="comments-section fixed inset-0 z-[9999] bg-transparent"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop with click to close */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isDraggedUp ? 1 : 0 }}
      />
      
      {/* Comments container */}
      <div 
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-paper dark:bg-paper-dark rounded-t-2xl overflow-hidden shadow-xl transition-transform duration-300 ease-out transform"
        style={{ 
          transform: isDraggedUp ? 'translateY(0)' : 'translateY(100%)',
          touchAction: 'none'
        }}
      >
        {/* Handle for dragging */}
        <div className="drag-handle absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-pointer">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="comments-header sticky top-0 z-10 flex items-center justify-between px-5 pt-6 pb-2 border-b border-paper-dark/10 dark:border-paper/10 bg-paper dark:bg-paper-dark">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-highlight" />
            <h2 className="text-lg font-semibold text-ink dark:text-ink-light">
              Comments <span className="text-sm font-normal text-ink-light">({commentCount})</span>
            </h2>
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
          className="comments-list overflow-y-auto overscroll-contain px-5 space-y-4 bg-paper/50 dark:bg-paper-dark/50"
          style={{ height: 'calc(60vh - 130px)' }}
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
                  className={`comment flex items-start py-3 ${
                    animatingCommentId === comment.id ? "animate-pulse-light" : ""
                  }`}
                >
                  {/* User avatar */}
                  <Link href={`/profile/${comment.profiles.id}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-paper-dark/10 dark:border-paper/10">
                      <Image
                        src={comment.profiles.avatar_url || "/placeholder.svg"}
                        alt={comment.profiles.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  
                  {/* Comment content */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex flex-col">
                      <Link
                        href={`/profile/${comment.profiles.id}`}
                        className="font-medium text-sm hover:text-highlight dark:hover:text-highlight transition-colors"
                      >
                        {comment.profiles.name}
                      </Link>
                      <p className="text-sm text-ink dark:text-ink-light break-words whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-ink-light dark:text-ink-light">
                        <span>{formatTimeAgo(new Date(comment.created_at))}</span>
                        {likesCount > 0 && <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Like button */}
                  <button
                    onClick={() => handleLikeComment(comment.id, isLiked, likesCount)}
                    className={`flex flex-col items-center ml-3 transition-colors ${
                      isLiked
                        ? "text-highlight"
                        : "text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
                    }`}
                    aria-label={isLiked ? "Unlike comment" : "Like comment"}
                  >
                    <Heart
                      className={`h-5 w-5 transition-all ${
                        isLiked ? "fill-highlight" : ""
                      } ${animatingCommentId === comment.id ? "scale-125" : ""}`}
                    />
                  </button>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center my-12">
              <MessageCircle className="h-10 w-10 text-ink-light dark:text-ink-light mb-3 opacity-40" />
              <p className="text-ink-light dark:text-ink-light">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="comment-input-container sticky bottom-0 px-5 py-4 border-t border-paper-dark/10 dark:border-paper/10 bg-paper dark:bg-paper-dark">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {user && (
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  <Image
                    src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                    alt="Your avatar"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                className="w-full min-h-[56px] max-h-[120px] p-3 pr-12 bg-paper-dark/5 dark:bg-paper/5 rounded-2xl resize-none focus:ring-1 focus:ring-highlight/30 focus:outline-none text-ink dark:text-ink-light placeholder:text-ink-light/50 dark:placeholder:text-ink-light/50"
                disabled={isSubmitting || !user}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || isSubmitting || !user}
                className={`absolute right-2 bottom-[14px] h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  !newComment.trim() || isSubmitting || !user
                    ? "text-ink-light/30 dark:text-ink-light/20 cursor-not-allowed"
                    : "text-highlight hover:bg-highlight/10"
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
    </div>
  )
}

