"use client"

import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ReadingSettingsProvider } from "@/contexts/reading-settings-context"
import { AuthProvider } from "@/contexts/auth-context"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // This is a client component now
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ReadingSettingsProvider>
              <AuthRedirectHandler>{children}</AuthRedirectHandler>
            </ReadingSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Client component to handle auth redirects
function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
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

