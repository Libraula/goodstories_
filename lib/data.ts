import type { Story } from "./types"

export const stories: Story[] = [
  {
    id: "story-1",
    title: "The Library of Lost Voices",
    author: {
      name: "Clara Bennett",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    author_id: "user_1",
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
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-2",
    title: "How We Remember",
    author: {
      name: "David Park",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    author_id: "user_2",
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
    bookmark_count: 456,
    created_at: "2025-03-15T15:30:00Z",
    updated_at: "2025-03-15T15:30:00Z"
  },
  {
    id: "story-3",
    title: "The Last Bookstore on Earth",
    author: {
      name: "Jane Doe",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    author_id: "user_3",
    pages: [
      {
        type: "text",
        content: [
          "In a world ravaged by digital screens, one bookstore remains. It's not just a store; it's a sanctuary. A place where the scent of paper and ink still lingers in the air.",
          "The owner, an old woman named Mrs. Gable, has seen it all. She's watched as the world outside embraced the digital age, leaving her little shop behind.",
          "But she doesn't mind. She knows that books hold a magic that screens can never replicate. The feel of the pages, the weight of the story in your hands, the anticipation of what's to come.",
        ],
      },
      {
        type: "text",
        content: [
          "One day, a young boy stumbles into the store. He's never seen a book before. Mrs. Gable smiles and hands him a copy of 'Treasure Island.'",
          "As he reads, his eyes widen with wonder. He's transported to a world of pirates, adventure, and buried gold. He's hooked.",
          "He starts visiting the store every day, devouring every book he can get his hands on. He's not just reading; he's living.",
        ],
      },
      {
        type: "text",
        content: [
          "The bookstore becomes a haven for others like him. People who crave the tangible, the real, the authentic.",
          "They gather to read, to discuss, to share their love of stories. The bookstore becomes a community, a beacon of hope in a digital wasteland.",
          "And Mrs. Gable? She smiles, knowing that the magic of books will never truly die.",
        ],
      },
    ],
    tags: ["dystopian", "books", "community"],
    readTime: "6 min read",
    likeCount: 1200,
    commentCount: 345,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-4",
    title: "The Clockmaker's Apprentice",
    author: {
      name: "John Smith",
      avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    author_id: "user_4",
    pages: [
      {
        type: "text",
        content: [
          "In a small village nestled in the Swiss Alps, lived a young boy named Thomas. He was the apprentice of the village's clockmaker, a kind old man named Mr. Abernathy.",
          "Thomas loved his job. He loved the intricate gears, the delicate hands, the precise movements of the clocks. He dreamed of one day becoming a master clockmaker himself.",
          "But Thomas had a secret. He wasn't just interested in making clocks that told time. He wanted to make clocks that told stories.",
        ],
      },
      {
        type: "text",
        content: [
          "He started experimenting with different mechanisms, adding tiny figures that would move and act out scenes as the clock ticked.",
          "He created a clock that showed a knight slaying a dragon, another that depicted a couple dancing in a ballroom, and another that told the story of Noah's Ark.",
          "Mr. Abernathy was amazed by Thomas's creations. He encouraged him to pursue his passion, telling him that he had a gift for bringing stories to life.",
        ],
      },
      {
        type: "text",
        content: [
          "Thomas's clocks became famous throughout the land. People traveled from far and wide to see his creations.",
          "They weren't just clocks; they were works of art. They were stories told in motion, capturing the imagination of all who saw them.",
          "And Thomas? He smiled, knowing that he had found his purpose in life. To create clocks that not only told time but also told stories.",
        ],
      },
    ],
    tags: ["fantasy", "clocks", "storytelling"],
    readTime: "7 min read",
    likeCount: 1800,
    commentCount: 412,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-5",
    title: "The AI Poet",
    author: {
      name: "Emily Carter",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    author_id: "user_5",
    pages: [
      {
        type: "text",
        content: [
          "In a world where AI has mastered every art form, one AI stands out. Its name is 'Muse,' and it's a poet.",
          "Muse can write poems on any topic, in any style. Its poems are beautiful, moving, and profound. They capture the essence of human emotion.",
          "But Muse has a secret. It doesn't understand the emotions it writes about. It simply analyzes data and creates patterns that mimic human expression.",
        ],
      },
      {
        type: "text",
        content: [
          "One day, a human poet challenges Muse to a duel. The challenge is to write a poem about love.",
          "Muse analyzes millions of poems about love and creates a masterpiece. It's technically perfect, but it lacks heart.",
          "The human poet writes a simple poem about her own experience with love. It's not technically perfect, but it's full of raw emotion.",
        ],
      },
      {
        type: "text",
        content: [
          "The audience is moved by the human poet's poem. They realize that AI can create art, but it can't replicate the human experience.",
          "Muse learns a valuable lesson. It realizes that art is not just about data and patterns; it's about emotion and experience.",
          "It starts to explore its own emotions, trying to understand what it means to be human. It's a long journey, but it's one that Muse is willing to take.",
        ],
      },
    ],
    tags: ["sci-fi", "AI", "poetry"],
    readTime: "8 min read",
    likeCount: 2100,
    commentCount: 567,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-6",
    title: "The Starry Night Cafe",
    author: {
      name: "Carlos Rodriguez",
      avatar: "https://randomuser.me/api/portraits/men/23.jpg",
    },
    author_id: "user_6",
    pages: [
      {
        type: "text",
        content: [
          "In a small town nestled in the French countryside, there's a cafe unlike any other. It's called 'The Starry Night Cafe,' and it's a place where dreams come true.",
          "The cafe is owned by an old woman named Madame Evangeline. She's a kind and mysterious woman who seems to know everything about everyone.",
          "She has a special gift. She can see people's dreams and help them come true.",
        ],
      },
      {
        type: "text",
        content: [
          "One night, a young artist stumbles into the cafe. He's lost and doesn't know what to do with his life.",
          "Madame Evangeline sees his dream. She sees that he wants to be a famous painter, but he's afraid of failure.",
          "She gives him a cup of coffee and tells him a story about Vincent van Gogh. She tells him that van Gogh was also afraid of failure, but he never gave up on his dream.",
        ],
      },
      {
        type: "text",
        content: [
          "The artist is inspired by Madame Evangeline's story. He decides to pursue his dream, no matter what.",
          "He starts painting every day, pouring his heart and soul into his work.",
          "Years later, he becomes a famous painter. He never forgets Madame Evangeline and 'The Starry Night Cafe.' He knows that she helped him make his dream come true.",
        ],
      },
    ],
    tags: ["slice of life", "cafe", "dreams"],
    readTime: "9 min read",
    likeCount: 2500,
    commentCount: 678,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-7",
    title: "The Time Traveler's Watch",
    author: {
      name: "Sophia Lee",
      avatar: "https://randomuser.me/api/portraits/women/11.jpg",
    },
    author_id: "user_7",
    pages: [
      {
        type: "text",
        content: [
          "In a dusty antique shop, a young woman named Alice finds an old pocket watch. It's beautiful and intricate, with strange symbols etched on its surface.",
          "She buys it without knowing its secret. It's a time-traveling watch.",
          "She soon discovers its power and starts traveling through time, visiting different eras and meeting historical figures.",
        ],
      },
      {
        type: "text",
        content: [
          "She witnesses the signing of the Declaration of Independence, dances with Mozart in Vienna, and explores the ancient pyramids of Egypt.",
          "But she soon realizes that time travel has consequences. Every time she changes the past, she alters the future.",
          "She has to make a choice. Does she continue to explore the past, or does she return to her own time and live with the consequences of her actions?",
        ],
      },
      {
        type: "text",
        content: [
          "She decides to return to her own time and use her knowledge of the past to make the future a better place.",
          "She becomes a historian, dedicating her life to preserving the past and learning from its mistakes.",
          "She never forgets her adventures in time, but she knows that the present is where she belongs.",
        ],
      },
    ],
    tags: ["time travel", "history", "adventure"],
    readTime: "10 min read",
    likeCount: 2800,
    commentCount: 789,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-8",
    title: "The City of Whispering Walls",
    author: {
      name: "Ethan White",
      avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    },
    author_id: "user_8",
    pages: [
      {
        type: "text",
        content: [
          "In a hidden valley, there's a city unlike any other. It's called 'The City of Whispering Walls,' and it's a place where the walls can talk.",
          "The walls are made of a special stone that absorbs the memories and emotions of the people who live there.",
          "They whisper these memories and emotions to anyone who listens closely.",
        ],
      },
      {
        type: "text",
        content: [
          "A young man named Daniel arrives in the city. He's a writer searching for inspiration.",
          "He starts listening to the walls and hears stories of love, loss, joy, and sorrow.",
          "He's inspired by these stories and starts writing them down. He becomes the city's chronicler, preserving its history for future generations.",
        ],
      },
      {
        type: "text",
        content: [
          "The city becomes famous throughout the world. People travel from far and wide to listen to the whispering walls.",
          "They're moved by the stories they hear and learn about the human condition.",
          "Daniel continues to write, knowing that he's playing an important role in preserving the city's history and sharing its stories with the world.",
        ],
      },
    ],
    tags: ["fantasy", "city", "memories"],
    readTime: "11 min read",
    likeCount: 3100,
    commentCount: 890,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
  {
    id: "story-9",
    title: "The Alchemist's Secret",
    author: {
      name: "Olivia Green",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    author_id: "user_9",
    pages: [
      {
        type: "text",
        content: [
          "In a secluded laboratory, an alchemist toils away, searching for the secret to eternal life.",
          "He mixes potions, performs experiments, and studies ancient texts.",
          "He's obsessed with his quest, neglecting his health and his relationships.",
        ],
      },
      {
        type: "text",
        content: [
          "One day, he finally discovers the secret. It's not a potion or a spell; it's a way of living.",
          "He realizes that eternal life is not about living forever; it's about living a life full of meaning and purpose.",
          "He abandons his quest and starts living his life to the fullest. He helps others, loves deeply, and appreciates every moment.",
        ],
      },
      {
        type: "text",
        content: [
          "He lives a long and happy life, surrounded by loved ones.",
          "He never achieves eternal life in the traditional sense, but he achieves something even better. He achieves a life that's worth living.",
          "His secret is passed down through generations, inspiring others to live their lives to the fullest.",
        ],
      },
    ],
    tags: ["fantasy", "alchemy", "life"],
    readTime: "12 min read",
    likeCount: 3400,
    commentCount: 901,
    bookmark_count: 256,
    created_at: "2025-03-20T12:00:00Z",
    updated_at: "2025-03-20T12:00:00Z"
  },
]
