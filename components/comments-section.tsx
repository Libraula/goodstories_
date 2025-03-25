"use client"

import { useState } from "react"
import Image from "next/image"
import { Send } from "lucide-react"

interface Comment {
  id: number
  author: {
    name: string
    avatar: string
  }
  text: string
  time: string
  likes: number
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

export default function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAddComment = () => {
    if (newComment.trim() === "") return

    const comment: Comment = {
      id: comments.length + 1,
      author: {
        name: "Alex Morgan",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      text: newComment,
      time: "Just now",
      likes: 0,
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleLikeComment = (id: number) => {
    setComments(comments.map((comment) => (comment.id === id ? { ...comment, likes: comment.likes + 1 } : comment)))
  }

  return (
    <div className="comments-section bg-white dark:bg-paper rounded-t-xl shadow-lg border border-paper-dark dark:border-paper-dark w-full max-w-[500px] fixed bottom-0 left-1/2 transform -translate-x-1/2 z-20 md:max-w-[400px] lg:max-w-[600px] lg:left-[calc(300px+50%)] lg:transform-none">
      <div
        className="comments-header p-3 border-b border-paper-dark dark:border-paper-dark flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-bold text-highlight dark:text-highlight">Comments ({comments.length})</h3>
        <div className="text-ink-light dark:text-ink-light">
          <i className={`fas fa-chevron-${isExpanded ? "down" : "up"}`}></i>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="comments-list max-h-[300px] overflow-y-auto p-4">
            {comments.map((comment) => (
              <div key={comment.id} className="comment mb-4 last:mb-0">
                <div className="comment-header flex items-center gap-2 mb-2">
                  <Image
                    src={comment.author.avatar || "/placeholder.svg"}
                    alt={comment.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <div className="comment-author font-bold text-sm text-ink dark:text-ink">{comment.author.name}</div>
                    <div className="comment-time text-xs text-ink-light dark:text-ink-light">{comment.time}</div>
                  </div>
                </div>
                <div className="comment-body ml-10">
                  <p className="text-sm text-ink dark:text-ink mb-2">{comment.text}</p>
                  <div className="comment-actions flex items-center gap-4">
                    <button
                      className="text-xs text-ink-light dark:text-ink-light flex items-center gap-1"
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <i className="fas fa-heart"></i> {comment.likes}
                    </button>
                    <button className="text-xs text-ink-light dark:text-ink-light">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="comment-input-container p-3 border-t border-paper-dark dark:border-paper-dark flex items-center gap-2">
            <Image
              src="https://randomuser.me/api/portraits/women/65.jpg"
              alt="Your avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 p-2 rounded-full bg-paper dark:bg-paper-dark text-ink dark:text-ink text-sm border border-paper-dark dark:border-paper focus:outline-none focus:ring-1 focus:ring-highlight"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button
              className="w-8 h-8 rounded-full bg-highlight dark:bg-highlight flex items-center justify-center text-white"
              onClick={handleAddComment}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

