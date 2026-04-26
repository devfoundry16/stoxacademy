"use client"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations"
import { useAuthStore } from "@/store/authStore"

const section1Colors = [
  { bgGradient: "from-blue-50 to-purple-50", badgeColor: "bg-blue-600", buttonColor: "bg-blue-600 hover:bg-blue-700", accentColor: "text-blue-600" },
  { bgGradient: "from-yellow-50 to-orange-50", badgeColor: "bg-yellow-500", buttonColor: "bg-yellow-500 hover:bg-yellow-600", accentColor: "text-yellow-600" },
  { bgGradient: "from-purple-50 to-pink-50", badgeColor: "bg-purple-600", buttonColor: "bg-purple-600 hover:bg-purple-700", accentColor: "text-purple-600" },
]

const section2Colors = [
  { bgGradient: "from-teal-50 to-cyan-50", badgeColor: "bg-teal-600", buttonColor: "bg-teal-600 hover:bg-teal-700", accentColor: "text-teal-600" },
  { bgGradient: "from-indigo-50 to-blue-50", badgeColor: "bg-indigo-600", buttonColor: "bg-indigo-600 hover:bg-indigo-700", accentColor: "text-indigo-600" },
]

export function CoursesSection() {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated } = useAuthStore()

  const section1 = t.raw('courses.section1')
  const section2 = t.raw('courses.section2')

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Main section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={defaultTransition}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('courses.title')}
          </h2>
          <p className="text-xl text-gray-600">{t('courses.subtitle')}</p>
        </motion.div>

        {/* ── Section 1: The 90 Circle ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.1 }}
          className="mb-20"
        >
          {/* Section 1 header */}
          <div className="bg-linear-to-r from-gray-900 to-gray-700 rounded-3xl p-8 sm:p-10 mb-10 text-white">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-block px-4 py-1.5 bg-yellow-400 text-gray-900 text-sm font-bold rounded-full">
                {section1.sectionLabel}
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-3">{section1.title}</h3>
            <p className="text-yellow-300 font-semibold text-lg mb-4">{section1.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 text-gray-300 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-green-400 font-bold">✔</span>
                {section1.goal}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-gray-300 text-sm">
              <span className="text-green-400 font-bold">✔</span>
              {section1.includes}
            </div>
          </div>

          {/* Section 1 course cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid lg:grid-cols-3 gap-8"
          >
            {section1.courses.map((course, idx) => {
              const colors = section1Colors[idx] || section1Colors[0]
              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  whileHover={{ y: -6 }}
                  className={`bg-linear-to-br ${colors.bgGradient} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col`}
                >
                  <div className="mb-6">
                    <span className={`inline-block px-4 py-1.5 ${colors.badgeColor} text-white text-xs font-bold rounded-full mb-4`}>
                      {section1.title}
                    </span>
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h4>
                    <p className={`text-sm font-semibold ${colors.accentColor} mb-4`}>{course.trainer}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {course.modules.map((module, moduleIdx) => (
                      <li key={moduleIdx} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5 shrink-0">✔</span>
                        <span className="text-gray-700 text-sm">{module}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-200 pt-6 mt-auto">
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-gray-900">${section1.price}</span>
                    </div>
                    {!isAuthenticated && (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        className={`w-full px-6 py-3.5 ${colors.buttonColor} text-white font-semibold rounded-xl transition-colors`}
                        onClick={() => router.push('/signup')}
                      >
                        {t('common.registerNow')}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* ── Section 2: One-on-One Sessions ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.2 }}
        >
          {/* Section 2 header */}
          <div className="bg-linear-to-r from-teal-700 to-cyan-600 rounded-3xl p-8 sm:p-10 mb-10 text-white">
            <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-bold rounded-full mb-4">
              {section2.sectionLabel}
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold mb-2">{section2.title}</h3>
            <p className="text-teal-100 text-sm">{section2.duration}</p>
          </div>

          {/* Section 2 session cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid md:grid-cols-2 gap-8"
          >
            {section2.sessions.map((session, idx) => {
              const colors = section2Colors[idx] || section2Colors[0]
              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  whileHover={{ y: -6 }}
                  className={`bg-linear-to-br ${colors.bgGradient} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col`}
                >
                  <div className="mb-6">
                    <span className={`inline-block px-4 py-1.5 ${colors.badgeColor} text-white text-xs font-bold rounded-full mb-4`}>
                      {section2.sectionLabel}
                    </span>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{session.title}</h4>
                    <p className={`text-sm font-semibold ${colors.accentColor}`}>{session.description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {session.modules.map((module, moduleIdx) => (
                      <li key={moduleIdx} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5 shrink-0">✔</span>
                        <span className="text-gray-700 text-sm">{module}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-200 pt-6 mt-auto">
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">${section2.price3}</span>
                        <span className="text-gray-500 text-sm">/3 sessions</span>
                      </div>
                      <div className="w-px bg-gray-300 self-stretch" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">${section2.price6}</span>
                        <span className="text-gray-500 text-sm">/6 sessions</span>
                      </div>
                    </div>
                    {!isAuthenticated && (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        className={`w-full px-6 py-3.5 ${colors.buttonColor} text-white font-semibold rounded-xl transition-colors`}
                        onClick={() => router.push('/signup')}
                      >
                        {t('common.registerNow')}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
