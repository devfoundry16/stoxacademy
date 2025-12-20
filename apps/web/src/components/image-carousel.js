"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from 'next/image';

const images = [
  { url: "/images/carousel_1.avif", alt: "Students learning trading" },
  { url: "/images/carousel_2.avif", alt: "Trading classroom" },
  { url: "/images/carousel_3.avif", alt: "Professional trader" },
  { url: "/images/carousel_4.avif", alt: "Trading charts" },
  { url: "/images/carousel_5.avif", alt: "Traders discussing" },
  { url: "/images/carousel_6.avif", alt: "Traders discussing" },
  { url: "/images/carousel_7.avif", alt: "Traders discussing" },
  { url: "/images/carousel_8.avif", alt: "Traders discussing" },
]

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
        <Image
          src={images[currentIndex].url || "/placeholder.svg"}
          alt={images[currentIndex].alt}
          width={1000}
          height={1000}
          className="w-full h-full object-cover"
        />
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-6 h-6 text-gray-900" />
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentIndex ? "bg-blue-600 w-8" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
