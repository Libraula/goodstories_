"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { Bookmark } from "lucide-react"

export function AppHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  return (
    <header
      className={`sticky top-0 w-full py-3 px-4 flex items-center justify-between bg-paper/80 dark:bg-paper-dark/80 backdrop-blur-sm z-40 border-b border-border`}
    >
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold text-highlight hover:text-highlight/90 transition-colors">
          GoodStories
        </Link>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <Link href="/bookmarks" passHref legacyBehavior>
          <a className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors" aria-label="My Bookmarks">
            <Bookmark size={20} className="text-ink dark:text-ink-light" />
          </a>
        </Link>
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
