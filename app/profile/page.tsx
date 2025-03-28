"use client"

import { useAuth } from "@/contexts/auth-context"
import { StoryEditor } from "@/components/story-editor"
import { StoriesList } from "@/components/stories-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const { user, userDisplayName, userAvatarUrl } = useAuth()

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Please sign in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome, {userDisplayName}</h1>
        {userAvatarUrl && (
          <img
            src={userAvatarUrl}
            alt={userDisplayName}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
      </div>

      <Tabs defaultValue="write" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="write">Write Story</TabsTrigger>
          <TabsTrigger value="published">Published Stories</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <StoryEditor />
        </TabsContent>
        <TabsContent value="published">
          <StoriesList userId={user.id} showOnlyPublished={true} />
        </TabsContent>
        <TabsContent value="drafts">
          <StoriesList userId={user.id} showOnlyPublished={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
