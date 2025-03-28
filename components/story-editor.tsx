"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createStory, calculateReadTime } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"
import { X, Save, Tag, AlertCircle } from "lucide-react"
import { StoryPage } from "@/lib/database.types"

const MAX_WORD_COUNT = 700
const WORDS_PER_PAGE = 150

export default function StoryEditor({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [pages, setPages] = useState<StoryPage[]>([])
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  // Calculate word count and pages
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean)
    setWordCount(words.length)

    // Split content into pages (approximately WORDS_PER_PAGE words per page)
    const contentPages: StoryPage[] = []
    let currentPageContent: string[] = []
    let currentPageWordCount = 0
    let currentParagraph = ""

    words.forEach((word, index) => {
      // Add word to current paragraph
      currentParagraph += (currentParagraph ? " " : "") + word
      
      // If we reach the end of a sentence or it's the last word, end the paragraph
      const isEndOfSentence = word.endsWith('.') || word.endsWith('!') || word.endsWith('?')
      const isLastWord = index === words.length - 1
      
      if (isEndOfSentence || isLastWord) {
        // Add paragraph to current page
        currentPageContent.push(currentParagraph)
        currentPageWordCount += currentParagraph.split(/\s+/).filter(Boolean).length
        currentParagraph = ""
        
        // If we've reached the word limit for this page, create a new page
        if (currentPageWordCount >= WORDS_PER_PAGE || isLastWord) {
          contentPages.push({
            type: "text",
            content: [...currentPageContent]
          })
          currentPageContent = []
          currentPageWordCount = 0
        }
      }
    })

    // If there's still content that hasn't been added to a page
    if (currentPageContent.length > 0) {
      contentPages.push({
        type: "text",
        content: currentPageContent
      })
    }

    setPages(contentPages)
  }, [content])

  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [])

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!user) {
      openModal()
      return
    }

    if (!title.trim()) {
      setError("Please enter a title for your story")
      return
    }

    if (wordCount === 0) {
      setError("Please write some content for your story")
      return
    }

    if (wordCount > MAX_WORD_COUNT) {
      setError(`Your story is too long. Please keep it under ${MAX_WORD_COUNT} words`)
      return
    }

    if (pages.length === 0) {
      setError("Unable to format your story into pages. Please try again.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const readTime = calculateReadTime(pages)
      
      const newStory = {
        id: uuidv4(),
        title: title.trim(),
        author_id: user.id,
        pages: pages,
        tags: tags.length > 0 ? tags : ["story"],
        readTime: readTime,
        likeCount: 0,
        commentCount: 0,
        bookmarkCount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log("Creating story with data:", newStory)
      const result = await createStory(newStory)
      
      if (result) {
        console.log("Story created successfully:", result)
        onSuccess()
      } else {
        console.error("Failed to create story - no result returned")
        setError("Failed to create story. Please try again.")
      }
    } catch (err) {
      console.error("Error creating story:", err)
      setError("An error occurred while creating your story")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-paper rounded-2xl shadow-lg w-full max-w-3xl h-[80vh] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300 flex flex-col">
        <div className="editor-header p-4 flex justify-between items-center border-b border-paper-dark/20 dark:border-paper/20">
          <h2 className="text-xl font-bold text-highlight dark:text-highlight">Create a Story</h2>
          <button
            onClick={onClose}
            className="text-ink-light dark:text-ink-light hover:text-ink dark:hover:text-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="editor-body flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold p-2 bg-transparent border-b border-paper-dark/20 dark:border-paper/20 text-ink dark:text-ink focus:outline-none focus:border-highlight"
              maxLength={100}
            />
          </div>

          <div className="mb-6 relative">
            <textarea
              ref={editorRef}
              placeholder="Write your story here... (max 700 words)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[300px] p-4 bg-paper/30 dark:bg-paper-dark/30 rounded-lg text-ink dark:text-ink focus:outline-none focus:ring-1 focus:ring-highlight resize-none"
            />
            <div className={`word-count absolute bottom-3 right-3 text-sm ${wordCount > MAX_WORD_COUNT ? 'text-red dark:text-red' : 'text-ink-light dark:text-ink-light'}`}>
              {wordCount}/{MAX_WORD_COUNT} words
            </div>
          </div>

          <div className="tags-section mb-6">
            <div className="flex items-center mb-2">
              <Tag size={18} className="mr-2 text-ink-light dark:text-ink-light" />
              <h3 className="text-md font-medium text-ink dark:text-ink">Tags (max 5)</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="tag bg-paper dark:bg-paper-dark py-1 px-3 rounded-full text-sm text-ink dark:text-ink flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-ink-light dark:text-ink-light hover:text-ink dark:hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className="flex-1 p-2 bg-paper/30 dark:bg-paper-dark/30 rounded-l-lg text-ink dark:text-ink focus:outline-none focus:ring-1 focus:ring-highlight text-sm"
                disabled={tags.length >= 5}
              />
              <button
                onClick={handleAddTag}
                disabled={tags.length >= 5}
                className="bg-highlight dark:bg-highlight text-white px-4 rounded-r-lg hover:bg-highlight/90 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message mb-4 p-3 bg-red/10 border border-red/20 rounded-lg flex items-start">
              <AlertCircle size={18} className="text-red mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          <div className="preview-section">
            <h3 className="text-md font-medium text-ink dark:text-ink mb-2">Preview</h3>
            <div className="preview-pages bg-paper/30 dark:bg-paper-dark/30 rounded-lg p-4">
              {pages.length > 0 ? (
                <div className="space-y-4">
                  {pages.map((page, index) => (
                    <div key={index} className="preview-page">
                      <div className="text-xs text-ink-light dark:text-ink-light mb-1">Page {index + 1}</div>
                      <div className="space-y-2">
                        {page.content.map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-sm text-ink dark:text-ink">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-light dark:text-ink-light italic">Your story preview will appear here...</p>
              )}
            </div>
          </div>
        </div>

        <div className="editor-footer p-4 border-t border-paper-dark/20 dark:border-paper/20 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-paper-dark dark:border-paper rounded-lg text-ink dark:text-ink hover:bg-paper/50 dark:hover:bg-paper-dark/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount === 0 || wordCount > MAX_WORD_COUNT}
            className="px-4 py-2 bg-highlight dark:bg-highlight text-white rounded-lg flex items-center gap-2 hover:bg-highlight/90 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? "Publishing..." : "Publish Story"}
          </button>
        </div>
      </div>
    </div>
  )
}
