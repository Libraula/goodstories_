"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { useAudio } from "@/contexts/audio-context"
import { useIsMobile } from "@/hooks/use-mobile"

export function SharedAudioPlayer() {
  const isMobile = useIsMobile()
  const { audioUrl, isPlaying, currentTime, duration, isMuted, togglePlay, toggleMute, setProgress } = useAudio()
  const progressContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)

  // Update progress percentage when currentTime or duration changes
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const percent = (currentTime / duration) * 100
      setProgressPercent(percent)
    }
  }, [currentTime, duration, isDragging])

  // Hide player if no audio is loaded
  if (!audioUrl) return null

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      setProgress(Math.max(0, Math.min(1, clickPosition)))
    }
  }

  // Handle touch on progress bar
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (progressContainerRef.current && e.touches[0]) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const touchPosition = (e.touches[0].clientX - rect.left) / rect.width
      setProgressPercent(Math.max(0, Math.min(1, touchPosition)) * 100)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setProgress(progressPercent / 100)
  }

  return (
    <div className={`shared-audio-player ${isMobile ? "mobile" : "desktop"}`}>
      <div className="tiktok-audio-player">
        <button onClick={togglePlay} className="audio-control-btn" aria-label={isPlaying ? "Pause" : "Play"}>
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
        </div>

        <span className="audio-time">{formatTime(currentTime)}</span>

        <button onClick={toggleMute} className="audio-control-btn" aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  )
}
