"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import AuthModal from "./auth-modal"

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isOpen, openModal, closeModal } = useAuthModal()
  const { user, isLoading } = useAuth()

  // This component just renders the auth modal and children
  return (
    <>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeModal} />
    </>
  )
}

// Utility function to check if user is authenticated and open modal if not
export function requireAuth(callback: () => void) {
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  return () => {
    if (!user) {
      openModal()
      return
    }
    callback()
  }
}
