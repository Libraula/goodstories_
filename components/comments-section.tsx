"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Send, X, Trash, Edit, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import type { Comment } from "@/lib/types"

interface CommentsSectionProps {
  isOpen: boolean
  onClose: () => void
  storyId: string
  initialCommentCount?: number
}

export function CommentsSection({ 
  isOpen, 
  onClose, 
  storyId,
  initialCommentCount = 0 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const { user, showLoginModal } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && storyId) {
      fetchComments()
    }
  }, [isOpen, storyId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/comments?storyId=${storyId}`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      showLoginModal()
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          content: newComment,
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')
      
      const data = await response.json()
      setComments(prev => [data, ...prev])
      setNewComment("")
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      })
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.content)
  }

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editText.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: editingCommentId,
          content: editText,
        }),
      })

      if (!response.ok) throw new Error('Failed to update comment')
      
      const updatedComment = await response.json()
      setComments(prev => prev.map(c => 
        c.id === editingCommentId ? updatedComment : c
      ))
      setEditingCommentId(null)
      setEditText("")
      toast({
        title: "Comment updated",
        description: "Your comment has been updated",
      })
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete comment')
      
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-background w-full max-w-md h-full border-l shadow-lg flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Comments ({comments.length})</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none"
          />
          <div className="mt-2 flex justify-end">
            <Button 
              onClick={handleSubmitComment} 
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={comment.profiles.avatar_url} />
                        <AvatarFallback>{comment.profiles.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{comment.profiles.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {user && user.id === comment.user_id && (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditComment(comment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="resize-none"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isSubmitting || !editText.trim()}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Edit className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2">{comment.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
