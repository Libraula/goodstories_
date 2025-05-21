"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"

interface AudioContextType {
  audioUrl: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isMuted: boolean
  setAudioUrl: (url: string | null) => void
  togglePlay: () => void
  toggleMute: () => void
  setProgress: (progress: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
      } else if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl
        audioRef.current.load()
      }

      // Set up event listeners
      const audio = audioRef.current

      const updateProgress = () => {
        setCurrentTime(audio.currentTime)
      }

      const updateDuration = () => {
        setDuration(audio.duration)
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        audio.currentTime = 0
      }

      audio.addEventListener("timeupdate", updateProgress)
      audio.addEventListener("loadedmetadata", updateDuration)
      audio.addEventListener("ended", handleEnded)

      return () => {
        audio.removeEventListener("timeupdate", updateProgress)
        audio.removeEventListener("loadedmetadata", updateDuration)
        audio.removeEventListener("ended", handleEnded)
      }
    } else if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [audioUrl])

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing audio:", error)
            setIsPlaying(false)
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Handle mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const setProgress = (progress: number) => {
    if (audioRef.current && duration > 0) {
      const newTime = progress * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const value = {
    audioUrl,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    setAudioUrl,
    togglePlay,
    toggleMute,
    setProgress,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
