import { supabase } from './supabase'
import type { Database, StoryPage } from './database.types'
import { v4 as uuidv4 } from 'uuid'

// Story types
export type Story = Database['public']['Tables']['stories']['Row']
export type StoryInsert = Database['public']['Tables']['stories']['Insert']
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

// Stories
export async function getStories(limit = 10, offset = 0) {
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

  // Transform data to match the expected format
  const stories = data.map(story => ({
    ...story,
    author: {
      name: story.profiles.name || story.profiles.username,
      avatar: story.profiles.avatar_url
    }
  }))

  return stories || []
}

export async function getStoryById(id: string) {
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

  // Transform data to match the expected format
  const story = {
    ...data,
    author: {
      name: data.profiles.name || data.profiles.username,
      avatar: data.profiles.avatar_url
    }
  }

  return story
}

export async function createStory(story: StoryInsert) {
  // Make sure we have a read time
  if (!story.readTime) {
    story.readTime = calculateReadTime(story.pages);
  }

  // Set default counts if not provided
  story.likeCount = story.likeCount || 0;
  story.commentCount = story.commentCount || 0;
  story.bookmarkCount = story.bookmarkCount || 0;
  
  // Set timestamps
  const now = new Date().toISOString();
  story.created_at = now;
  story.updated_at = now;

  const { data, error } = await supabase
    .from('stories')
    .insert(story)
    .select()

  if (error) {
    console.error('Error creating story:', error)
    return null
  }

  // Increment the user's story count
  await supabase.rpc('increment_user_stories', { user_id: story.author_id })

  return data[0]
}

// Likes
export async function likeStory(userId: string, storyId: string) {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single()

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId)

    if (deleteError) {
      console.error('Error unliking story:', deleteError)
      return false
    }

    // Update the story's like count
    const { error: updateError } = await supabase
      .from('stories')
      .update({ likeCount: supabase.rpc('decrement_likes', { story_id: storyId }) })
      .eq('id', storyId)

    if (updateError) {
      console.error('Error updating like count:', updateError)
    }

    return false // Unliked
  } else {
    // Like
    const { error: insertError } = await supabase
      .from('likes')
      .insert({
        id: uuidv4(),
        user_id: userId,
        story_id: storyId,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error liking story:', insertError)
      return false
    }

    // Update the story's like count
    const { error: updateError } = await supabase
      .from('stories')
      .update({ likeCount: supabase.rpc('increment_likes', { story_id: storyId }) })
      .eq('id', storyId)

    if (updateError) {
      console.error('Error updating like count:', updateError)
    }

    return true // Liked
  }
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

// Bookmarks
export async function bookmarkStory(userId: string, storyId: string) {
  // Check if already bookmarked
  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single()

  if (existingBookmark) {
    // Remove bookmark
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId)

    if (deleteError) {
      console.error('Error removing bookmark:', deleteError)
      return false
    }

    // Update the story's bookmark count
    const { error: updateError } = await supabase
      .from('stories')
      .update({ bookmarkCount: supabase.rpc('decrement_bookmarks', { story_id: storyId }) })
      .eq('id', storyId)

    if (updateError) {
      console.error('Error updating bookmark count:', updateError)
    }

    return false // Unbookmarked
  } else {
    // Add bookmark
    const { error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        id: uuidv4(),
        user_id: userId,
        story_id: storyId,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error bookmarking story:', insertError)
      return false
    }

    // Update the story's bookmark count
    const { error: updateError } = await supabase
      .from('stories')
      .update({ bookmarkCount: supabase.rpc('increment_bookmarks', { story_id: storyId }) })
      .eq('id', storyId)

    if (updateError) {
      console.error('Error updating bookmark count:', updateError)
    }

    return true // Bookmarked
  }
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

  // Transform data to match the expected format
  const stories = data.map(bookmark => ({
    ...bookmark.stories,
    author: {
      name: bookmark.stories.profiles.name || bookmark.stories.profiles.username,
      avatar: bookmark.stories.profiles.avatar_url
    }
  }))

  return stories || []
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

export async function addComment(storyId: string, userId: string, content: string) {
  const comment = {
    id: uuidv4(),
    user_id: userId,
    story_id: storyId,
    content: content,
    created_at: new Date().toISOString(),
    likes_count: 0
  }

  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()

  if (error) {
    console.error('Error adding comment:', error)
    return null
  }

  // Update the story's comment count
  const { error: updateError } = await supabase
    .from('stories')
    .update({ commentCount: supabase.rpc('increment_comments', { story_id: storyId }) })
    .eq('id', storyId)

  if (updateError) {
    console.error('Error updating comment count:', updateError)
  }

  // Get the user profile for the comment
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username, name, avatar_url')
    .eq('user_id', userId)
    .single()

  // Format the comment for the UI
  const formattedComment = {
    id: data[0].id,
    author: {
      name: profileData?.name || profileData?.username || 'Anonymous',
      avatar: profileData?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    text: data[0].content,
    time: 'Just now',
    likes: 0
  }

  return formattedComment
}

export async function likeComment(userId: string, commentId: string) {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .single()

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId)

    if (deleteError) {
      console.error('Error unliking comment:', deleteError)
      return false
    }

    // Update the comment's like count
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: supabase.rpc('decrement_comment_likes', { comment_id: commentId }) })
      .eq('id', commentId)

    if (updateError) {
      console.error('Error updating comment like count:', updateError)
    }

    return false // Unliked
  } else {
    // Like
    const { error: insertError } = await supabase
      .from('comment_likes')
      .insert({
        id: uuidv4(),
        user_id: userId,
        comment_id: commentId,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error liking comment:', insertError)
      return false
    }

    // Update the comment's like count
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: supabase.rpc('increment_comment_likes', { comment_id: commentId }) })
      .eq('id', commentId)

    if (updateError) {
      console.error('Error updating comment like count:', updateError)
    }

    return true // Liked
  }
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

// Follows
export async function followUser(followerId: string, followingId: string) {
  // Don't allow following yourself
  if (followerId === followingId) {
    return false
  }
  
  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (existingFollow) {
    // Unfollow
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (deleteError) {
      console.error('Error unfollowing user:', deleteError)
      return false
    }

    // Update follower counts
    await supabase
      .from('profiles')
      .update({ following_count: supabase.rpc('decrement_following', { user_id: followerId }) })
      .eq('user_id', followerId)

    await supabase
      .from('profiles')
      .update({ followers_count: supabase.rpc('decrement_followers', { user_id: followingId }) })
      .eq('user_id', followingId)

    return false // Unfollowed
  } else {
    // Follow
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        id: uuidv4(),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error following user:', insertError)
      return false
    }

    // Update follower counts
    await supabase
      .from('profiles')
      .update({ following_count: supabase.rpc('increment_following', { user_id: followerId }) })
      .eq('user_id', followerId)

    await supabase
      .from('profiles')
      .update({ followers_count: supabase.rpc('increment_followers', { user_id: followingId }) })
      .eq('user_id', followingId)

    return true // Followed
  }
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

// Profiles
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function createOrUpdateProfile(userId: string, profile: Partial<Profile>) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data[0]
  } else {
    // Create new profile
    const now = new Date().toISOString()
    const newProfile = {
      id: uuidv4(),
      user_id: userId,
      username: profile.username || generateUsername(),
      name: profile.name || '',
      avatar_url: profile.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
      bio: profile.bio || '',
      created_at: now,
      updated_at: now,
      followers_count: 0,
      following_count: 0,
      stories_count: 0
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()

    if (error) {
      console.error('Error creating profile:', error)
      return null
    }

    return data[0]
  }
}

export async function getUserStories(userId: string) {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      profiles:profiles(id, username, name, avatar_url)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user stories:', error)
    return []
  }

  // Transform data to match the expected format
  const stories = data.map(story => ({
    ...story,
    author: {
      name: story.profiles.name || story.profiles.username,
      avatar: story.profiles.avatar_url
    }
  }))

  return stories || []
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
