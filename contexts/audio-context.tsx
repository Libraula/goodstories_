"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"

interface AudioContextType {
  audioUrl: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isMuted: boolean
  currentStoryId: string | null
  setAudioUrl: (url: string | null, storyId?: string | null) => void
  togglePlay: () => void
  toggleMute: () => void
  setProgress: (progress: number) => void
  stopAudio: () => void
}

const defaultContext: AudioContextType = {
  audioUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,
  currentStoryId: null,
  setAudioUrl: () => {},
  togglePlay: () => {},
  toggleMute: () => {},
  setProgress: () => {},
  stopAudio: () => {},
}

const AudioContext = createContext<AudioContextType>(defaultContext)

// Check if a URL is valid and publicly accessible
async function checkAudioUrl(url: string): Promise<boolean> {
  try {
    // Attempt to do a HEAD request to check if the URL is accessible
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit' // Don't send cookies to avoid auth issues
    });
    return response.ok;
  } catch (error) {
    console.error("Error checking audio URL:", error);
    return false;
  }
}

// Helper to handle Supabase URLs specifically
function formatSupabaseUrl(url: string): string {
  if (!url) return url;
  
  // If it's a Supabase URL, ensure it's properly formatted for audio playback
  if (url.includes('supabase.co/storage')) {
    // Always use our proxy for Supabase audio files to ensure better browser compatibility
    console.log("Using audio proxy for Supabase file:", url);
    // Encode the URL to make it safe for query parameters
    const encodedUrl = encodeURIComponent(url);
    return `/api/audio-proxy?url=${encodedUrl}`;
  }
  return url;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioUrl, setAudioUrlState] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null)
  
  // Use refs to track state without triggering re-renders
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastUrlRef = useRef<string | null>(null)
  const isAudioReady = useRef<boolean>(false)
  const updateInterval = useRef<NodeJS.Timeout | null>(null)
  const pendingUrlSets = useRef<number>(0) // Track pending setAudioUrl calls
  
  // Create audio element on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Clean up function that stops everything
    const cleanup = () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        // Remove all event listeners to prevent memory leaks
        audioRef.current.onloadedmetadata = null;
        audioRef.current.oncanplay = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
    };
    
    // Create new audio element
    const audio = new Audio();
    
    // Set audio attributes for better compatibility
    audio.crossOrigin = "anonymous";  // Allow CORS audio 
    audio.preload = "auto";
    audio.autoplay = false; // Never auto-play without explicit request
    
    // Add basic formatting for common audio capabilities
    try {
      if (audio.canPlayType) {
        const canPlayMp3 = audio.canPlayType('audio/mpeg').replace(/no/, '');
        const canPlayOgg = audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '');
        const canPlayWav = audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '');
        
        console.log('Browser audio support:', {
          mp3: canPlayMp3,
          ogg: canPlayOgg,
          wav: canPlayWav
        });
      }
    } catch (error) {
      console.warn("Error checking audio capabilities:", error);
    }
    
    audioRef.current = audio;
    
    // Start time update interval for smoother UI updates
    updateInterval.current = setInterval(() => {
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 250);
    
    return cleanup;
  }, []);
  
  // Function to set a new audio URL
  const setAudioUrl = (url: string | null, storyId?: string | null) => {
    console.log("setAudioUrl called with:", url, "storyId:", storyId);
    
    // Immediately clear audio if url is null or empty
    if (!url || url.trim() === '') {
      console.log("No valid URL provided, clearing audio");
      setAudioUrlState(null);
      setCurrentStoryId(null);
      lastUrlRef.current = null;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      isAudioReady.current = false;
      return;
    }
    
    // Debounce to avoid multiple rapid calls
    pendingUrlSets.current++;
    const currentCount = pendingUrlSets.current;
    
    // Wait a tiny bit before processing to avoid rapid changes
    setTimeout(() => {
      // Only process if this is still the most recent call
      if (currentCount !== pendingUrlSets.current) {
        return;
      }
      
      // Format URL if needed (especially for Supabase)
      const formattedUrl = formatSupabaseUrl(url);
      
      // If we already have audio playing for a different story, pause it first
      if (storyId && currentStoryId && storyId !== currentStoryId) {
        console.log("Different story detected, stopping current audio");
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
      
      // Update story ID tracking
      if (storyId) {
        setCurrentStoryId(storyId);
      }
      
      // Skip if URL hasn't changed - IMPORTANT: helps avoid reloading loop
      if (formattedUrl === lastUrlRef.current) {
        console.log("URL unchanged, skipping:", formattedUrl);
        return;
      }
      
      // Update state and refs
      setAudioUrlState(formattedUrl);
      lastUrlRef.current = formattedUrl;
      isAudioReady.current = false;
      
      // Reset state
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      if (!audioRef.current) {
        console.error("Audio element not initialized");
        return;
      }
      
      const audio = audioRef.current;
      
      // Stop current audio if playing
      audio.pause();
      
      // Set up event listeners for this specific audio load
      audio.onloadedmetadata = () => {
        console.log("Metadata loaded, duration:", audio.duration);
        
        // Fix for Infinity duration bug
        if (isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          isAudioReady.current = true;
        } else {
          console.warn("Invalid duration detected:", audio.duration);
          // Force a default duration if we get Infinity
          setDuration(300); // Default to 5 minutes
        }
      };
      
      audio.oncanplay = () => {
        console.log("Audio can play");
        isAudioReady.current = true;
        
        // If duration is still infinity, set a default
        if (!isFinite(audio.duration) || audio.duration <= 0) {
          console.warn("Setting default duration");
          setDuration(300); // 5 minutes default
        }
      };
      
      audio.ontimeupdate = () => {
        // Avoid constant updates by letting the interval handle regular updates
        if (Math.abs(audio.currentTime - currentTime) > 1) {
          setCurrentTime(audio.currentTime);
        }
      };
      
      audio.onended = () => {
        console.log("Audio playback ended");
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
      };
      
      audio.onerror = (e) => {
        const error = audio.error;
        console.error("Audio error:", error || "Unknown error");
        
        setIsPlaying(false);
        isAudioReady.current = false;
        
        // Log detailed error
        let errorMessage = "Unknown audio error";
        if (error) {
          switch (error.code) {
            case 1: // MEDIA_ERR_ABORTED
              errorMessage = "Media loading aborted";
              break;
            case 2: // MEDIA_ERR_NETWORK
              errorMessage = "Network error occurred while loading audio";
              break;
            case 3: // MEDIA_ERR_DECODE
              errorMessage = "Audio decoding error - format may not be supported";
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errorMessage = "Audio format or MIME type not supported by browser";
              break;
          }
        }
        
        console.error("Audio error details:", errorMessage);
      };
      
      // Apply mute state
      audio.muted = isMuted;
      
      // Set source and load
      try {
        // Check if URL is publicly accessible with fetch first
        checkAudioUrl(formattedUrl).then(isValid => {
          if (isValid) {
            console.log("URL is valid and accessible, setting audio source:", formattedUrl);
            
            // Try to determine the MIME type from the URL extension
            let mimeType = "";
            if (formattedUrl.toLowerCase().endsWith('.mp3')) {
              mimeType = 'audio/mpeg';
            } else if (formattedUrl.toLowerCase().endsWith('.wav')) {
              mimeType = 'audio/wav';
            } else if (formattedUrl.toLowerCase().endsWith('.ogg')) {
              mimeType = 'audio/ogg';
            }
            
            // For browsers that support source elements, create a more compatible setup
            if (window.MediaSource || mimeType) {
              audio.src = formattedUrl;
              
                              // Set proper MIME type if available
                if (mimeType) {
                  try {
                    // Use setAttribute instead of direct property assignment
                    audio.setAttribute('type', mimeType);
                  } catch (error) {
                    // Some browsers don't support this
                    console.warn("Browser doesn't support setting audio type directly");
                  }
                }
            } else {
              // Fallback to direct src setting
              audio.src = formattedUrl;
            }
            
            // Force load
            audio.load();
          } else {
            console.error("URL is not accessible:", formattedUrl);
          }
        }).catch(error => {
          console.error("Error checking URL accessibility:", error);
          // Try direct loading as fallback
          audio.src = formattedUrl;
          audio.load();
        });
      } catch (error) {
        console.error("Error setting audio source:", error);
      }
    }, 100); // Short delay to debounce
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    console.log("Toggle play called, isPlaying:", isPlaying);
    
    if (!audioRef.current) {
      console.error("No audio element available");
      return;
    }
    
    if (!lastUrlRef.current) {
      console.error("No audio URL set");
      return;
    }
    
    const audio = audioRef.current;
    
    // Make sure source is set
    if (!audio.src || audio.src !== lastUrlRef.current) {
      console.log("Audio source mismatch, resetting to:", lastUrlRef.current);
      
      // Try to set the source correctly
      try {
        // First check accessibility
        checkAudioUrl(lastUrlRef.current).then(isValid => {
          if (isValid) {
            audio.src = lastUrlRef.current!;
            audio.load();
            
            // Wait for can play
            audio.oncanplay = () => {
              playAudio(audio);
            };
          } else {
            console.error("Audio URL is not accessible");
          }
        });
      } catch (error) {
        console.error("Error resetting audio source:", error);
      }
      return;
    }
    
    if (isPlaying) {
      // Pause playback
      audio.pause();
      setIsPlaying(false);
    } else {
      playAudio(audio);
    }
  };
  
  // Helper function to handle play with error handling
  const playAudio = (audio: HTMLAudioElement) => {
    console.log("Attempting to play audio");
    
    // Force currentTime update if it's at the end
    if (audio.currentTime >= audio.duration - 0.1) {
      audio.currentTime = 0;
    }
    
    // Ensure audio source is valid before playing
    if (!audio.src) {
      console.error("No audio source set");
      return;
    }
    
    // Try to play with proper error handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playing successfully");
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
          
          // Try to autofix common issues
          if (error.name === "NotSupportedError" || error.message?.includes("format") || error.message?.includes("MIME")) {
            console.log("Format not supported, trying to reload with proxy");
            // The audio format might not be supported
            if (lastUrlRef.current) {
              // Always try to use our proxy API for format issues
              let fixedUrl = lastUrlRef.current;
              
              // Try using our proxy API for any file causing format issues
              if (!fixedUrl.includes('/api/audio-proxy')) {
                console.log("Using audio proxy as fallback for format error");
                const encodedUrl = encodeURIComponent(fixedUrl);
                fixedUrl = `/api/audio-proxy?url=${encodedUrl}`;
                
                // Update our references to the new URL
                lastUrlRef.current = fixedUrl;
                setAudioUrlState(fixedUrl);
                
                // Set new source and try again
                audio.src = fixedUrl;
                audio.load();
                
                // Try once more after a delay
                setTimeout(() => {
                  audio.play().catch(secondError => {
                    console.error("Second attempt failed with proxy:", secondError);
                  });
                }, 500);
                return;
              }
              
              // Add download parameter if it's a Supabase URL without it
              if (fixedUrl.includes('supabase.co/storage') && !fixedUrl.includes('?download=')) {
                fixedUrl += '?download=true';
              }
              
              audio.src = fixedUrl;
              audio.load();
              
              // Try once more after a delay
              setTimeout(() => {
                audio.play().catch(secondError => {
                  console.error("Second attempt failed:", secondError);
                });
              }, 500);
            }
          } else if (error.name === "AbortError") {
            // User aborted or context changed, ignore
            console.log("Playback was aborted");
          } else {
            // For other errors, log and reset the audio
            console.error("Unhandled audio error:", error);
            
            // Try refreshing the audio element
            if (lastUrlRef.current) {
              setTimeout(() => {
                audio.src = lastUrlRef.current!;
                audio.load();
              }, 300);
            }
          }
        });
    } else {
      // Older browsers might not return a promise
      setIsPlaying(true);
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMuteState = !isMuted;
    audioRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };
  
  // Set playback position
  const setProgress = (progress: number) => {
    if (!audioRef.current) return;
    
    // Calculate new time position
    let newTime = 0;
    if (duration > 0) {
      newTime = Math.max(0, Math.min(duration, progress * duration));
    } else if (audioRef.current.duration && isFinite(audioRef.current.duration)) {
      newTime = Math.max(0, Math.min(audioRef.current.duration, progress * audioRef.current.duration));
    }
    
    // Set the new time
    try {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // If we're seeking while playing but paused, resume
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(err => {
          console.error("Couldn't resume after seek:", err);
        });
      }
    } catch (error) {
      console.error("Error setting progress:", error);
    }
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.src = "";
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    isAudioReady.current = false;
  };
  
  return (
    <AudioContext.Provider
      value={{
        audioUrl,
        isPlaying,
        currentTime,
        duration,
        isMuted,
        currentStoryId,
        setAudioUrl,
        togglePlay,
        toggleMute,
        setProgress,
        stopAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext)
