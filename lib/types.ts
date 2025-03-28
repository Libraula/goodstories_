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
  id: string
  title: string
  author: Author
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
