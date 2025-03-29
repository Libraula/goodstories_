"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserBookmarks } from "@/lib/database";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/hooks/use-auth-modal";
import StoryCard from "@/components/story-card";
import { Loader2, BookmarkIcon } from "lucide-react";
import type { Story } from "@/lib/types";

export default function BookmarksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [bookmarks, setBookmarks] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        openModal();
        return;
      }
      
      setIsLoading(true);
      try {
        const bookmarkedStories = await getUserBookmarks(user.id);
        setBookmarks(bookmarkedStories);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, openModal]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      openModal();
    }
  }, [user, isLoading, openModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <BookmarkIcon className="h-6 w-6 text-highlight" />
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
      </div>
      
      {bookmarks.length === 0 ? (
        <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md p-8 text-center">
          <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-ink-light/50 dark:text-ink-light/50" />
          <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
          <p className="text-ink-light dark:text-ink-light mb-4">
            You haven't bookmarked any stories yet. Browse stories and click the bookmark icon to save them for later.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-highlight text-white rounded-md hover:bg-highlight/90 transition-colors"
          >
            Discover Stories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
