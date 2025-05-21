"use client"

import Image from "next/image"

interface GenreCard {
  image: string
  title: string
  count: string
}

const genres: GenreCard[] = [
  {
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Historical Fiction",
    count: "125 stories",
  },
  {
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Sci-Fi Shorts",
    count: "89 stories",
  },
  {
    image:
      "https://images.unsplash.com/photo-1510172951991-856a62a9e395?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Modern Poetry",
    count: "64 collections",
  },
  {
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Thought Essays",
    count: "42 essays",
  },
  {
    image:
      "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Micro Horror",
    count: "57 stories",
  },
  {
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    title: "Quick Romance",
    count: "93 stories",
  },
]

export default function DiscoverTab() {
  return (
    <div className="discover-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 h-full overflow-y-auto">
      {genres.map((genre, index) => (
        <div
          key={index}
          className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper"
        >
          <Image
            src={genre.image || "/placeholder.svg"}
            alt={genre.title}
            width={400}
            height={225}
            className="discover-image w-full h-[120px] object-cover"
          />
          <div className="discover-info p-3">
            <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">
              {genre.title}
            </h3>
            <p className="discover-author text-sm text-ink-light dark:text-ink-light">{genre.count}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
