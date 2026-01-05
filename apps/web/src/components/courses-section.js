"use client"
import { useRouter } from "next/navigation"
const courses = [
  {
    badge: "In-Person",
    badgeColor: "bg-yellow-400",
    title: "Comprehensive Course in Stock and Crypto Investment and Trading",
    description: "Haifa | 7 Sessions | 19 Hours | 17:00-20:00",
    bgGradient: "from-blue-50 to-purple-50",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    features: [
      "Comprehensive understanding of stock and crypto market basics",
      "Trading strategies based on real experiences",
      "Company data analysis and chart reading",
      "Using technical indicators to identify opportunities",
      "Smart and wise risk management",
      "Opening a real trading account and practicing real trades",
    ],
  },
  {
    badge: "Online",
    badgeColor: "bg-purple-400 text-white",
    title: "Crypto Investment and Trading Course - Online",
    description: "Fully online - Complete flexibility, tangible results",
    bgGradient: "from-purple-50 to-pink-50",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    features: [
      "Comprehensive understanding of crypto market basics",
      "Proven trading strategies",
      "Professional data and chart analysis",
      "Using technical indicators to discover opportunities",
      "Risk management and financial balance",
      "Opening a real trading account and live trading experience",
    ],
  },
  {
    badge: "Online",
    badgeColor: "bg-green-400 text-white",
    title: "Stock Market and Technical Analysis Course - Online",
    description: "Get a free mini crypto course upon registration!",
    bgGradient: "from-green-50 to-blue-50",
    buttonColor: "bg-green-600 hover:bg-green-700",
    features: [
      "Stock market basics",
      "Successful trading strategies",
      "Company and chart analysis",
      "Using technical indicators",
      "Smart risk management",
      "Additional lesson on financial skills",
    ],
  },
]

export function CoursesSection() {
  const router = useRouter()
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose the Right Course and Start Your Journey to Become an Independent Trader
          </h2>
          <p className="text-xl text-gray-600">In our course, you don&apos;t just learn – you trade</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {courses.map((course, idx) => (
            <div
              key={idx}
              className={`bg-linear-to-br ${course.bgGradient} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 ${course.badgeColor} text-sm font-semibold rounded-full mb-4`}>
                  {course.badge}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {course.features.map((item, featureIdx) => (
                  <li key={featureIdx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✔</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full px-6 py-4 ${course.buttonColor} text-white font-semibold rounded-xl transition-colors`}
                onClick={() => router.push('/signup')}
              >
                Register Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
