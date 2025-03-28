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
  created_at: string
  updated_at: string
  profiles: {
    display_name: string
    avatar_url: string
  }
}

export interface Profile {
  id: string
  user_id: string
  display_name: string
  avatar_url: string
  created_at: string
  updated_at: string
}
