"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string | undefined
  isPlaying?: boolean
  onPlayPause?: (isPlaying: boolean) => void
  onEnded?: () => void
  compact?: boolean
  audioRef?: React.RefObject<HTMLAudioElement>
}

export default function AudioPlayer({
  audioUrl,
  isPlaying: externalIsPlaying,
  onPlayPause,
  onEnded,
  compact = false,
  audioRef: externalAudioRef,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const internalAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioRef = externalAudioRef || internalAudioRef
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return

    // Only create a new audio element if we're using the internal ref
    if (!externalAudioRef && !audioRef.current) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
    }

    if (!audioRef.current) return

    const audio = audioRef.current

    // Set up event listeners
    const handleTimeUpdate = () => updateProgress()
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      if (onPlayPause) onPlayPause(false)
      if (onEnded) onEnded()
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    // Clean up
    return () => {
      if (!externalAudioRef) {
        audio.pause()
      }
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl, onEnded, externalAudioRef, onPlayPause])

  // Sync with external isPlaying state if provided
  useEffect(() => {
    if (externalIsPlaying !== undefined && externalIsPlaying !== isPlaying) {
      if (externalIsPlaying) {
        play()
      } else {
        pause()
      }
    }
  }, [externalIsPlaying])

  // Update progress bar
  const updateProgress = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Play audio
  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err)
      })
      setIsPlaying(true)
      if (onPlayPause) onPlayPause(true)
    }
  }

  // Pause audio
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (onPlayPause) onPlayPause(false)
    }
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  // Handle progress bar interaction
  const handleProgressInteraction = (clientX: number) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const pos = (clientX - rect.left) / rect.width
      const newTime = pos * duration
      setCurrentTime(newTime)
      if (!isDragging) {
        audioRef.current.currentTime = newTime
      }
    }
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleProgressInteraction(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleProgressInteraction(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (isDragging && audioRef.current) {
      audioRef.current.currentTime = currentTime
    }
    setIsDragging(false)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    if (e.touches[0]) {
      handleProgressInteraction(e.touches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && e.touches[0]) {
      handleProgressInteraction(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging && audioRef.current) {
      audioRef.current.currentTime = currentTime
    }
    setIsDragging(false)
  }

  if (!audioUrl) return null

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // TikTok-style minimalistic player
  return (
    <div className="tiktok-audio-player">
      <button onClick={togglePlayPause} className="audio-play-button" aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>

      <div
        className="audio-progress-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        ref={progressBarRef}
      >
        <div className="audio-progress-bg"></div>
        <div className="audio-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        <div className="audio-progress-handle" style={{ left: `${progressPercentage}%` }}></div>
      </div>

      <div className="audio-time">{formatTime(currentTime)}</div>

      <button onClick={toggleMute} className="audio-mute-button" aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      </button>
    </div>
  )
}
