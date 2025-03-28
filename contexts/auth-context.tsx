"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  showLoginModal: () => void
  hideLoginModal: () => void
  isLoginModalOpen: boolean
  setLoginMessage: (message: string) => void
  loginMessage: string | null
  userDisplayName: string
  userAvatarUrl: string
  syncUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  showLoginModal: () => {},
  hideLoginModal: () => {},
  isLoginModalOpen: false,
  setLoginMessage: () => {},
  loginMessage: null,
  userDisplayName: "",
  userAvatarUrl: "",
  syncUserData: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState("")
  const [userAvatarUrl, setUserAvatarUrl] = useState("")
  const router = useRouter()

  // Function to extract user display info
  const extractUserInfo = (user: User | null) => {
    if (!user) {
      setUserDisplayName("")
      setUserAvatarUrl("")
      return
    }

    // Get display name from user metadata
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      user.email?.split("@")[0] ||
      "User"

    setUserDisplayName(name)

    // Get avatar URL from user metadata
    const avatar =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6d4c41&color=fff`

    setUserAvatarUrl(avatar)
  }

  // Function to sync user data with Supabase
  const syncUserData = async () => {
    if (!user) return

    try {
      // Check if user exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking user:", fetchError)
        return
      }

      if (!existingUser) {
        // User doesn't exist, create a new record
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          display_name: userDisplayName,
          avatar_url: userAvatarUrl,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Error creating user:", insertError)
        }
      } else {
        // User exists, update last login
        const { error: updateError } = await supabase
          .from("users")
          .update({
            last_login: new Date().toISOString(),
            display_name: userDisplayName,
            avatar_url: userAvatarUrl,
          })
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating user:", updateError)
        }
      }
    } catch (error) {
      console.error("Error syncing user data:", error)
    }
  }

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
        setIsLoading(false)
        return
      }

      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        extractUserInfo(data.session.user)

        // Sync user data with Supabase
        await syncUserData()
      }

      setIsLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      extractUserInfo(session?.user ?? null)
      setIsLoading(false)

      // If user logs in, sync their data
      if (_event === "SIGNED_IN" && session) {
        await syncUserData()
        router.refresh()
      }

      // If user logs out, refresh the page
      if (_event === "SIGNED_OUT") {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signInWithGoogle = async () => {
    try {
      setLoginError(null)

      // Use the production URL as the redirect URL
      const redirectUrl = "https://v0-organize-website-layout.vercel.app"

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Add a random state parameter to avoid the bad_oauth_state error
            state: Math.random().toString(36).substring(2, 15),
          },
        },
      })

      if (error) {
        console.error("Error signing in with Google:", error)
        setLoginError(error.message)

        // If provider is not enabled, show a more user-friendly message
        if (error.message.includes("provider is not enabled")) {
          setLoginError("Google login is not currently enabled. Please try again later or contact support.")
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
      setLoginError("An unexpected error occurred. Please try again later.")
    }
  }

  const signOut = async () => {
    try {
      // Redirect to the production URL after sign out
      const { error } = await supabase.auth.signOut({
        options: {
          redirectTo: "https://v0-organize-website-layout.vercel.app",
        },
      })

      if (error) throw error

      // Clear user data
      setUser(null)
      setSession(null)
      setUserDisplayName("")
      setUserAvatarUrl("")

      // Refresh the page to update UI
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const showLoginModal = () => {
    // Only show login modal if user is not authenticated
    if (!user) {
      setIsLoginModalOpen(true)
    }
  }

  const hideLoginModal = () => {
    setIsLoginModalOpen(false)
    setLoginError(null)
    setLoginMessage(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
        showLoginModal,
        hideLoginModal,
        isLoginModalOpen,
        setLoginMessage,
        loginMessage,
        userDisplayName,
        userAvatarUrl,
        syncUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

