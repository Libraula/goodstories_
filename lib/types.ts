export interface Author {
  name: string
  avatar: string
}

export interface StoryPage {
  type: "text" | "image"
  content: string[]
  image?: string
  imageAlt?: string
}

export interface Story {
  title: string
  author: Author
  pages: StoryPage[]
  tags: string[]
  readTime: string
  likeCount: number
  commentCount: number
}

export interface DBStory {
  id: string
  title: string
  content: string
  author_id: string
  is_published: boolean
  cover_image_url?: string
  read_time?: number
  created_at: string
  updated_at: string
  profiles: {
    display_name: string
    avatar_url: string
  }
  tags?: string[]
  like_count?: number
  comment_count?: number
  is_bookmarked?: boolean
}

export interface Profile {
  id: string
  user_id: string
  display_name: string
  avatar_url: string
  bio?: string
  created_at: string
  updated_at: string
  follower_count?: number
  following_count?: number
  is_following?: boolean
}

export interface Comment {
  id: string
  user_id: string
  story_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    display_name: string
    avatar_url: string
  }
}

export interface Like {
  id: string
  user_id: string
  story_id: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  story_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}
