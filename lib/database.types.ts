export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface StoryPage {
  type: "text" | "image"
  content: string[]
  image?: string
  imageAlt?: string
}

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          title: string
          author_id: string
          pages: StoryPage[]
          tags: string[]
          readTime: string
          likeCount: number
          commentCount: number
          bookmarkCount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author_id: string
          pages: StoryPage[]
          tags?: string[]
          readTime?: string
          likeCount?: number
          commentCount?: number
          bookmarkCount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author_id?: string
          pages?: StoryPage[]
          tags?: string[]
          readTime?: string
          likeCount?: number
          commentCount?: number
          bookmarkCount?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          story_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          story_id: string
          content: string
          created_at: string
          likes_count: number
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          content: string
          created_at?: string
          likes_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          content?: string
          created_at?: string
          likes_count?: number
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          story_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          name: string
          avatar_url: string
          bio: string
          created_at: string
          updated_at: string
          followers_count: number
          following_count: number
          stories_count: number
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          name?: string
          avatar_url?: string
          bio?: string
          created_at?: string
          updated_at?: string
          followers_count?: number
          following_count?: number
          stories_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          name?: string
          avatar_url?: string
          bio?: string
          created_at?: string
          updated_at?: string
          followers_count?: number
          following_count?: number
          stories_count?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_likes: {
        Args: { story_id: string }
        Returns: number
      }
      decrement_likes: {
        Args: { story_id: string }
        Returns: number
      }
      increment_bookmarks: {
        Args: { story_id: string }
        Returns: number
      }
      decrement_bookmarks: {
        Args: { story_id: string }
        Returns: number
      }
      increment_comments: {
        Args: { story_id: string }
        Returns: number
      }
      decrement_comments: {
        Args: { story_id: string }
        Returns: number
      }
      increment_comment_likes: {
        Args: { comment_id: string }
        Returns: number
      }
      decrement_comment_likes: {
        Args: { comment_id: string }
        Returns: number
      }
      increment_followers: {
        Args: { user_id: string }
        Returns: number
      }
      decrement_followers: {
        Args: { user_id: string }
        Returns: number
      }
      increment_following: {
        Args: { user_id: string }
        Returns: number
      }
      decrement_following: {
        Args: { user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
