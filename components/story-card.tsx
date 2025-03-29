"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, MessageCircle, Clock } from "lucide-react";
import type { Story } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { hasUserLikedStory, hasUserBookmarkedStory } from "@/lib/database";

export default function StoryCard({ story }: { story: Story }) {
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(story.like_count || 0);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial like and bookmark status
  useEffect(() => {
    const checkInteractionStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [likedStatus, bookmarkedStatus] = await Promise.all([
          hasUserLikedStory(user.id, story.id),
          hasUserBookmarkedStory(user.id, story.id)
        ]);
        
        setIsLiked(likedStatus);
        setIsBookmarked(bookmarkedStatus);
      } catch (error) {
        console.error("Error checking interaction status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInteractionStatus();
  }, [user, story.id]);

  // Format the date to a readable format
  const formattedDate = new Date(story.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Format tags for display
  const displayTags = story.tags?.slice(0, 3) || [];

  // Format the title to a reasonable length
  const displayTitle = story.title.length > 60
    ? `${story.title.substring(0, 60)}...`
    : story.title;

  // Get the first paragraph of the first page for the preview
  const previewText = story.pages[0]?.content[0] || "";
  const displayPreview = previewText.length > 120
    ? `${previewText.substring(0, 120)}...`
    : previewText;

  const handleLike = async () => {
    if (!user) {
      openModal();
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (newIsLiked) {
        await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: story.id }),
        });
      } else {
        await fetch(`/api/likes?storyId=${story.id}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert UI state on error
      setIsLiked(!newIsLiked);
      setLikeCount(prev => !newIsLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      openModal();
      return;
    }

    const newIsBookmarked = !isBookmarked;
    setIsBookmarked(newIsBookmarked);

    try {
      if (newIsBookmarked) {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: story.id }),
        });
      } else {
        await fetch(`/api/bookmarks?storyId=${story.id}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // Revert UI state on error
      setIsBookmarked(!newIsBookmarked);
    }
  };

  return (
    <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.01] hover:shadow-lg">
      <Link href={`/story/${story.id}`} className="block">
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2 text-ink dark:text-ink">{displayTitle}</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={story.author.avatar || "/placeholder.svg"}
                alt={story.author.name}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-ink-light dark:text-ink-light">{story.author.name}</span>
            <span className="text-xs text-ink-light/70 dark:text-ink-light/70">• {formattedDate}</span>
          </div>
          
          <p className="text-sm text-ink-light dark:text-ink-light mb-3 line-clamp-3">
            {displayPreview}
          </p>
          
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {displayTags.map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-paper-dark/10 dark:bg-paper/10 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      
      <div className="px-4 py-3 border-t border-paper-dark/10 dark:border-paper/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-highlight text-highlight" : ""}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          
          <Link 
            href={`/story/${story.id}?comments=true`}
            className="flex items-center gap-1 text-xs text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
          >
            <MessageCircle className="h-4 w-4" />
            {(story.comment_count || 0) > 0 && <span>{story.comment_count}</span>}
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs text-ink-light dark:text-ink-light">
            <Clock className="h-4 w-4" />
            <span>{story.read_time}</span>
          </div>
          
          <button 
            onClick={handleBookmark}
            disabled={isLoading}
            className="text-ink-light dark:text-ink-light hover:text-highlight dark:hover:text-highlight"
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-highlight text-highlight" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
