"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StoriesList } from '@/components/stories-list'
import { FollowButton } from '@/components/follow-button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import type { Profile } from '@/lib/types'

interface ProfileViewProps {
  userId?: string
  className?: string
}

export function ProfileView({ userId, className = '' }: ProfileViewProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('published')

  const isOwnProfile = !userId || (user && user.id === userId)
  const profileId = userId || (user ? user.id : null)

  useEffect(() => {
    if (profileId) {
      fetchProfile(profileId)
    }
  }, [profileId])

  const fetchProfile = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profiles?userId=${id}`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        is_following: isFollowing,
        follower_count: isFollowing 
          ? (profile.follower_count || 0) + 1 
          : Math.max(0, (profile.follower_count || 0) - 1)
      })
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground">
            <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
            <span>{profile.follower_count || 0} followers</span>
            <span>{profile.following_count || 0} following</span>
          </div>
          
          {profile.bio && (
            <p className="mt-2">{profile.bio}</p>
          )}
        </div>
        
        {!isOwnProfile && (
          <FollowButton 
            userId={profile.id} 
            isFollowing={profile.is_following || false}
            onFollowChange={handleFollowChange}
          />
        )}
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="published">Published Stories</TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          )}
          {!isOwnProfile && (
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="published" className="mt-4">
          <StoriesList 
            userId={profile.id} 
            showOnlyPublished={true} 
          />
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="drafts" className="mt-4">
            <StoriesList 
              userId={profile.id} 
              showOnlyPublished={false} 
            />
          </TabsContent>
        )}
        
        {!isOwnProfile && (
          <TabsContent value="bookmarks" className="mt-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Bookmarks are private to each user</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
