"use client"

import { useEffect, useState } from 'react'
import type { DBStory } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from 'date-fns'

interface StoriesListProps {
  userId?: string
  showOnlyPublished?: boolean
}

export function StoriesList({ userId, showOnlyPublished = true }: StoriesListProps) {
  const [stories, setStories] = useState<DBStory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const params = new URLSearchParams()
        if (userId) params.append('userId', userId)
        if (showOnlyPublished) params.append('isPublished', 'true')
        
        const response = await fetch(`/api/stories?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch stories')
        const data = await response.json()
        setStories(data)
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [userId, showOnlyPublished])

  if (isLoading) {
    return <div className="text-center">Loading stories...</div>
  }

  if (stories.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No stories found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <Card key={story.id}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Avatar>
                <AvatarImage src={story.profiles.avatar_url} />
                <AvatarFallback>{story.profiles.display_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{story.profiles.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <CardTitle>{story.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {story.content.length > 200
                ? `${story.content.slice(0, 200)}...`
                : story.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
