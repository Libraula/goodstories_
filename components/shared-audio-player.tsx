"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { useAudio } from "@/contexts/audio-context"
import { useIsMobile } from "@/hooks/use-mobile"

export function SharedAudioPlayer() {
  const isMobile = useIsMobile()
  const { audioUrl, isPlaying, currentTime, duration, isMuted, togglePlay, toggleMute, setProgress } = useAudio()
  const progressContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [showSoundWave, setShowSoundWave] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

  // Update progress percentage when currentTime or duration changes
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const percent = (currentTime / duration) * 100
      setProgressPercent(percent)
    }
  }, [currentTime, duration, isDragging])

  // Show player when audio URL is set
  useEffect(() => {
    if (audioUrl) {
      setIsVisible(true);
      
      // Small delay before showing sound wave to ensure smoother animation
      if (isPlaying) {
        setTimeout(() => setShowSoundWave(true), 300);
      } else {
        setShowSoundWave(false);
      }
    } else {
      // When no audio, hide the player after a short delay
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowSoundWave(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, isPlaying]);

  // Toggle sound wave animation when play state changes
  useEffect(() => {
    if (isPlaying && audioUrl) {
      setTimeout(() => setShowSoundWave(true), 300);
    } else {
      setShowSoundWave(false);
    }
  }, [isPlaying, audioUrl]);

  // Hide player if no audio is loaded
  if (!isVisible || !audioUrl) return null

  // Format time as MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const newPosition = Math.max(0, Math.min(1, clickPosition));
      setProgress(newPosition);
    }
  }

  // Handle touch and mouse interactions on progress bar with improved handling
  const handleInteractionStart = (clientX: number) => {
    setIsInteracting(true);
    setIsDragging(true);
    
    if (progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const position = (clientX - rect.left) / rect.width
      const newPercent = Math.max(0, Math.min(1, position)) * 100
      setProgressPercent(newPercent)
    }
  };

  const handleInteractionMove = (clientX: number) => {
    if (isDragging && progressContainerRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect()
      const position = (clientX - rect.left) / rect.width
      const newPercent = Math.max(0, Math.min(1, position)) * 100
      setProgressPercent(newPercent)
    }
  };

  const handleInteractionEnd = () => {
    if (isDragging) {
      setProgress(progressPercent / 100)
      setIsDragging(false)
    }
    setIsInteracting(false);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      handleInteractionStart(e.touches[0].clientX);
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      handleInteractionMove(e.touches[0].clientX);
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    handleInteractionEnd();
  }

  // Mouse event handlers for better desktop experience
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    handleInteractionStart(e.clientX);
    
    // Add window event listeners for drag operations
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleInteractionMove(e.clientX);
  }

  const handleMouseUp = () => {
    handleInteractionEnd();
    
    // Clean up event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  // Handle play button click with improved error handling
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  }

  // Handle mute button click
  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  }

  return (
    <div className={`shared-audio-player ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="tiktok-audio-player">
        <button 
          onClick={handlePlayClick} 
          className="audio-control-btn" 
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div
          ref={progressContainerRef}
          className="audio-progress-container"
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="audio-progress-bg"></div>
          <div 
            className="audio-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
          <div 
            className={`audio-progress-handle ${isDragging ? 'active' : ''}`} 
            style={{ left: `${progressPercent}%` }}
          ></div>
        </div>

        <span className="audio-time">{formatTime(currentTime)}</span>

        {showSoundWave && (
          <div className="sound-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <button 
          onClick={handleMuteClick} 
          className="audio-control-btn" 
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  )
}
