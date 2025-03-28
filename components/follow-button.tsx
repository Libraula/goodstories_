"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  variant = 'default',
  size = 'default'
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { user, showLoginModal } = useAuth()
  const { toast } = useToast()

  const handleFollowToggle = async () => {
    if (!user) {
      showLoginModal()
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/follows?followingId=${userId}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to unfollow')
        
        setIsFollowing(false)
        if (onFollowChange) onFollowChange(false)
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user",
        })
      } else {
        // Follow
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followingId: userId }),
        })

        if (!response.ok) throw new Error('Failed to follow')
        
        setIsFollowing(true)
        if (onFollowChange) onFollowChange(true)
        
        toast({
          title: "Following",
          description: "You are now following this user",
        })
      }
    } catch (error) {
      console.error('Follow toggle error:', error)
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show follow button for own profile
  if (user && user.id === userId) {
    return null
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        isFollowing ? 'Unfollow' : 'Follow'
      )}
    </Button>
  )
}
