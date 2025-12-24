"use client"

import React from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

export function VideoPlayer({ videoUrl, thumbnailUrl, className }) {
  const [hasStarted, setHasStarted] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const videoRef = React.useRef(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setHasStarted(true)
      setIsPlaying(true)
    }
  }

  return (
    <div className={cn("relative justify-self-center bg-gray-900 rounded-2xl overflow-hidden shadow-2xl", className)}>
      <video
        ref={videoRef}
        preload="none"
        className="w-full h-full object-contain"
        playsInline={true}
        poster={thumbnailUrl || "/video-thumbnail.png"}
        controls={hasStarted}
        onPlay={() => {
          setHasStarted(true)
          setIsPlaying(true)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        src={videoUrl}  
      />
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}
