"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Send, X, Heart, MessageCircle, Trash2, Edit, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { formatTimeAgo } from "@/lib/utils"
import { handleAuthAction } from "@/lib/supabase"

// Comment type definition
type Comment = {
  id: string
  user_id: string
  story_id: string
  content: string
  created_at: string
  updated_at?: string
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()

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

  // Focus edit input when editing a comment
  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingCommentId])

  // Fetch comments from the API
  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/comments?storyId=${storyId}`, {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) throw new Error('Failed to fetch comments')
      const { data } = await response.json()
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
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
      commentInputRef.current.style.height = `${Math.min(
        commentInputRef.current.scrollHeight,
        200
      )}px` // Set new height with max limit
    }
  }

  // Handle edit input change
  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value)

    // Auto-resize the textarea
    if (editInputRef.current) {
      editInputRef.current.style.height = "auto" // Reset height
      editInputRef.current.style.height = `${Math.min(
        editInputRef.current.scrollHeight,
        200
      )}px` // Set new height with max limit
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      await handleAuthAction(async () => {
        setIsSubmitting(true);

        try {
          const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storyId,
              content: newComment.trim(),
            }),
            credentials: 'include', // Include cookies for authentication
          });

          if (!response.ok) {
            throw new Error('Failed to post comment');
          }
          
          const { data } = await response.json();
          setComments([data, ...comments]);
          setNewComment("");

          // Reset textarea height
          if (commentInputRef.current) {
            commentInputRef.current.style.height = "80px";
          }

          // Scroll to top to show the new comment
          if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = 0;
          }
        } catch (error) {
          console.error('Error posting comment:', error);
        } finally {
          setIsSubmitting(false);
        }
      }, openModal);
    } catch (error) {
      console.error('Error in comment submission:', error);
    }
  };

  // Start editing a comment
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  // Cancel editing a comment
  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditContent("")
  }

  // Save edited comment
  const saveEditedComment = async () => {
    if (!editingCommentId || !editContent.trim()) return;

    try {
      await handleAuthAction(async () => {
        try {
          const response = await fetch('/api/comments', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              commentId: editingCommentId,
              content: editContent.trim(),
            }),
            credentials: 'include', // Include cookies for authentication
          });

          if (!response.ok) {
            throw new Error('Failed to update comment');
          }
          
          const { data } = await response.json();
          
          // Update the comment in the local state
          setComments(comments.map(comment => 
            comment.id === editingCommentId 
              ? { ...comment, content: data.content, updated_at: data.updated_at } 
              : comment
          ));
          
          // Exit edit mode
          setEditingCommentId(null);
          setEditContent("");
        } catch (error) {
          console.error('Error updating comment:', error);
        }
      }, openModal);
    } catch (error) {
      console.error('Error in edit comment action:', error);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await handleAuthAction(async () => {
        try {
          const response = await fetch(`/api/comments?commentId=${commentId}`, {
            method: 'DELETE',
            credentials: 'include', // Include cookies for authentication
          });

          if (!response.ok) {
            throw new Error('Failed to delete comment');
          }
          
          // Remove the comment from the local state
          setComments(comments.filter(comment => comment.id !== commentId));
        } catch (error) {
          console.error('Error deleting comment:', error);
        }
      }, openModal);
    } catch (error) {
      console.error('Error in delete comment action:', error);
    }
  };

  // Handle keyboard shortcuts for comment submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without shift for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCommentSubmit()
    }
  }

  // Handle keyboard shortcuts for comment editing
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    // Save on Enter (without shift for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveEditedComment()
    }
    // Cancel on Escape
    else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditComment()
    }
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
      </div>

      {/* Comments list */}
      <div ref={commentsContainerRef} className="comments-list flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-ink-light dark:text-ink-light">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-paper-light dark:bg-paper-dark/50 rounded-full mb-3"></div>
              <div className="h-4 bg-paper-light dark:bg-paper-dark/50 rounded w-24 mb-2"></div>
              <div className="h-3 bg-paper-light dark:bg-paper-dark/50 rounded w-16"></div>
            </div>
          </div>
        ) : comments.length === 0 ? (
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
                    src={comment.profiles.avatar_url || "/placeholder.svg"}
                    alt={comment.profiles.name || comment.profiles.username}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <div className="font-medium">{comment.profiles.name || comment.profiles.username}</div>
                    <div className="text-xs text-ink-light dark:text-ink-light">{formatTimeAgo(comment.created_at)}</div>
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditComment(comment)}
                      className="text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-ink-light dark:text-ink-light hover:text-red-500 dark:hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {editingCommentId === comment.id ? (
                <div className="edit-comment-container relative">
                  <textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={handleEditChange}
                    onKeyDown={handleEditKeyDown}
                    className="w-full border border-border dark:border-border rounded-lg p-3 pr-12 resize-none bg-white dark:bg-paper-dark text-sm min-h-[80px] focus:ring-2 focus:ring-highlight/30 focus:border-highlight dark:focus:border-highlight"
                  />
                  <div className="absolute right-2 bottom-2 flex gap-2">
                    <button
                      onClick={saveEditedComment}
                      className="p-1 rounded-full bg-highlight text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditComment}
                      className="p-1 rounded-full bg-paper-light dark:bg-paper-dark/50 text-ink dark:text-ink-light"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="comment-text text-sm bg-paper-light dark:bg-paper-dark/50 p-3 rounded-lg">
                  {comment.content}
                  {comment.updated_at && comment.updated_at !== comment.created_at && (
                    <span className="text-xs text-ink-light dark:text-ink-light ml-2 italic">(edited)</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="comment-input-container sticky bottom-0 border-t border-border dark:border-border p-4 bg-paper dark:bg-paper-dark">
        <div className="flex items-start">
          <Image
            src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
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
          Press Enter to post (Shift+Enter for new line)
        </div>
      </div>
    </div>
  )
}
