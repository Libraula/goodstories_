"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  storyId: string
  initialIsBookmarked: boolean
  onBookmarkChange?: (isBookmarked: boolean) => void
  size?: 'sm' | 'default' | 'lg'
}

export function BookmarkButton({
  storyId,
  initialIsBookmarked,
  onBookmarkChange,
  size = 'default'
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isLoading, setIsLoading] = useState(false)
  const { user, showLoginModal } = useAuth()
  const { toast } = useToast()

  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleBookmarkToggle = async () => {
    if (!user) {
      showLoginModal()
      return
    }

    setIsLoading(true)

    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?storyId=${storyId}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to remove bookmark')
        
        setIsBookmarked(false)
        if (onBookmarkChange) onBookmarkChange(false)
        
        toast({
          title: "Bookmark removed",
          description: "Story removed from your bookmarks",
        })
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyId }),
        })

        if (!response.ok) throw new Error('Failed to bookmark')
        
        setIsBookmarked(true)
        if (onBookmarkChange) onBookmarkChange(true)
        
        toast({
          title: "Bookmarked",
          description: "Story added to your bookmarks",
        })
      }
    } catch (error) {
      console.error('Bookmark toggle error:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
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
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      className="px-2"
    >
      <Bookmark 
        className={cn(
          sizeClasses[size],
          isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
        )} 
      />
    </Button>
  )
}
