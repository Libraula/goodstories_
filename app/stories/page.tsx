"use client"

import { StoriesList } from "@/components/stories-list"

export default function StoriesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Stories Feed</h1>
      <div className="max-w-4xl mx-auto">
        <StoriesList showOnlyPublished={true} />
      </div>
    </div>
  )
}
