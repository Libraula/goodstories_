"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function AuthErrorHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [errorDescription, setErrorDescription] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDescParam = searchParams.get('error_description')
    
    if (errorParam) {
      setError(errorParam)
      setErrorDescription(errorDescParam)
      
      // Clear the error from URL after 5 seconds
      const timeout = setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        url.searchParams.delete('error_description')
        url.searchParams.delete('error_code')
        router.replace(url.pathname)
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [searchParams, router])

  if (!error) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>
        {errorDescription || 'There was a problem with authentication. Please try again.'}
      </AlertDescription>
    </Alert>
  )
}
