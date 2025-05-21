import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ReadingSettingsProvider } from "@/contexts/reading-settings-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/contexts/toast-context"
import { AudioProvider } from "@/contexts/audio-context"
import { SharedAudioPlayer } from "@/components/shared-audio-player"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GoodStories",
  description: "A platform for sharing and discovering great stories",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ReadingSettingsProvider>
              <ToastProvider>
                <AudioProvider>
                  {children}
                  <SharedAudioPlayer />
                </AudioProvider>
              </ToastProvider>
            </ReadingSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
