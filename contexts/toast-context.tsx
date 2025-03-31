"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/ui/toast"

type ToastContextType = ReturnType<typeof useToast>

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} dismiss={toast.dismiss} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}

