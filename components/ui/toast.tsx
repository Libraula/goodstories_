"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive" | "success"
  onDismiss: (id: string) => void
  duration?: number
}

export function Toast({ id, title, description, variant = "default", onDismiss, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const animateInTimeout = setTimeout(() => {
      setIsVisible(true)
    }, 10)

    // Auto dismiss
    const dismissTimeout = setTimeout(() => {
      setIsVisible(false)

      // Wait for animation to complete before removing
      setTimeout(() => {
        onDismiss(id)
      }, 300)
    }, duration)

    return () => {
      clearTimeout(animateInTimeout)
      clearTimeout(dismissTimeout)
    }
  }, [id, duration, onDismiss])

  // Determine background color based on variant
  const bgColor =
    variant === "destructive"
      ? "bg-red/90 dark:bg-red/90"
      : variant === "success"
        ? "bg-green-600/90 dark:bg-green-600/90"
        : "bg-highlight/90 dark:bg-highlight/90"

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full p-4 rounded-lg shadow-lg text-white ${bgColor} transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-[-20px] opacity-0"
      } z-50`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          {description && <p className="text-xs mt-1 opacity-90">{description}</p>}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(id), 300)
          }}
          className="text-white/80 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Array<{
    id: string
    title: string
    description?: string
    variant?: "default" | "destructive" | "success"
    duration?: number
  }>
  dismiss: (id: string) => void
}) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onDismiss={dismiss}
          duration={toast.duration}
        />
      ))}
    </>
  )
}

