"use client"

import React from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Extract Vimeo video ID and hash from a Vimeo URL
 * Supports formats:
 * - https://vimeo.com/1151528171/cef7b90e1d
 * - https://vimeo.com/1151528171
 * - https://player.vimeo.com/video/1151528171
 * - https://vimeo.com/1151528171/cef7b90e1d?query=params
 */
function parseVimeoUrl(url) {
  if (!url) return null
  
  try {
    // Handle full player URLs
    if (url.includes('player.vimeo.com/video/')) {
      const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/i)
      if (playerMatch) {
        const hashMatch = url.match(/[?&]h=([a-f0-9]+)/i)
        return {
          videoId: playerMatch[1],
          hash: hashMatch ? hashMatch[1] : null,
        }
      }
    }
    
    // Handle regular vimeo.com URLs
    // Pattern: vimeo.com/{videoId}/{hash}
    // Hash can contain alphanumeric characters (typically lowercase hex)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-fA-F0-9]+))?(?:\?|$)/i)
    if (vimeoMatch) {
      return {
        videoId: vimeoMatch[1],
        hash: vimeoMatch[2] || null,
      }
    }
  } catch (error) {
    console.error('Error parsing Vimeo URL:', error)
  }
  
  return null
}

/**
 * Check if URL is a Vimeo URL
 */
function isVimeoUrl(url) {
  return /vimeo\.com/i.test(url)
}

export function VideoPlayer({ videoUrl, thumbnailUrl, className }) {
  const [hasStarted, setHasStarted] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const videoRef = React.useRef(null)

  const vimeoData = React.useMemo(() => {
    if (!isVimeoUrl(videoUrl)) return null
    const parsed = parseVimeoUrl(videoUrl)
    if (parsed && process.env.NODE_ENV === 'development') {
      console.log('Vimeo URL parsed:', { originalUrl: videoUrl, parsed })
    }
    return parsed
  }, [videoUrl])

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setHasStarted(true)
      setIsPlaying(true)
    }
  }

  // Build Vimeo embed URL
  const getVimeoEmbedUrl = () => {
    if (!vimeoData) return null
    
    const params = new URLSearchParams({
      autoplay: hasStarted ? '1' : '0',
      controls: '1',
      responsive: '1',
      title: '0',
      byline: '0',
      portrait: '0',
      dnt: '1', // Do not track
    })
    
    // Hash parameter is critical for privacy-restricted videos
    // It must be included for videos with domain restrictions or unlisted videos
    // The hash should be the exact value from the original URL
    if (vimeoData.hash) {
      params.set('h', vimeoData.hash)
    }
    
    // Build the URL - hash must be part of the query string
    const baseUrl = `https://player.vimeo.com/video/${vimeoData.videoId}`
    const embedUrl = `${baseUrl}?${params.toString()}`
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Vimeo embed URL:', embedUrl)
    }
    
    return embedUrl
  }

  // Render Vimeo player
  if (vimeoData) {
    return (
      <div className={cn("relative justify-self-center bg-gray-900 rounded-2xl overflow-hidden shadow-2xl", className)}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
          <iframe
            src={getVimeoEmbedUrl()}
            className="absolute top-0 left-0 w-full h-full rounded-2xl"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo video player"
          />
        </div>
      </div>
    )
  }

  // Render standard HTML5 video player for non-Vimeo URLs
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
