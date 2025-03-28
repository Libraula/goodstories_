"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { signInWithGoogle } = useAuth()

  useEffect(() => {
    // Close modal when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="auth-modal bg-white dark:bg-paper rounded-2xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300"
      >
        <div className="modal-header p-4 flex justify-between items-center border-b border-paper-dark/20 dark:border-paper/20">
          <div className="app-logo text-2xl font-bold text-highlight dark:text-highlight">GoodStories</div>
          <button
            onClick={onClose}
            className="text-ink-light dark:text-ink-light hover:text-ink dark:hover:text-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-body p-6 flex flex-col gap-6">
          {message && (
            <div className="message-box p-3 bg-highlight/10 rounded-lg text-center text-ink dark:text-ink-light">
              {message}
            </div>
          )}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3 text-ink dark:text-ink">Join our community</h2>
            <p className="text-ink-light dark:text-ink-light mb-2">
              Sign in to like, bookmark, and comment on stories
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="social-btn flex items-center justify-center gap-3 w-full py-4 px-4 rounded-full border border-paper-dark dark:border-paper text-ink dark:text-ink hover:bg-paper/50 dark:hover:bg-paper-dark/50 transition-colors shadow-sm"
          >
            <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="w-5 h-5" />
            <span className="font-medium">Continue with Google</span>
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-ink-light/70 dark:text-ink-light/70">
              By continuing, you agree to our <a href="#" className="text-highlight dark:text-highlight underline">Terms of Service</a> and acknowledge that you have read our <a href="#" className="text-highlight dark:text-highlight underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
