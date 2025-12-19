"use client"

import React from "react"
import { Play } from "lucide-react"


export function VideoPlayer({ videoUrl, thumbnailUrl }) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const videoRef = React.useRef(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="relative lg:w-1/2 w-2/3 justify-self-center h-auto bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={thumbnailUrl || "/video-thumbnail.png"}
        controls={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        {videoUrl && <source src={videoUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
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
