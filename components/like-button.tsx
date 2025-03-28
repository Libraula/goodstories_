"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  storyId: string
  initialIsLiked: boolean
  initialLikeCount: number
  onLikeChange?: (isLiked: boolean, likeCount: number) => void
  showCount?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function LikeButton({
  storyId,
  initialIsLiked,
  initialLikeCount,
  onLikeChange,
  showCount = true,
  size = 'default'
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)
  const { user, showLoginModal } = useAuth()
  const { toast } = useToast()

  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleLikeToggle = async () => {
    if (!user) {
      showLoginModal()
      return
    }

    setIsLoading(true)

    try {
      if (isLiked) {
        // Unlike
        const response = await fetch(`/api/likes?storyId=${storyId}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to unlike')
        
        setIsLiked(false)
        setLikeCount(prev => prev - 1)
        if (onLikeChange) onLikeChange(false, likeCount - 1)
      } else {
        // Like
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyId }),
        })

        if (!response.ok) throw new Error('Failed to like')
        
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
        if (onLikeChange) onLikeChange(true, likeCount + 1)
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={isLoading}
      className="flex items-center gap-1 px-2"
    >
      <Heart 
        className={cn(
          sizeClasses[size],
          isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        )} 
      />
      {showCount && (
        <span className={cn(
          "text-muted-foreground",
          isLiked && "text-red-500"
        )}>
          {likeCount}
        </span>
      )}
    </Button>
  )
}
