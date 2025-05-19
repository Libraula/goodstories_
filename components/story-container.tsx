"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Heart, MessageCircle, Bookmark, Share2, Music2, PlayCircle, PauseCircle, UserPlus, ChevronLeft, ChevronRight, Maximize, Minimize, Volume2, VolumeX,
  PanelTopClose, PanelTopOpen, PlusCircle as PlusCircleIcon, ArrowDownCircle, X, Send
} from "lucide-react";
import type { Story, StoryPage } from "@/lib/types";
import CommentsSection from "./comments-section";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { createClient } from "@/utils/supabase/client";
import { handleAuthAction } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import AudioGenerator from "./audio-generator";
import { useReadingSettings } from "@/contexts/reading-settings-context";
import Link from "next/link";

const supabase = createClient();

export default function StoryContainer({
  story,
  isActive = false,
  activeAudio = true,
}: {
  story?: Story;
  isActive?: boolean;
  activeAudio?: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(0); // 0 is meta page, 1+ are story.pages
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(story?.like_count ?? 0);
  const [commentCount, setCommentCount] = useState(story?.comment_count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(story?.audio_url);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showAudioGenerator, setShowAudioGenerator] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStoryControls, setShowStoryControls] = useState(true);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const hasAttemptedAutoplay = useRef<boolean>(false);
  
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const { toast } = useToast();
  const { readingMode } = useReadingSettings();

  const displayPages = useMemo(() => {
    if (!story) return [];
    // Create a synthetic meta page. Its content will be rendered specially.
    const metaPage: StoryPage = { type: 'meta', content: [] }; 
    return [metaPage, ...story.pages];
  }, [story]);

  useEffect(() => {
    if (story) {
      setLikeCount(story.like_count ?? 0);
      setCommentCount(story.comment_count ?? 0);
      setAudioUrl(story.audio_url);
      setIsAuthor(user?.id === story.author_id);
      setCurrentPage(0); // Always start at the meta page
      setIsLiked(false);
      setIsBookmarked(false);
      hasAttemptedAutoplay.current = false;
    } else {
      setAudioUrl(undefined);
      setLikeCount(0);
      setCommentCount(0);
      setIsAuthor(false);
      setIsLiked(false);
      setIsBookmarked(false);
      setCurrentPage(0);
    }
  }, [story, user]);

  useEffect(() => {
    if (audioUrl) {
      if (!audioRef.current || audioRef.current.src !== audioUrl) {
        audioRef.current?.pause();
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = false;
        hasAttemptedAutoplay.current = false;
      }
      audioRef.current.muted = isAudioMuted;
    } else {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsAudioPlaying(false);
    }
    return () => { audioRef.current?.pause(); };
  }, [audioUrl, isAudioMuted]);

  useEffect(() => {
    // Play audio if active, on an actual content page (currentPage > 0), and not already playing/attempted.
    if (isActive && activeAudio && audioRef.current && !isAudioPlaying && !hasAttemptedAutoplay.current && currentPage > 0 && story && story.pages.length > 0) {
      audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(err => console.info("Autoplay prevented:", err));
      hasAttemptedAutoplay.current = true;
    } else if ((!isActive || currentPage === 0) && audioRef.current?.played && !audioRef.current.paused) { // Also pause if on meta page
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [isActive, activeAudio, audioUrl, currentPage, story]);

  useEffect(() => {
    if (!user || !story?.id) {
      setIsLiked(false);
      setIsBookmarked(false);
      return;
    }
    const checkInteractions = async () => {
      try {
        const { data: likeData } = await supabase.from('likes').select('id').eq('story_id', story.id).eq('user_id', user.id).maybeSingle();
        setIsLiked(!!likeData);
        const { data: bookmarkData } = await supabase.from('bookmarks').select('id').eq('story_id', story.id).eq('user_id', user.id).maybeSingle();
        setIsBookmarked(!!bookmarkData);
      } catch (error) {
        console.error("Error checking interactions for story:", story.id, error);
      }
    };
    checkInteractions();
  }, [story?.id, user]);

  const commonAuthAction = async (action: () => Promise<void>, successMessage: string, errorMessage: string, revertOptimistic: () => void) => {
    await handleAuthAction(async () => {
      try {
        await action();
        toast({ title: successMessage });
      } catch (error) {
        console.error(errorMessage, error);
        revertOptimistic();
        toast({ title: "Error", description: (error as Error)?.message || errorMessage, variant: "destructive" });
      }
    }, openModal);
  };

  const toggleLike = async () => {
    if (!story) return;
    if (!user) { openModal(); return; }
    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!originalIsLiked);
    setLikeCount(prev => !originalIsLiked ? prev + 1 : Math.max(0, prev - 1));
    await commonAuthAction(
      async () => {
        if (!originalIsLiked) await supabase.from('likes').insert({ story_id: story.id, user_id: user.id }).throwOnError();
        else await supabase.from('likes').delete().match({ story_id: story.id, user_id: user.id }).throwOnError();
      },
      !originalIsLiked ? "Story liked!" : "Like removed",
      "Could not update like status.",
      () => { setIsLiked(originalIsLiked); setLikeCount(originalLikeCount); }
    );
  };

  const toggleBookmark = async () => {
    if (!story) return;
    if (!user) { openModal(); return; }
    const originalIsBookmarked = isBookmarked;
    setIsBookmarked(!originalIsBookmarked);
    await commonAuthAction(
      async () => {
        if (!originalIsBookmarked) await supabase.from('bookmarks').insert({ story_id: story.id, user_id: user.id }).throwOnError();
        else await supabase.from('bookmarks').delete().match({ story_id: story.id, user_id: user.id }).throwOnError();
      },
      !originalIsBookmarked ? "Story bookmarked!" : "Bookmark removed",
      "Could not update bookmark status.",
      () => setIsBookmarked(originalIsBookmarked)
    );
  };

  const toggleComments = () => {
    if (!story) return;
    if (!user) { openModal(); return; }
    if (!story.pages || story.pages.length === 0) {
        toast({ title: "No content", description: "This story doesn't have any pages to comment on yet."});
        return;
    }
    setShowComments(!showComments);
  };
  
  const scrollToPage = useCallback((pageIndex: number) => {
    // pageIndex here refers to index in displayPages (0 for meta, 1+ for content)
    if (!pagesContainerRef.current || !story || pageIndex < 0 || pageIndex >= displayPages.length) return;
    const container = pagesContainerRef.current;
    const scrollAmount = readingMode === 'page' ? container.clientWidth * pageIndex : container.clientHeight * pageIndex;
    
    // Use smooth scrolling with a custom duration
    container.style.scrollBehavior = 'smooth';
    container.style.scrollSnapType = 'none'; // Temporarily disable snap for smooth scrolling
    
    container.scrollTo({
      [readingMode === 'page' ? 'left' : 'top']: scrollAmount,
      behavior: 'smooth'
    });

    // Re-enable snap after scrolling is complete
    setTimeout(() => {
      if (container) {
        container.style.scrollSnapType = readingMode === 'page' ? 'x mandatory' : 'y mandatory';
      }
    }, 500); // Adjust timing based on your scroll duration

    setCurrentPage(pageIndex);
  }, [story, readingMode, displayPages.length]);

  const handleNextPage = () => scrollToPage(currentPage + 1);
  const handlePrevPage = () => scrollToPage(currentPage - 1);

  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container || !story) return;

    const handleScroll = () => {
        if (isSwiping) return;
        const scrollDim = readingMode === 'page' ? container.scrollLeft : container.scrollTop;
        const itemDim = readingMode === 'page' ? container.clientWidth : container.clientHeight;
        if (itemDim === 0) return;
        const newPage = Math.round(scrollDim / itemDim);
        if (newPage !== currentPage && newPage >= 0 && newPage < displayPages.length) {
            setCurrentPage(newPage);
        }
    };

    // Add passive scroll listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage, story, readingMode, isSwiping, displayPages.length]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!story || displayPages.length <= 1) return; // Check against displayPages
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping || !story || displayPages.length <= 1) return; // Check against displayPages
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const swipeThreshold = 50;

    if (readingMode === 'page') {
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) handleNextPage();
        else handlePrevPage();
      }
    } else { // Assuming vertical scroll (TikTok like)
      if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < 0) handleNextPage(); // Swipe Up
        else handlePrevPage(); // Swipe Down
      }
    }
    setIsSwiping(false);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(count % 1000000 === 0 ? 0 : 1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'K';
    return count.toString();
  };

  // currentStoryPage is now less relevant as page rendering is based on displayPages[currentPage]
  // const currentStoryPage = story?.pages[currentPage > 0 ? currentPage - 1 : 0]; 

  const toggleStoryFullScreen = () => setIsFullScreen(!isFullScreen);

  if (!story) {
    return <div className="h-full w-full flex items-center justify-center bg-paper text-ink">Loading story...</div>;
  }

  const handleShare = () => {
    if (!story) return;
    toast({ title: "Share", description: "Sharing functionality to be implemented." });
  };

  const handleFollowToggle = async () => {
    if (!story || !user) {
      openModal();
      return;
    }
    const newFollowState = !isFollowingAuthor;
    setIsFollowingAuthor(newFollowState);
    toast({ title: newFollowState ? "Followed author" : "Unfollowed author" });
    // Placeholder for actual API call
  };

  return (
    <div className={`h-full w-full flex flex-col relative ${isFullScreen ? 'fixed inset-0 z-50 bg-paper dark:bg-paper-dark' : 'bg-paper dark:bg-paper-dark'} text-ink dark:text-ink-light select-none`}>
      {isFullScreen && showStoryControls && (
         <button onClick={toggleStoryFullScreen} className="absolute top-3 right-3 z-[60] p-2 bg-black/20 hover:bg-black/40 rounded-full text-white">
            <Minimize size={20} />
        </button>
      )}

      <div 
        ref={pagesContainerRef} 
        className={`flex-1 flex overflow-auto snap-mandatory ${readingMode === 'page' ? 'flex-row snap-x' : 'flex-col snap-y'} scroll-smooth hide-scrollbar relative group`}
        style={{
          scrollBehavior: 'smooth',
          scrollSnapType: readingMode === 'page' ? 'x mandatory' : 'y mandatory',
          scrollSnapStop: 'always',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {displayPages.map((page, index) => {
          if (page.type === 'meta' && story) { // Render Meta Page
            return (
              <div key="meta-page" className="w-full h-full flex-shrink-0 snap-center flex flex-col items-center justify-center p-4 md:p-8 relative text-ink dark:text-ink-light bg-paper dark:bg-paper-dark">
                <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-2xl space-y-4 md:space-y-6 py-8">
                  {story.cover_image_url && (
                    <div className="w-48 h-64 md:w-60 md:h-80 rounded-lg shadow-xl overflow-hidden mb-4 transform hover:scale-105 transition-transform duration-300 border border-border dark:border-border">
                      <Image 
                        src={story.cover_image_url} 
                        alt={`${story.title} cover`} 
                        width={240} 
                        height={320} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink dark:text-ink-light">{story.title}</h1>
                  {story.author && (
                    <Link href={`/profile/${story.author.username}`} passHref legacyBehavior>
                      <a className="text-lg sm:text-xl text-highlight hover:underline transition-colors">
                        By: {story.author.name || story.author.username || "Unknown Author"}
                      </a>
                    </Link>
                  )}
                   {story.description && <p className="text-sm sm:text-md text-muted-foreground dark:text-muted-foreground-dark line-clamp-3 max-w-lg">{story.description}</p>}
                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 my-3">
                      {story.tags.slice(0, 5).map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-highlight/10 text-highlight text-xs sm:text-sm font-medium rounded-full hover:bg-highlight/20 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  { displayPages.length > 1 && (
                    <button 
                      onClick={() => scrollToPage(1)} 
                      className="mt-6 flex items-center gap-2 px-6 py-3 bg-highlight hover:bg-highlight/90 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                    >
                      Start Reading <ArrowDownCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          }
          // Regular story page rendering (index is for displayPages, so page data is from story.pages[index-1])
          const storyPageIndex = index -1;
          const actualPage = story.pages[storyPageIndex];
          if (!actualPage) return null; // Should not happen if displayPages is correct

          return (
            <div key={`story-page-${storyPageIndex}`} className="w-full h-full flex-shrink-0 snap-center flex flex-col items-start justify-start p-2 sm:p-4 md:p-8 overflow-y-auto bg-paper dark:bg-paper-dark">
              {actualPage.type === 'image' && actualPage.image && (
                <div className="w-full flex justify-center mb-4">
                  <Image src={actualPage.image} alt={actualPage.image_alt || `Page ${storyPageIndex + 1}`} width={800} height={600} className="max-w-full max-h-[calc(100vh-8rem)] md:max-h-[calc(100vh-10rem)] object-contain rounded-md shadow-sm" />
                </div>
              )}
              <div className="prose dark:prose-invert max-w-prose mx-auto text-justify leading-relaxed text-ink dark:text-ink-light">
                {actualPage.content.map((paragraph, pIndex) => <p key={pIndex}>{paragraph}</p>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Page Navigation Arrows (Overlay) - visible only on actual story pages */}
      {currentPage > 0 && story.pages.length > 1 && readingMode === 'page' && showStoryControls && (
        <>
          {currentPage > 1 && ( // Previous button, only if not on the first actual story page
            <button 
              onClick={handlePrevPage} 
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full shadow-md transition-opacity opacity-50 hover:opacity-100 focus:opacity-100"
              aria-label="Previous page"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentPage < displayPages.length - 1 && ( // Next button
            <button 
              onClick={handleNextPage} 
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full shadow-md transition-opacity opacity-50 hover:opacity-100 focus:opacity-100"
              aria-label="Next page"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}
      
      {/* Right Action Bar (TikTok Style) - Always visible if showStoryControls */} 
      {showStoryControls && (
        <div className={`absolute right-2 top-1/2 -translate-y-1/2 md:top-1/2 md:translate-y-[-50%] flex flex-col items-center space-y-4 z-20 text-white`}>
          {story.author?.username && story.author?.avatar && (
             <div className="relative group mb-1">
              <Link href={`/profile/${story.author.username}`} passHref legacyBehavior>
                <a className="block">
                  <Image src={story.author.avatar} alt={story.author.name || 'Author avatar'} width={40} height={40} className="rounded-full border-2 border-white group-hover:opacity-80 transition-opacity" />
                </a>
              </Link>
              {user && user.id !== story.author_id && !isFollowingAuthor && (
                <button 
                  onClick={handleFollowToggle}
                  className="absolute -bottom-1 -right-1 bg-highlight text-white rounded-full p-0.5 border-2 border-paper dark:border-border hover:bg-highlight/80 transition-colors"
                  aria-label="Follow author"
                >
                  <PlusCircleIcon size={16} />
                </button>
              )}
            </div>
          )}
          
          <button onClick={toggleLike} className="flex flex-col items-center transition-colors">
            <div className={`p-2 rounded-full ${isLiked ? 'bg-red-500 text-white' : 'bg-black/40 hover:bg-black/60'} transition-colors`}>
              <Heart size={24} className={isLiked ? 'fill-current' : ''} />
            </div>
            <span className="text-xs mt-1 font-medium">{formatCount(likeCount)}</span>
          </button>
          <button onClick={toggleComments} className="flex flex-col items-center transition-colors">
            <div className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
              <MessageCircle size={24} />
            </div>
            <span className="text-xs mt-1 font-medium">{formatCount(commentCount)}</span>
          </button>
          <button onClick={toggleBookmark} className="flex flex-col items-center transition-colors">
            <div className={`p-2 rounded-full ${isBookmarked ? 'bg-yellow-500 text-white' : 'bg-black/40 hover:bg-black/60'} transition-colors`}>
              <Bookmark size={24} className={isBookmarked ? 'fill-current' : ''} />
            </div>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center transition-colors">
            <div className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
              <Share2 size={24} />
            </div>
          </button>

          <button onClick={() => setShowStoryControls(!showStoryControls)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm">
            {showStoryControls ? <PanelTopClose size={22}/> : <PanelTopOpen size={22}/>}
          </button>

          {!isFullScreen && (
            <button onClick={toggleStoryFullScreen} className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm">
              <Maximize size={22}/>
            </button>
          )}
        </div>
      )}
      
      {/* Show UI Button (when controls are hidden) */}
      {!showStoryControls && (
         <button 
            onClick={() => setShowStoryControls(true)} 
            className="fixed right-3 bottom-3 md:right-4 md:bottom-4 p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white z-20 shadow-lg" 
            aria-label="Show story controls"
          >
            <PanelTopOpen size={24} />
          </button>
      )}

      {/* Audio Player and Pagination Dots (Bottom Center Overlay) - Visible only on actual story pages */}
      {currentPage > 0 && showStoryControls && story.pages.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col items-center space-y-2">
            {audioUrl && (
                <div className="flex items-center space-x-3 p-2 bg-black/40 backdrop-blur-sm rounded-full shadow-md">
                    <button onClick={() => setIsAudioMuted(!isAudioMuted)} className="p-1.5 text-white hover:text-gray-300">
                        {isAudioMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                    </button>
                    <button 
                      onClick={() => {
                        if (audioRef.current) {
                            if (audioRef.current.paused) {
                                audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(e => console.warn("Play action failed", e));
                            } else {
                                audioRef.current.pause();
                                setIsAudioPlaying(false);
                            }
                        }
                      }} 
                      className="p-1.5 text-white hover:text-gray-300"
                    >
                        {isAudioPlaying ? <PauseCircle size={22}/> : <PlayCircle size={22}/>}
                    </button>
                </div>
            )}
            {story.pages.length > 1 && readingMode === 'page' && (
              <div className="flex justify-center items-center space-x-1.5 mt-1">
                {/* Dots should refer to actual story pages, so length is story.pages.length and active is currentPage-1 */}
                {story.pages.map((_, index) => (
                  <button 
                    key={`dot-${index}`} 
                    onClick={() => scrollToPage(index + 1)} // scrollToPage expects displayPages index
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${(currentPage - 1) === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
      )}
      
      {showComments && story && (
        <CommentsSection storyId={story.id} onClose={toggleComments} />
      )}
      {showAudioGenerator && story && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-paper dark:bg-paper-dark p-6 rounded-lg shadow-xl w-full max-w-md text-ink dark:text-ink-light">
             <h3 className="text-lg font-semibold mb-4">Generate Audio for Story</h3>
            <AudioGenerator story={story} onAudioGenerated={url => { setAudioUrl(url); setShowAudioGenerator(false); }} />
            <button onClick={() => setShowAudioGenerator(false)} className="mt-4 text-sm text-muted-foreground hover:text-ink dark:hover:text-ink-light">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
