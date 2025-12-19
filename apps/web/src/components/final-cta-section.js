import { ImageCarousel } from "./image-carousel"

export function FinalCTASection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">Ready to Join More Than 6,500 Students?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Register now and learn how to trade independently in just two months! Your opportunity to launch towards
            financial freedom starts here.
          </p>
          <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 mb-12">
            Register Now
          </button>
        </div>
        <ImageCarousel />
      </div>
    </section>
  )
}
