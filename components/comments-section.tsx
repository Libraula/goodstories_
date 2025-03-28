"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Send, X, Heart, MessageCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"

// Comment type definition
type Comment = {
  id: number
  author: {
    name: string
    avatar: string
  }
  name?: string
  avatar?: string
  text: string
  time: string
  likes: number
  isLiked?: boolean
}

// Props for the CommentsSection component
type CommentsSectionProps = {
  storyId: string
  onClose: () => void
}

const initialComments: Comment[] = [
  {
    id: 1,
    author: {
      name: "Jane Cooper",
      avatar: "https://randomuser.me/api/portraits/women/10.jpg",
    },
    text: "This story really resonated with me. The author's perspective on climate change is refreshing and thought-provoking.",
    time: "2 hours ago",
    likes: 24,
    isLiked: false,
  },
  {
    id: 2,
    author: {
      name: "Devon Lane",
      avatar: "https://randomuser.me/api/portraits/men/86.jpg",
    },
    text: "I found the character development to be exceptional. Each person felt real and relatable.",
    time: "5 hours ago",
    likes: 17,
    isLiked: true,
  },
  {
    id: 3,
    author: {
      name: "Esther Howard",
      avatar: "https://randomuser.me/api/portraits/women/90.jpg",
    },
    text: "The plot twist at the end was completely unexpected! I had to re-read that part twice to make sure I understood correctly.",
    time: "1 day ago",
    likes: 42,
    isLiked: false,
  },
]

export default function CommentsSection({ storyId, onClose }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  // Focus the comment input when the component mounts
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }, [])

  // Handle comment input change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)

    // Auto-resize the textarea
    if (commentInputRef.current) {
      commentInputRef.current.style.height = "80px" // Reset height
      commentInputRef.current.style.height = `${Math.min(
        commentInputRef.current.scrollHeight,
        200
      )}px` // Set new height with max limit
    }
  }

  // Handle comment submission
  const handleCommentSubmit = () => {
    if (!user) {
      openModal()
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    // Simulate API call delay
    setTimeout(() => {
      const newCommentObj: Comment = {
        id: Date.now(),
        author: {
          name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Anonymous",
          avatar: user?.user_metadata?.avatar_url || "https://randomuser.me/api/portraits/women/65.jpg",
        },
        text: newComment.trim(),
        time: "Just now",
        likes: 0,
        isLiked: false,
      }

      setComments([newCommentObj, ...comments])
      setNewComment("")
      setIsSubmitting(false)

      // Reset textarea height
      if (commentInputRef.current) {
        commentInputRef.current.style.height = "80px"
      }

      // Scroll to top to show the new comment
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = 0
      }
    }, 500)
  }

  // Handle keyboard shortcuts for comment submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleCommentSubmit()
    }
  }

  // Toggle like on a comment
  const toggleLike = (commentId: number) => {
    if (!user) {
      openModal()
      return
    }

    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked
          return {
            ...comment,
            isLiked: newIsLiked,
            likes: newIsLiked ? comment.likes + 1 : comment.likes - 1,
          }
        }
        return comment
      })
    )
  }

  return (
    <div className="comments-section flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="comments-header sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border dark:border-border bg-paper dark:bg-paper-dark">
        <div className="flex items-center">
          <button onClick={onClose} className="mr-2 text-ink-light dark:text-ink-light hover:text-ink dark:hover:text-ink">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comments ({comments.length})
          </h2>
        </div>
        
        <div className="text-sm text-ink-light dark:text-ink-light">
          {storyId && `Story #${storyId}`}
        </div>
      </div>

      {/* Comments list */}
      <div ref={commentsContainerRef} className="comments-list flex-1 overflow-y-auto p-4 space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-ink-light dark:text-ink-light">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item animate-fadeIn">
              <div className="comment-header flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <Image
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <div className="font-medium">{comment.author.name}</div>
                    <div className="text-xs text-ink-light dark:text-ink-light">{comment.time}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(comment.id)}
                  className={`like-button flex items-center ${
                    comment.isLiked ? "text-red-500 dark:text-red-500" : "text-ink-light dark:text-ink-light"
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                  <span className="text-xs">{comment.likes}</span>
                </button>
              </div>
              <div className="comment-text text-sm bg-paper-light dark:bg-paper-dark/50 p-3 rounded-lg">
                {comment.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="comment-input-container sticky bottom-0 border-t border-border dark:border-border p-4 bg-paper dark:bg-paper-dark">
        <div className="flex items-start">
          <Image
            src={user?.user_metadata?.avatar_url || "https://randomuser.me/api/portraits/women/65.jpg"}
            alt={user?.user_metadata?.full_name || user?.email?.split('@')[0] || "You"}
            width={40}
            height={40}
            className="rounded-full mr-3"
          />
          <div className="flex-1 relative">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              className="w-full border border-border dark:border-border rounded-lg p-3 pr-12 resize-none bg-white dark:bg-paper-dark text-sm min-h-[80px] focus:ring-2 focus:ring-highlight/30 focus:border-highlight dark:focus:border-highlight"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-3 bottom-3 text-highlight dark:text-highlight disabled:text-ink-light disabled:dark:text-ink-light"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="text-xs text-ink-light dark:text-ink-light mt-2 text-right">
          Press Ctrl+Enter to post
        </div>
      </div>
    </div>
  )
}
