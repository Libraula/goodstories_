export interface Author {
  id?: string
  name: string
  avatar: string
}

export interface StoryPage {
  type: "text" | "image" | "meta"
  content: string[]
  image?: string
  image_alt?: string
}

export interface Story {
  id: string
  title: string
  author_id: string
  author: {
    id: string
    name: string
    username: string
    avatar: string
  }
  pages: StoryPage[]
  tags: string[]
  read_time: string
  like_count: number
  comment_count: number
  bookmark_count: number
  created_at: string
  updated_at: string
  audio_url?: string
  audio_voice?: string
  description?: string
  sound_title?: string
  cover_image_url?: string
}

// Database row types
export interface StoryRow {
  id: string
  title: string
  author_id: string
  pages?: StoryPage[]
  tags?: string[]
  read_time?: string
  like_count?: number
  comment_count?: number
  bookmark_count?: number
  created_at: string
  updated_at: string
  audio_url?: string
  audio_voice?: string
  description?: string
  sound_title?: string
  cover_image_url?: string
  profiles?: {
    id: string
    name?: string
    username?: string
    avatar_url?: string
  }
}
