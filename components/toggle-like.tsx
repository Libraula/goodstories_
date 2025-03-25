"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToggleLikeProps {
  initialCount: number
  className?: string
}

export default function ToggleLike({ initialCount, className }: ToggleLikeProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [count, setCount] = useState(initialCount)

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K"
    }
    return count.toString()
  }

  return (
    <div className={cn("flex flex-col items-center cursor-pointer", className)} onClick={toggleLike}>
      <div
        className={cn(
          "w-[50px] h-[50px] rounded-full bg-white/90 flex justify-center items-center text-xl mb-1 transition-all duration-300 shadow-md",
          isLiked ? "text-red" : "text-ink",
        )}
      >
        <Heart className={isLiked ? "fill-current" : ""} />
      </div>
      <span className="text-sm text-ink-light font-medium">{formatCount(count)}</span>
    </div>
  )
}

