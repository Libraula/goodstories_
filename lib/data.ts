import type { Story } from "./types"

export const stories: Story[] = [
  {
    title: "The Library of Lost Voices",
    author: {
      name: "Clara Bennett",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    pages: [
      {
        type: "text",
        content: [
          "In the town where I grew up, there was a library no one visited. The books there weren't silent—they whispered. Not metaphorically. Literally. Soft murmurs escaped their pages when you walked by.",
          'The librarian, Mr. Holloway, explained it to me when I was twelve. "Every book contains the voice of its reader," he said. "The more a book is loved, the stronger the voice becomes."',
          "He showed me how to listen. You had to hold the book close to your ear, like a seashell, and breathe slowly. The older the book, the more voices it contained, layered like tree rings.",
        ],
      },
      {
        type: "text",
        content: [
          'My favorite was a battered copy of "Alice\'s Adventures in Wonderland" from 1923. It held the voices of at least a dozen children, their laughter bubbling up between the lines. The clearest voice belonged to a girl named Eleanor who had read it in 1938. She always giggled at the same parts.',
          'When I turned sixteen, Mr. Holloway let me work at the library. My job was to "air out" the books—opening them carefully to let the voices mingle. Some combinations created beautiful harmonies. Others argued with each other across decades.',
          "The library had one rule: Never take books outside. The voices needed the special air of the library to survive. I once saw what happened to a book that left—the voices faded to whispers, then silence, within an hour.",
        ],
      },
      {
        type: "text",
        content: [
          "Today, I returned after twenty years. The town had changed, but the library stood exactly as I remembered. The door creaked the same way. The smell of old paper and wood polish hit me like a time machine.",
          "The books still whispered. The Alice book was in its usual place. When I opened it, Eleanor's laugh was fainter but still there. And then I heard it—my mother's voice, reading to me when I was six. I'd forgotten she had ever read to me.",
          'Mr. Holloway was gone, but a note in his handwriting lay on the desk: "The most beautiful voices aren\'t the loudest, but the ones that wait patiently to be heard again."',
        ],
      },
    ],
    tags: ["magical realism", "nostalgia", "short"],
    readTime: "5 min read",
    likeCount: 2400,
    commentCount: 512,
  },
  {
    title: "How We Remember",
    author: {
      name: "David Park",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    pages: [
      {
        type: "image",
        content: [
          "This visual essay explores how physical spaces shape our memories of what we read. The images show how bookstores, libraries, and reading nooks create cognitive anchors for the stories we consume.",
          "Research from the University of Toronto shows that readers remember 28% more content when they can associate it with a specific physical environment. The brain creates stronger neural connections when sensory details (smells, sounds, textures) are attached to information.",
        ],
        image:
          "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        imageAlt: "Essay on Memory",
      },
      {
        type: "image",
        content: [
          "The most memorable reading experiences often happen in distinctive environments. A 2019 study tracked readers who consumed the same material in different settings:",
          "- 72% could recall more details when reading in a unique space vs. their usual spot",
          "- 65% formed stronger emotional connections to material read in natural light",
          "- The smell of books (especially older ones) triggered memory recall in 58% of participants",
          "This explains why many people can remember exactly where they were when they read a particularly impactful book, even years later.",
        ],
        image:
          "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        imageAlt: "Reading Spaces",
      },
      {
        type: "text",
        content: [
          "Practical applications of this research:",
          "1. Create dedicated reading spaces with distinctive sensory elements (a particular chair, lighting, background sounds)",
          "2. When studying important material, vary your locations to create multiple memory anchors",
          "3. For children, establish consistent reading rituals that engage multiple senses",
          "4. Libraries and bookstores should prioritize creating memorable environmental experiences, not just storing books",
          "The places where we read become invisible co-authors of our memories, shaping how and what we remember.",
        ],
      },
    ],
    tags: ["essay", "psychology", "non-fiction"],
    readTime: "4 min read",
    likeCount: 4100,
    commentCount: 893,
  },
]

