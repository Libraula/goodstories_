"use client"

import dynamic from "next/dynamic"

// Use dynamic import with SSR disabled to ensure client-side only rendering
// This helps avoid hydration issues with auth state
const StoryFeed = dynamic(() => import("@/components/story-feed"), { ssr: false })

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <StoryFeed />
    </main>
  )
}
