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
  isLoading: boolean
  setAudioUrl: (url: string | null, storyId?: string | null, metadata?: AudioMetadata) => void
  togglePlay: () => void
  toggleMute: () => void
  setProgress: (progress: number) => void
  stopAudio: () => void
}

// Add interface for audio metadata
interface AudioMetadata {
  title?: string;
  author?: string;
  artwork?: string;
}

const defaultContext: AudioContextType = {
  audioUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isMuted: false,
  currentStoryId: null,
  isLoading: false,
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
  const [isLoading, setIsLoading] = useState(false)
  
  // Use refs to track state without triggering re-renders
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastUrlRef = useRef<string | null>(null)
  const isAudioReady = useRef<boolean>(false)
  const updateInterval = useRef<NodeJS.Timeout | null>(null)
  const pendingUrlSets = useRef<number>(0) // Track pending setAudioUrl calls
  const metadataRef = useRef<AudioMetadata | null>(null)
  
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
  const setAudioUrl = (url: string | null, storyId?: string | null, metadata?: AudioMetadata) => {
    console.log("setAudioUrl called with:", url, "storyId:", storyId, "metadata:", metadata);
    
    // Set loading indicator
    setIsLoading(true);
    
    // Save metadata for later use
    if (metadata) {
      metadataRef.current = metadata;
    } else {
      metadataRef.current = null;
    }
    
    // If trying to set the same URL that's already playing, just update metadata and return
    if (url && url === lastUrlRef.current && isPlaying) {
      console.log("URL is already playing, just updating metadata");
      updateMediaSessionMetadata();
      setIsLoading(false);
      return;
    }
    
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
      setIsLoading(false); // Clear loading state
      return;
    }
    
    // Debounce to avoid multiple rapid calls
    pendingUrlSets.current++;
    const currentCount = pendingUrlSets.current;
    
    // Wait a tiny bit before processing to avoid rapid changes
    setTimeout(() => {
      // Only process if this is still the most recent call
      if (currentCount !== pendingUrlSets.current) {
        setIsLoading(false); // Clear loading if superseded
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
        setIsLoading(false); // Clear loading state
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
        setIsLoading(false); // Clear loading state
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
          setIsLoading(false); // Clear loading state
        } else {
          console.warn("Invalid duration detected:", audio.duration);
          // Force a default duration if we get Infinity
          setDuration(300); // Default to 5 minutes
          setIsLoading(false); // Still clear loading state
        }
      };
      
      audio.oncanplay = () => {
        console.log("Audio can play");
        isAudioReady.current = true;
        setIsLoading(false); // Ensure loading state is cleared
        
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
        setIsLoading(false); // Ensure loading is cleared
      };
      
      // Apply mute state
      audio.muted = isMuted;
      
      // Set source and load
      try {
        // Use a more reliable method to load audio
        const sourceURL = formattedUrl;
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        audio.src = sourceURL.includes('?') ? `${sourceURL}&t=${timestamp}` : `${sourceURL}?t=${timestamp}`;
        
        // Force load
        audio.load();
        
        // Set up a timeout for load failures
        const loadTimeoutId = setTimeout(() => {
          if (!isAudioReady.current) {
            console.warn("Audio load timeout, trying proxy");
            setIsLoading(false);
            
            // Try proxy as fallback if not already using it
            if (!formattedUrl.includes('/api/audio-proxy')) {
              const encodedUrl = encodeURIComponent(formattedUrl);
              const proxyUrl = `/api/audio-proxy?url=${encodedUrl}&t=${timestamp}`;
              
              console.log("Switching to proxy URL:", proxyUrl);
              audio.src = proxyUrl;
              audio.load();
            }
          }
        }, 8000); // 8 second timeout
        
        // Clean up timeout on successful load
        audio.oncanplaythrough = () => {
          clearTimeout(loadTimeoutId);
          isAudioReady.current = true;
          setIsLoading(false);
        };
        
      } catch (error) {
        console.error("Error setting audio source:", error);
        setIsLoading(false);
      }
    }, 200); // Short delay to debounce - increased slightly for better stability
  };
  
  // Function to update MediaSession metadata
  const updateMediaSessionMetadata = () => {
    if ('mediaSession' in navigator && metadataRef.current) {
      const metadata = metadataRef.current;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          // Format title to include the app name for better visibility in notifications
          title: `${metadata.title || 'Story Audio'} - GoodStories`,
          artist: metadata.author || 'GoodStories Author',
          album: 'GoodStories', // Keep album name consistently set
          artwork: metadata.artwork ? [
            { src: metadata.artwork, sizes: '512x512', type: 'image/png' }
          ] : [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        
        // Set up media session action handlers
        navigator.mediaSession.setActionHandler('play', () => {
          togglePlay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          togglePlay();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          stopAudio();
        });
        
        // Add seekto if supported
        if ('setPositionState' in navigator.mediaSession) {
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (audioRef.current && details.seekTime) {
              audioRef.current.currentTime = details.seekTime;
              setCurrentTime(details.seekTime);
              
              // Update position state
              navigator.mediaSession.setPositionState({
                duration: audioRef.current.duration || 0,
                playbackRate: audioRef.current.playbackRate,
                position: details.seekTime
              });
            }
          });
        }
      } catch (error) {
        console.error('Error setting media session metadata:', error);
      }
    }
  }
  
  // Toggle play/pause - prevent interruptions and improve reliability
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
    
    // If currently playing, pause it immediately
    if (isPlaying) {
      // Pause playback
      console.log("Pausing audio playback at position:", audio.currentTime);
      audio.pause();
      setIsPlaying(false);
      return;
    }
    
    // If we have a currentTime stored, try to resume from that position
    console.log("Attempting to play audio, current position:", audio.currentTime);
    
    // Set loading state
    setIsLoading(true);
    
    // Safety check - if source is not properly set or different, fix it
    const urlMissing = !audio.src || audio.src.trim() === '';
    const urlMismatch = lastUrlRef.current && !audio.src.includes(lastUrlRef.current);
    
    if (urlMissing || urlMismatch) {
      console.log("URL missing or mismatch, resetting source");
      if (lastUrlRef.current) {
        audio.src = lastUrlRef.current;
        audio.load();
      }
    }
    
    // Add a small delay before trying to play to allow any browser UI to complete
    setTimeout(() => {
      // Ensure media session metadata is set
      updateMediaSessionMetadata();
      
      // Try to play with proper error handling
      playAudio(audio);
    }, 50);
  };
  
  // Helper function to handle play with error handling
  const playAudio = (audio: HTMLAudioElement) => {
    console.log("Attempting to play audio at position:", audio.currentTime);
    
    // Force currentTime update if it's at the end
    if (audio.currentTime >= audio.duration - 0.1) {
      console.log("Audio at end, resetting to beginning");
      audio.currentTime = 0;
    }
    
    // Ensure audio source is valid before playing
    if (!audio.src) {
      console.error("No audio source set");
      setIsLoading(false); // Clear loading state
      return;
    }
    
    // Set playing state optimistically for better UI response
    setIsPlaying(true);
    
    // Try to play with proper error handling
    let playPromise;
    try {
      playPromise = audio.play();
    } catch (error) {
      console.error("Error starting playback:", error);
      setIsPlaying(false);
      setIsLoading(false); // Clear loading state on error
      return;
    }
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playing successfully at position:", audio.currentTime);
          // State already set for optimistic UI
          setIsLoading(false); // Clear loading on successful play
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
          setIsLoading(false); // Clear loading on error
          
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
                setIsLoading(true); // Show loading for recovery attempt
                const encodedUrl = encodeURIComponent(fixedUrl);
                fixedUrl = `/api/audio-proxy?url=${encodedUrl}`;
                
                // Remember the current position to resume from
                const currentPos = audio.currentTime;
                
                // Update our references to the new URL
                lastUrlRef.current = fixedUrl;
                setAudioUrlState(fixedUrl);
                
                // Set new source and try again
                audio.src = fixedUrl;
                audio.load();
                
                // Try to restore position when ready
                audio.oncanplay = () => {
                  if (currentPos > 0) {
                    try {
                      audio.currentTime = currentPos;
                    } catch (e) {
                      console.warn("Could not restore playback position:", e);
                    }
                  }
                  
                  // Try once more after a delay
                  setTimeout(() => {
                    setIsLoading(false); // Clear loading state before retry
                    const retryPromise = audio.play();
                    if (retryPromise) {
                      retryPromise
                        .then(() => {
                          console.log("Retry with proxy successful");
                          setIsPlaying(true);
                        })
                        .catch(secondError => {
                          console.error("Second attempt failed with proxy:", secondError);
                          setIsPlaying(false);
                        });
                    } else {
                      setIsPlaying(true); // Older browsers
                    }
                  }, 500);
                };
                return;
              }
              
              // Add download parameter if it's a Supabase URL without it
              if (fixedUrl.includes('supabase.co/storage') && !fixedUrl.includes('?download=')) {
                fixedUrl += '?download=true';
              }
              
              // Remember position before reload
              const currentPos = audio.currentTime;
              
              audio.src = fixedUrl;
              audio.load();
              
              // Restore position when ready
              audio.oncanplay = () => {
                setIsLoading(false); // Clear loading when can play
                
                if (currentPos > 0) {
                  try {
                    audio.currentTime = currentPos;
                  } catch (e) {
                    console.warn("Could not restore playback position:", e);
                  }
                }
                
                // Try once more after a delay
                setTimeout(() => {
                  const retryPromise = audio.play();
                  if (retryPromise) {
                    retryPromise
                      .then(() => {
                        console.log("Retry successful");
                        setIsPlaying(true);
                      })
                      .catch(secondError => {
                        console.error("Second attempt failed:", secondError);
                        setIsPlaying(false);
                      });
                  } else {
                    setIsPlaying(true); // Older browsers
                  }
                }, 500);
              };
            }
          } else if (error.name === "AbortError") {
            // User aborted or context changed, ignore
            console.log("Playback was aborted");
          } else {
            // For other errors, log and reset the audio
            console.error("Unhandled audio error:", error);
            
            // Try refreshing the audio element
            if (lastUrlRef.current) {
              setIsLoading(true); // Show loading for refresh attempt
              const currentPos = audio.currentTime;
              
              setTimeout(() => {
                audio.src = lastUrlRef.current!;
                audio.load();
                
                audio.oncanplay = () => {
                  setIsLoading(false); // Clear loading on can play
                  
                  if (currentPos > 0) {
                    try {
                      audio.currentTime = currentPos;
                    } catch (e) {
                      console.warn("Could not restore playback position:", e);
                    }
                  }
                };
              }, 300);
            }
          }
        });
    } else {
      // Older browsers might not return a promise
      setIsPlaying(true);
      setIsLoading(false); // Clear loading state for older browsers
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
        isLoading,
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
