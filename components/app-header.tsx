"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"

export function AppHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  // Check if we're on a page where we want to hide the header on desktop
  const hideOnDesktop = pathname === "/" || pathname.startsWith("/profile") || pathname.startsWith("/bookmarks")

  return (
    <header
      className={`app-header fixed top-0 w-full py-4 px-4 flex items-center bg-paper dark:bg-paper-dark z-[100] border-b border-paper-dark/20 dark:border-paper/20 lg:static lg:col-start-2 lg:col-end-3 lg:pr-6 ${hideOnDesktop ? "lg:hidden" : ""}`}
    >
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold text-highlight dark:text-highlight">
          GoodStories
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {!user && (
          <button
            onClick={openModal}
            className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-highlight/90 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
