"use client"

import type React from "react"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Handle the OAuth redirect
      const handleAuthRedirect = async () => {
        const { error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting auth session:", error)
        }
      }

      // Check for hash fragment which indicates an OAuth redirect
      if (
        window.location.hash ||
        window.location.search.includes("access_token") ||
        window.location.search.includes("error")
      ) {
        handleAuthRedirect()
      }
    }
  }, [])

  return <>{children}</>
}

