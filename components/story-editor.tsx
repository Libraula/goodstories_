"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { createStory, calculateReadTime } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"
import {
  X,
  Save,
  Tag,
  AlertCircle,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  HelpCircle,
  ArrowLeft,
} from "lucide-react"
import type { StoryPage } from "@/lib/database.types"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { useToast } from "@/hooks/use-toast"

const MAX_WORD_COUNT = 700
const WORDS_PER_PAGE = 150

// Helper function to convert TipTap HTML to plain text paragraphs
const htmlToPlainTextParagraphs = (html: string): string[] => {
  // Create a temporary DOM element
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = html

  // Extract paragraphs
  const paragraphs: string[] = []

  // Process each child node
  tempDiv.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement

      // Handle headings and paragraphs
      if (["H1", "H2", "H3", "P"].includes(element.tagName)) {
        const text = element.textContent?.trim()
        if (text) paragraphs.push(text)
      }
      // Handle lists
      else if (["UL", "OL"].includes(element.tagName)) {
        element.querySelectorAll("li").forEach((li) => {
          const text = li.textContent?.trim()
          if (text) paragraphs.push(text)
        })
      }
      // Handle blockquotes
      else if (element.tagName === "BLOCKQUOTE") {
        const text = element.textContent?.trim()
        if (text) paragraphs.push(`"${text}"`)
      }
    }
  })

  return paragraphs
}

// Menu bar component for the editor
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="editor-menu flex flex-wrap gap-1 p-1 border-b border-paper-dark/20 dark:border-paper/20 bg-paper-light dark:bg-paper-dark/50 rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("bold") ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("italic") ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("heading", { level: 1 }) ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("heading", { level: 2 }) ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <div className="h-6 mx-1 border-r border-paper-dark/20 dark:border-paper/20"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("bulletList") ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("orderedList") ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 ${editor.isActive("blockquote") ? "bg-paper-dark/30 dark:bg-paper/30 text-highlight" : "text-ink-light dark:text-ink-light"}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <div className="h-6 mx-1 border-r border-paper-dark/20 dark:border-paper/20"></div>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 text-ink-light dark:text-ink-light"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 text-ink-light dark:text-ink-light"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
      <div className="h-6 mx-1 border-r border-paper-dark/20 dark:border-paper/20"></div>
      <button
        onClick={() => alert("AI assistance coming soon!")}
        className="p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 text-highlight dark:text-highlight"
        title="AI Assistance"
      >
        <Sparkles className="w-4 h-4" />
      </button>
      <button
        onClick={() => alert("Writing tips: Use short paragraphs, vary sentence length, and show don't tell!")}
        className="p-2 rounded hover:bg-paper-dark/20 dark:hover:bg-paper/20 text-ink-light dark:text-ink-light"
        title="Writing Tips"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

// AI Suggestion component
const AISuggestion = ({ onAccept, onDismiss }: { onAccept: () => void; onDismiss: () => void }) => {
  return (
    <div className="ai-suggestion bg-highlight/10 border border-highlight/20 rounded-lg p-3 my-4 relative">
      <div className="flex items-start gap-2">
        <Sparkles className="w-5 h-5 text-highlight flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-ink dark:text-ink mb-2">
            <span className="font-medium">AI Suggestion:</span> Consider adding more sensory details to make your scene
            more vivid. What does the character see, hear, or smell?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="text-xs px-3 py-1 bg-highlight text-white rounded-full hover:bg-highlight/90 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={onDismiss}
              className="text-xs px-3 py-1 bg-paper-dark dark:bg-paper text-ink dark:text-ink rounded-full hover:bg-paper-dark/80 dark:hover:bg-paper/80 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StoryEditor({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [pages, setPages] = useState<StoryPage[]>([])
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const { toast } = useToast()

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your story here... (max 700 words)",
      }),
      CharacterCount.configure({
        limit: MAX_WORD_COUNT * 6, // Approximate character limit
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(Boolean)
      setWordCount(words.length)

      // Show AI suggestion randomly after typing a bit
      if (words.length > 50 && !showAISuggestion && Math.random() > 0.7) {
        setShowAISuggestion(true)
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert focus:outline-none max-w-none p-4 min-h-[300px]",
      },
    },
  })

  // Focus editor on mount
  useEffect(() => {
    if (editor) {
      setTimeout(() => {
        editor.commands.focus()
      }, 100)
    }
  }, [editor])

  // Calculate pages from editor content
  useEffect(() => {
    if (!editor) return

    const html = editor.getHTML()
    const paragraphs = htmlToPlainTextParagraphs(html)

    // Skip if no content
    if (paragraphs.length === 0) {
      setPages([])
      return
    }

    // Split content into pages (approximately WORDS_PER_PAGE words per page)
    const contentPages: StoryPage[] = []
    let currentPageContent: string[] = []
    let currentPageWordCount = 0

    paragraphs.forEach((paragraph) => {
      const paragraphWordCount = paragraph.split(/\s+/).filter(Boolean).length

      // If adding this paragraph would exceed the page limit, create a new page
      if (currentPageWordCount + paragraphWordCount > WORDS_PER_PAGE && currentPageContent.length > 0) {
        contentPages.push({
          type: "text",
          content: [...currentPageContent],
        })
        currentPageContent = []
        currentPageWordCount = 0
      }

      // Add paragraph to current page
      currentPageContent.push(paragraph)
      currentPageWordCount += paragraphWordCount
    })

    // Add the last page if it has content
    if (currentPageContent.length > 0) {
      contentPages.push({
        type: "text",
        content: currentPageContent,
      })
    }

    setPages(contentPages)
  }, [editor, wordCount])

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

    if (!editor || wordCount === 0) {
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
        title: title,
        author_id: user.id,
        pages: pages,
        tags: tags.length > 0 ? tags : ["story"],
        read_time: readTime,
        like_count: 0,
        comment_count: 0,
        bookmark_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Creating story with data:", newStory)
      const result = await createStory(newStory)

      if (result) {
        console.log("Story created successfully:", result)
        toast({
          title: "Success!",
          description: "Your story has been published.",
          variant: "default",
        })
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
    <div className="w-full h-full flex flex-col bg-paper dark:bg-paper-dark overflow-hidden">
      {/* Editor Header */}
      <div className="editor-header p-4 flex justify-between items-center border-b border-paper-dark/20 dark:border-paper/20 bg-white dark:bg-paper-dark">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-paper-dark/10 dark:hover:bg-paper/10 text-ink-light dark:text-ink-light"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-highlight dark:text-highlight">Create a Story</h2>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || wordCount === 0 || wordCount > MAX_WORD_COUNT}
          className="px-4 py-2 bg-highlight dark:bg-highlight text-white rounded-lg flex items-center gap-2 hover:bg-highlight/90 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSubmitting ? "Publishing..." : "Publish Story"}
        </button>
      </div>

      {/* Editor Body - Scrollable */}
      <div className="editor-body flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title Input */}
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

          {/* TipTap Editor */}
          <div className="mb-6 relative">
            <div className="editor-container border border-paper-dark/20 dark:border-paper/20 rounded-lg overflow-hidden bg-paper/30 dark:bg-paper-dark/30">
              <MenuBar editor={editor} />
              <EditorContent editor={editor} className="prose-sm" />

              {/* Word count */}
              <div
                className={`word-count p-2 text-right text-sm border-t border-paper-dark/20 dark:border-paper/20 ${wordCount > MAX_WORD_COUNT ? "text-red dark:text-red" : "text-ink-light dark:text-ink-light"}`}
              >
                {wordCount}/{MAX_WORD_COUNT} words
              </div>
            </div>

            {/* AI Suggestion */}
            {showAISuggestion && (
              <AISuggestion
                onAccept={() => {
                  toast({
                    title: "AI Suggestion Applied",
                    description: "The suggestion has been incorporated into your story.",
                    variant: "default",
                  })
                  setShowAISuggestion(false)
                }}
                onDismiss={() => setShowAISuggestion(false)}
              />
            )}
          </div>

          {/* Tags Section */}
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

          {/* Error Message */}
          {error && (
            <div className="error-message mb-4 p-3 bg-red/10 border border-red/20 rounded-lg flex items-start">
              <AlertCircle size={18} className="text-red mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          {/* Preview Section */}
          <div className="preview-section mb-6">
            <h3 className="text-md font-medium text-ink dark:text-ink mb-2">Preview</h3>
            <div className="preview-pages bg-paper/30 dark:bg-paper-dark/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {pages.length > 0 ? (
                <div className="space-y-4">
                  {pages.map((page, index) => (
                    <div key={index} className="preview-page">
                      <div className="text-xs text-ink-light dark:text-ink-light mb-1">Page {index + 1}</div>
                      <div className="space-y-2">
                        {page.content.map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-sm text-ink dark:text-ink">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-light dark:text-ink-light italic">
                  Your story preview will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

