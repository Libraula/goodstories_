"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
  isPlaying: boolean
  onPlayPause: (playing: boolean) => void
  onEnded: () => void
  audioRef?: React.RefObject<HTMLAudioElement>
}

export default function AudioPlayer({
  audioUrl,
  isPlaying,
  onPlayPause,
  onEnded,
  audioRef: externalAudioRef,
}: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)

  const internalAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioRef = externalAudioRef || internalAudioRef
  const progressContainerRef = useRef<HTMLDivElement>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
    } else if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl
    }

    const audio = audioRef.current

    // Set up event listeners
    const handleTimeUpdate = () => {
      if (!isDragging && audio) {
        setCurrentTime(audio.currentTime)
        setProgressPercent((audio.currentTime / audio.duration) * 100 || 0)
      }
    }

    const handleDurationChange = () => {
      if (audio) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      onEnded()
      setCurrentTime(0)
      setProgressPercent(0)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)

    // Set initial values
    if (audio.readyState > 0) {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl, isDragging, onEnded, audioRef])

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err)
        onPlayPause(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, onPlayPause, audioRef])

  // Handle mute toggle
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = isMuted
  }, [isMuted, audioRef])

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressContainerRef.current) return

    const rect = progressContainerRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setProgressPercent(clickPosition * 100)
  }

  // Handle touch on progress bar
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !e.touches[0]) return

    const rect = progressContainerRef.current.getBoundingClientRect()
    const touchPosition = (e.touches[0].clientX - rect.left) / rect.width
    setProgressPercent(Math.max(0, Math.min(1, touchPosition)) * 100)
  }

  const handleTouchEnd = () => {
    if (!audioRef.current) return

    setIsDragging(false)
    const newTime = (progressPercent / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="tiktok-audio-player">
      <button
        className="audio-play-button"
        onClick={() => onPlayPause(!isPlaying)}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div
        ref={progressContainerRef}
        className="audio-progress-container"
        onClick={handleProgressClick}
        onTouchStart={() => setIsDragging(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="audio-progress-bg"></div>
        <div className="audio-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        <div className="audio-progress-handle" style={{ left: `${progressPercent}%` }}></div>
      </div>

      <span className="audio-time">{formatTime(currentTime)}</span>

      <button
        className="audio-mute-button"
        onClick={() => setIsMuted(!isMuted)}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
