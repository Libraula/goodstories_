"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
  isPlaying?: boolean
  onPlayPause?: (isPlaying: boolean) => void
}

export default function AudioPlayer({ audioUrl, isPlaying: externalIsPlaying, onPlayPause }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Set up event listeners
    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
    })
    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      if (onPlayPause) onPlayPause(false)
    })

    // Set initial volume
    audio.volume = volume

    // Clean up
    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("loadedmetadata", () => {})
      audio.removeEventListener("ended", () => {})
    }
  }, [audioUrl])

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
    if (audioRef.current) {
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
      audioRef.current.play()
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

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  // Skip forward 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
    }
  }

  // Seek to position
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      audioRef.current.currentTime = pos * audioRef.current.duration
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  // Change volume
  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)

    if (audioRef.current) {
      audioRef.current.volume = newVolume
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  // Get volume icon based on current volume
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4" />
    } else if (volume < 0.5) {
      return <Volume1 className="h-4 w-4" />
    } else {
      return <Volume2 className="h-4 w-4" />
    }
  }

  return (
    <div className="audio-player">
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-8 h-8 rounded-full bg-highlight text-white flex items-center justify-center flex-shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        {/* Skip Buttons */}
        <button
          onClick={skipBackward}
          className="p-1 text-ink-light hover:text-highlight"
          aria-label="Skip backward 10 seconds"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* Time Display */}
        <div className="text-xs font-mono text-ink-light">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className="flex-1 h-1.5 bg-paper-dark/20 dark:bg-paper/20 rounded-full overflow-hidden cursor-pointer"
          onClick={seek}
        >
          <div className="h-full bg-highlight" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
        </div>

        <button
          onClick={skipForward}
          className="p-1 text-ink-light hover:text-highlight"
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="p-1 text-ink-light hover:text-highlight"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {getVolumeIcon()}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={changeVolume}
            className="w-16 h-1 bg-paper-dark/20 dark:bg-paper/20 rounded-full appearance-none cursor-pointer"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
