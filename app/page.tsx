"use client"

import dynamic from "next/dynamic"
import { useEffect } from "react"

// Use dynamic import with SSR disabled to ensure client-side only rendering
// This helps avoid hydration issues with auth state
const StoryFeed = dynamic(() => import("@/components/story-feed"), { ssr: false })

export default function Home() {
  // Add class to body to help identify the home page
  useEffect(() => {
    document.body.classList.add('home-tab');
    
    return () => {
      document.body.classList.remove('home-tab');
    };
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <StoryFeed />
    </main>
  )
}
