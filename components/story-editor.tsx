"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function StoryEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (publish: boolean) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          isPublished: publish,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save story')
      }

      toast({
        title: publish ? "Story published!" : "Draft saved!",
        description: "Your story has been successfully saved.",
      })

      setTitle('')
      setContent('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Write Your Story</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your story title"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your story..."
            className="w-full min-h-[200px]"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !title || !content}
            variant="outline"
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !title || !content}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
