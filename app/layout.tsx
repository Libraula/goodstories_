import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ReadingSettingsProvider } from "@/contexts/reading-settings-context"
import { AuthProvider } from "@/contexts/auth-context"

// Load fonts
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "GoodStories - Short Stories in a TikTok Format",
  description: "Read short stories in a TikTok-style format",
  viewport: "width=device-width, initial-scale=1.0",
  generator: 'v0.dev'
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ReadingSettingsProvider>
              <div className="app-container">
                {children}
              </div>
            </ReadingSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}