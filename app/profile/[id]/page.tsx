"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUserProfile, getUserStories, followUser, unfollowUser, isFollowingUser } from "@/lib/database";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/hooks/use-auth-modal";
import StoryCard from "@/components/story-card";
import { User, PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import type { Story } from "@/lib/types";

interface ProfileData {
  id: string;
  username?: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  story_count?: number;
  follower_count?: number;
  following_count?: number;
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const profileData = await getUserProfile(id as string);
        setProfile(profileData);
        
        const userStories = await getUserStories(id as string);
        setStories(userStories);
        
        if (user) {
          const followStatus = await isFollowingUser(user.id, id as string);
          setIsFollowing(followStatus);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [id, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      openModal();
      return;
    }

    if (!profile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id, profile.id);
        setIsFollowing(false);
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            follower_count: Math.max(0, (prev.follower_count || 0) - 1)
          };
        });
      } else {
        await followUser(user.id, profile.id);
        setIsFollowing(true);
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            follower_count: (prev.follower_count || 0) + 1
          };
        });
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-highlight" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <p>The author profile you're looking for doesn't exist.</p>
        <Link href="/" className="text-highlight hover:underline mt-4 inline-block">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-paper dark:bg-paper-dark rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-highlight">
            <Image
              src={profile.avatar_url || "/placeholder.svg"}
              alt={profile.name || "Author"}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-ink-light dark:text-ink-light mb-2">@{profile.username}</p>
            
            {profile.bio && (
              <p className="mb-4">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="text-center">
                <span className="block font-bold">{profile.story_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Stories</span>
              </div>
              <div className="text-center">
                <span className="block font-bold">{profile.follower_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Followers</span>
              </div>
              <div className="text-center">
                <span className="block font-bold">{profile.following_count || 0}</span>
                <span className="text-sm text-ink-light dark:text-ink-light">Following</span>
              </div>
            </div>
          </div>
          
          {user && user.id !== profile.id && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                isFollowing
                  ? "bg-paper-dark dark:bg-paper text-ink-light dark:text-ink-dark hover:bg-red-100 dark:hover:bg-red-900"
                  : "bg-highlight text-white hover:bg-highlight/90"
              }`}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <MinusCircle className="h-4 w-4" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Stories by {profile.name}</h2>
      
      {stories.length === 0 ? (
        <p className="text-ink-light dark:text-ink-light">This author hasn't published any stories yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
