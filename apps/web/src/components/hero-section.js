import { VideoPlayer } from "./video-player"

export function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-yellow-400 text-sm font-semibold rounded-full">
              Register for the Stock Course and Get the Crypto Course for Free!
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Take Control of Your Financial Future in Just Two Months!
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Learn how to become an independent trader and investor in the stock market, with all the tools and skills
              you need to succeed.
            </p>
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105">
              Register Now and Learn to Trade Independently
            </button>
          </div>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-2xl">
              <VideoPlayer className="w-[283px] h-[467px]" videoUrl="https://video.wixstatic.com/video/fabad3_833a8bb8b0c54caba161c3f2e9ab517b/720p/mp4/file.mp4" thumbnailUrl="/images/hero_thumbnail.avif"/>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
