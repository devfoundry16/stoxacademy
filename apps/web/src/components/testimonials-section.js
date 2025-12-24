"use client"
import { VideoPlayer } from "./video-player"

const testimonials = [
  {
    name: "Hana Khoury",
    quote: "I'll go home and start buying stocks",
    videoUrl: "https://video.wixstatic.com/video/fabad3_9e8b4b84f09249c1a684dad62a529e1b/720p/mp4/file.mp4",
    thumbnailUrl: "/images/graduate_thumb_1.avif",
  },
  {
    name: "Saleh Shaheen",
    quote: "I felt the course covered all topics",
    videoUrl: "https://video.wixstatic.com/video/fabad3_39cbe7936a0e415bb24b217a02d41b7e/720p/mp4/file.mp4",
    thumbnailUrl: "https://video.wixstatic.com/video/fabad3_39cbe7936a0e415bb24b217a02d41b7e/720p/mp4/file.mp4",
    thumbnailUrl: "/images/graduate_thumb_2.avif",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">Graduate Reviews</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="space-y-4">
              <VideoPlayer videoUrl={testimonial.videoUrl} thumbnailUrl={testimonial.thumbnailUrl} className="lg:w-1/2 w-2/3 h-auto"/>
              <div className="p-6 bg-blue-50 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-lg">&quot;{testimonial.quote}&quot;</p>
                <p className="text-gray-900 font-semibold">{testimonial.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
