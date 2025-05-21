"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"

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

const defaultContext: AudioContextType = {
  audioUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,
  setAudioUrl: () => {},
  togglePlay: () => {},
  toggleMute: () => {},
  setProgress: () => {},
}

const AudioContext = createContext<AudioContextType>(defaultContext)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioUrl, setAudioUrlState] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio()

      // Set initial volume
      audioRef.current.volume = 1.0
      audioRef.current.muted = isMuted
    }

    const audio = audioRef.current

    // Event handlers
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      console.log("Audio duration loaded:", audio.duration)
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      console.log("Audio playback ended")
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleCanPlay = () => {
      console.log("Audio can play")
      if (isPlaying) {
        audio.play().catch((err) => {
          console.error("Error playing audio:", err)
          setIsPlaying(false)
        })
      }
    }

    const handleError = (e: Event) => {
      console.error("Audio error:", e)
      setIsPlaying(false)
    }

    // Add event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)

    // Cleanup function
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
    }
  }, [isPlaying])

  // Handle audio URL changes
  const setAudioUrl = (url: string | null) => {
    console.log("Setting audio URL:", url)

    // Stop current audio if playing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    setAudioUrlState(url)
    audioUrlRef.current = url

    if (audioRef.current && url) {
      // Reset audio state
      setCurrentTime(0)

      // Set new source
      audioRef.current.src = url
      audioRef.current.load()

      console.log("Audio source set and loading")
    }
  }

  // Update audio source when URL changes
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return

    if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl
      audioRef.current.load()
      console.log("Audio source updated:", audioUrl)
    }
  }, [audioUrl])

  // Handle play/pause
  const togglePlay = () => {
    console.log("Toggle play/pause, current state:", isPlaying)

    if (!audioRef.current || !audioUrl) {
      console.log("No audio to play")
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio playing successfully")
        })
        .catch((err) => {
          console.error("Error playing audio:", err)
        })
      setIsPlaying(true)
    }
  }

  // Handle mute/unmute
  const toggleMute = () => {
    if (!audioRef.current) return

    const newMuteState = !isMuted
    audioRef.current.muted = newMuteState
    setIsMuted(newMuteState)
    console.log("Audio muted:", newMuteState)
  }

  // Set progress (seek)
  const setProgress = (progress: number) => {
    if (!audioRef.current || duration <= 0) return

    const newTime = progress * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    console.log("Seeking to:", newTime)
  }

  return (
    <AudioContext.Provider
      value={{
        audioUrl,
        isPlaying,
        currentTime,
        duration,
        isMuted,
        setAudioUrl,
        togglePlay,
        toggleMute,
        setProgress,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => useContext(AudioContext)
