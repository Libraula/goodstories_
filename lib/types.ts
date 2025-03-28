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

