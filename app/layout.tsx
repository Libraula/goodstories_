import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next" // Import Viewport
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ReadingSettingsProvider } from "@/contexts/reading-settings-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/contexts/toast-context" // Add this import

// Load fonts
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "GoodStories - Short Stories in a TikTok Format",
  description: "Read short stories in a TikTok-style format",
  // viewport property removed from here
  generator: "v0.dev",
}

// Add dedicated viewport export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {/* Removed meta viewport tag */}
        {/* Removed meta theme-color tags (handled by viewport export) */}
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ReadingSettingsProvider>
              <ToastProvider>
                <div className="app-container">{children}</div>
              </ToastProvider>
            </ReadingSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'