"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Send, X, Heart, MessageCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"

interface Comment {
  id: number
  author: {
    name: string
    avatar: string
  }
  text: string
  time: string
  likes: number
  isLiked?: boolean
}

interface CommentsSectionProps {
  storyId: string
  onClose: () => void
}

const initialComments: Comment[] = [
  {
    id: 1,
    author: {
      name: "Emma Wilson",
      avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    },
    text: "This story really resonated with me. The way the author describes the library makes me feel like I'm actually there.",
    time: "2 hours ago",
    likes: 24,
  },
  {
    id: 2,
    author: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    text: "I love the concept of books containing the voices of their readers. Such a beautiful metaphor for how stories live on through us.",
    time: "5 hours ago",
    likes: 18,
  },
  {
    id: 3,
    author: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    text: "The ending gave me chills. I'll be thinking about this one for days.",
    time: "1 day ago",
    likes: 42,
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    
    // Auto-resize the textarea
    if (commentInputRef.current) {
      commentInputRef.current.style.height = "auto"
      commentInputRef.current.style.height = `${commentInputRef.current.scrollHeight}px`
    }
  }

  const handleCommentSubmit = () => {
    if (!user) {
      openModal()
      return
    }

    if (!newComment.trim()) return

    // Add the new comment
    const newCommentObj: Comment = {
      id: comments.length + 1,
      author: {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous User",
        avatar: user.user_metadata?.avatar_url || "https://randomuser.me/api/portraits/women/65.jpg",
      },
      text: newComment.trim(),
      time: "Just now",
      likes: 0,
      isLiked: false,
    }

    setComments([newCommentObj, ...comments])
    setNewComment("")

    // Reset textarea height
    if (commentInputRef.current) {
      commentInputRef.current.style.height = "auto"
    }

    // Scroll to top to see the new comment
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = 0
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleCommentSubmit()
    }
  }

  const toggleLike = (commentId: number) => {
    if (!user) {
      openModal()
      return
    }

    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          const wasLiked = comment.isLiked
          return {
            ...comment,
            isLiked: !wasLiked,
            likes: wasLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      })
    )
  }

  return (
    <div className="comments-section flex flex-col h-full">
      <div className="comments-header flex items-center justify-between p-4 border-b border-border dark:border-border">
        <div className="flex items-center">
          <button onClick={onClose} className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Comments</h2>
        </div>
        <button onClick={onClose} className="text-ink-light dark:text-ink-light">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={commentsContainerRef}
        className="comments-list flex-1 overflow-y-auto p-4"
      >
        {comments.map((comment) => (
          <div key={comment.id} className="comment mb-4 bg-white dark:bg-paper-dark p-4 rounded-lg shadow-sm">
            <div className="comment-header flex justify-between items-start mb-2">
              <div className="flex items-center">
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-bold">{comment.author.name}</div>
                  <div className="text-xs text-ink-light dark:text-ink-light">{comment.time}</div>
                </div>
              </div>
              <button
                onClick={() => toggleLike(comment.id)}
                className={`like-button flex items-center ${
                  comment.isLiked ? "text-red dark:text-red" : "text-ink-light dark:text-ink-light"
                }`}
              >
                <Heart className={`w-4 h-4 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                <span className="text-xs">{comment.likes}</span>
              </button>
            </div>
            <div className="comment-text text-sm">{comment.text}</div>
          </div>
        ))}
      </div>

      <div className="comment-input-container border-t border-border dark:border-border p-4">
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
              className="w-full border border-border dark:border-border rounded-lg p-3 pr-12 resize-none bg-white dark:bg-paper-dark text-sm min-h-[80px]"
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
