import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/utils/supabase/client'
import type { Database, StoryPage, StoryInsert } from './database.types'
import type { Story } from './types'

// Create Supabase client
const supabase = createClient()

// Define StoryRow type for database operations
interface StoryRow {
  id: string;
  title: string;
  author_id: string;
  pages?: StoryPage[];
  tags?: string[];
  read_time?: string;
  like_count?: number;
  comment_count?: number;
  bookmark_count?: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

// Story types
export type StoryUpdate = Database['public']['Tables']['stories']['Update']

// Comment types
export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Calculate read time based on word count
export function calculateReadTime(pages: StoryPage[]): string {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;
  
  // Count total words in all pages
  let totalWords = 0;
  pages.forEach(page => {
    page.content.forEach(paragraph => {
      totalWords += paragraph.split(/\s+/).filter(Boolean).length;
    });
  });
  
  // Calculate minutes
  const minutes = Math.ceil(totalWords / wordsPerMinute);
  
  return `${minutes} min read`;
}

// Helper function to transform story data
function transformStoryData(story: StoryRow): Story {
  // Extract the author information from the profiles join
  // Handle case where profiles might be null or undefined
  const author = {
    id: story.profiles?.id || story.author_id,
    name: story.profiles?.name || 'Anonymous',
    username: story.profiles?.username || 'anonymous',
    avatar: story.profiles?.avatar_url || '/placeholder.svg'
  };

  // Transform the story data
  const transformedStory: Story = {
    id: story.id,
    title: story.title,
    author_id: story.author_id,
    author: author,
    pages: story.pages || [],
    tags: story.tags || [],
    read_time: story.read_time || '3 min',
    like_count: story.like_count || 0,
    comment_count: story.comment_count || 0,
    bookmark_count: story.bookmark_count || 0,
    created_at: story.created_at,
    updated_at: story.updated_at
  };

  return transformedStory;
}

// Ensure user profile exists
export async function ensureProfile(userId: string, username?: string, name?: string, avatarUrl?: string) {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking profile:', profileError);
    }

    if (existingProfile) {
      return existingProfile; // Profile already exists
    }

    // Try to get user info, but don't fail if auth is missing
    let user = null;
    try {
      const { data: userInfo, error: userError } = await supabase.auth.getUser();
      if (!userError) {
        user = userInfo?.user;
      }
    } catch (authError) {
      console.warn('Auth session missing when ensuring profile, continuing with defaults');
    }

    const defaultUsername = username || user?.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
    const defaultName = name || defaultUsername;
    const defaultAvatarUrl = avatarUrl || '/placeholder.svg';

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: defaultUsername,
        name: defaultName,
        avatar_url: defaultAvatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }

    return newProfile;
  } catch (err) {
    console.error('Exception ensuring profile exists:', err);
    return null;
  }
}

// Stories
export async function getStories(limit = 10, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:profiles(id, username, name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching stories:', error)
      return []
    }

    // Explicitly transform each story to ensure it has the author property
    return data.map(story => transformStoryData(story as StoryRow));
  } catch (err) {
    console.error('Exception fetching stories:', err)
    return []
  }
}

export async function getStoryById(id: string) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:profiles(id, username, name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching story:', error)
      return null
    }

    return transformStoryData(data as StoryRow)
  } catch (err) {
    console.error('Exception fetching story:', err)
    return null
  }
}

export async function createStory(story: StoryInsert) {
  try {
    // If author_id is provided, ensure profile exists and get profile data
    let profileData = null;
    if (story.author_id) {
      // Get or create user profile
      profileData = await ensureProfile(story.author_id);
      
      if (!profileData) {
        console.warn('Creating story without verified profile');
      }
    }

    const readTime = calculateReadTime(story.pages);
    const storyData = {
      ...story,
      // For anonymous users, we'll use a placeholder author_id if none provided
      author_id: story.author_id || 'anonymous',
      read_time: readTime,
      like_count: 0,
      comment_count: 0,
      bookmark_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('stories')
      .insert(storyData)
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error('Error creating story:', error);
      return null;
    }

    return transformStoryData(data);
  } catch (err) {
    console.error('Exception creating story:', err);
    return null;
  }
}

export async function likeStory(userId: string, storyId: string) {
  // Ensure user profile exists
  const profile = await ensureProfile(userId);
  
  if (!profile) {
    console.error('Failed to ensure profile exists for liking story');
    return null;
  }

  const { data, error } = await supabase
    .from('likes')
    .insert([
      { id: uuidv4(), user_id: userId, story_id: storyId, created_at: new Date().toISOString() }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error liking story:', error);
    return null;
  }

  return data;
}

export async function unlikeStory(userId: string, storyId: string) {
  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ user_id: userId, story_id: storyId });

  if (error) {
    console.error('Error unliking story:', error);
    return false;
  }

  return true;
}

export async function isStoryLiked(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

export async function bookmarkStory(userId: string, storyId: string) {
  // Ensure user profile exists
  const profile = await ensureProfile(userId);
  
  if (!profile) {
    console.error('Failed to ensure profile exists for bookmarking story');
    return null;
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([
      { id: uuidv4(), user_id: userId, story_id: storyId, created_at: new Date().toISOString() }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error bookmarking story:', error);
    return null;
  }

  return data;
}

export async function unbookmarkStory(userId: string, storyId: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .match({ user_id: userId, story_id: storyId });

  if (error) {
    console.error('Error unbookmarking story:', error);
    return false;
  }

  return true;
}

export async function isStoryBookmarked(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

export async function getBookmarkedStories(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      stories:stories(
        *,
        profiles:profiles(id, username, name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarked stories:', error)
    return []
  }

  return data.map((bookmark: any) => ({
    id: bookmark.stories.id,
    title: bookmark.stories.title,
    pages: bookmark.stories.pages,
    tags: bookmark.stories.tags,
    read_time: bookmark.stories.read_time,
    like_count: bookmark.stories.like_count,
    comment_count: bookmark.stories.comment_count,
    bookmark_count: bookmark.stories.bookmark_count,
    created_at: bookmark.stories.created_at,
    updated_at: bookmark.stories.updated_at,
    author: {
      id: bookmark.stories.author_id,
      name: bookmark.stories.profiles.name || bookmark.stories.profiles.username,
      avatar: bookmark.stories.profiles.avatar_url
    }
  }))
}

export async function getUserBookmarkedStories(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      stories:stories(
        *,
        profiles:profiles(id, username, name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarked stories:', error)
    return []
  }

  // Explicitly transform each story to ensure it has the author property
  return data.map((bookmark: any) => transformStoryData(bookmark.stories as StoryRow));
}

export async function getUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('story_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user bookmarks:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get the story IDs from the bookmarks
  const storyIds = data.map(bookmark => bookmark.story_id);

  // Fetch the stories
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*, profiles(*)')
    .in('id', storyIds)
    .order('created_at', { ascending: false });

  if (storiesError) {
    console.error('Error fetching bookmarked stories:', storiesError);
    return [];
  }

  if (!stories || stories.length === 0) {
    return [];
  }

  // Transform the stories
  return stories.map(story => transformStoryData(story as StoryRow));
}

export async function getUserStories(userId: string) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:profiles(id, username, name, avatar_url)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stories:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the stories to include author information
    return data.map(story => transformStoryData(story as StoryRow));
  } catch (err) {
    console.error('Exception fetching user stories:', err);
    return [];
  }
}

// Comments
export async function getComments(storyId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:profiles(id, username, name, avatar_url)
    `)
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Transform data to match the expected format
  const comments = data.map(comment => ({
    id: comment.id,
    author: {
      name: comment.profiles.name || comment.profiles.username,
      avatar: comment.profiles.avatar_url
    },
    text: comment.content,
    time: formatTimeAgo(new Date(comment.created_at)),
    likes: comment.likes_count
  }))

  return comments || []
}

export async function createComment(userId: string, storyId: string, content: string) {
  // Ensure user profile exists
  const profile = await ensureProfile(userId);
  
  if (!profile) {
    console.error('Failed to ensure profile exists for creating comment');
    return null;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([
      { 
        id: uuidv4(), 
        author_id: userId, 
        story_id: storyId, 
        content, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select('*, profiles(*)')
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return null;
  }

  return transformComment(data);
}

export async function likeComment(userId: string, commentId: string) {
  // Ensure user profile exists
  const profile = await ensureProfile(userId);
  
  if (!profile) {
    console.error('Failed to ensure profile exists for liking comment');
    return null;
  }

  const { data, error } = await supabase
    .from('comment_likes')
    .insert([
      { id: uuidv4(), user_id: userId, comment_id: commentId, created_at: new Date().toISOString() }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error liking comment:', error);
    return null;
  }

  return data;
}

export async function unlikeComment(userId: string, commentId: string) {
  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .match({ user_id: userId, comment_id: commentId });

  if (error) {
    console.error('Error unliking comment:', error);
    return false;
  }

  return true;
}

export async function isCommentLiked(userId: string, commentId: string) {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

// User profiles
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Follow functionality
export async function followUser(followerId: string, followingId: string) {
  // Ensure both user profiles exist
  await ensureProfile(followerId);
  await ensureProfile(followingId);

  const { data, error } = await supabase
    .from('follows')
    .insert([
      { 
        id: uuidv4(), 
        follower_id: followerId, 
        following_id: followingId, 
        created_at: new Date().toISOString() 
      }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('Error following user:', error);
    return null;
  }

  return data;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }

  return true;
}

export async function isFollowingUser(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking follow status:', error);
    return false;
  }

  return !!data;
}

// Check if a user has liked a story
export async function hasUserLikedStory(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking if user liked story:', error);
    return false;
  }

  return !!data;
}

// Check if a user has bookmarked a story
export async function hasUserBookmarkedStory(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking if user bookmarked story:', error);
    return false;
  }

  return !!data;
}

// Helper functions
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`
}

function generateUsername(): string {
  const adjectives = ['happy', 'clever', 'brave', 'calm', 'eager', 'fair', 'kind', 'proud', 'wise', 'witty']
  const nouns = ['reader', 'writer', 'poet', 'author', 'creator', 'artist', 'thinker', 'dreamer', 'explorer', 'storyteller']
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNumber = Math.floor(Math.random() * 1000)
  
  return `${randomAdjective}${randomNoun}${randomNumber}`
}

function transformComment(comment: any): any {
  return {
    id: comment.id,
    author: {
      name: comment.profiles.name || comment.profiles.username,
      avatar: comment.profiles.avatar_url
    },
    text: comment.content,
    time: formatTimeAgo(new Date(comment.created_at)),
    likes: comment.likes_count
  }
}
