"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bookmark, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, showLoginModal } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchBookmarks()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchBookmarks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/bookmarks')
      if (!response.ok) throw new Error('Failed to fetch bookmarks')
      const data = await response.json()
      setBookmarks(data)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      toast({
        title: "Error",
        description: "Failed to load bookmarks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveBookmark = async (storyId: string) => {
    try {
      const response = await fetch(`/api/bookmarks?storyId=${storyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove bookmark')
      
      setBookmarks(prev => prev.filter(bookmark => bookmark.story_id !== storyId))
      toast({
        title: "Bookmark removed",
        description: "Story removed from your bookmarks",
      })
    } catch (error) {
      console.error('Error removing bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Sign in to view your bookmarks</h3>
        <p className="text-muted-foreground mb-4">Save your favorite stories to read later</p>
        <Button onClick={showLoginModal}>Sign In</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
        <p className="text-muted-foreground">When you bookmark stories, they'll appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => {
        const story = bookmark.stories
        return (
          <Card key={bookmark.id}>
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
              <CardTitle>
                <Link href={`/stories/${story.id}`} className="hover:underline">
                  {story.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 mb-4">
                {story.content.length > 200
                  ? `${story.content.slice(0, 200)}...`
                  : story.content}
              </p>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveBookmark(story.id)}
                >
                  Remove Bookmark
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
