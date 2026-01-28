"use client"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations"

export function CoursesSection() {
  const router = useRouter()
  const t = useTranslations()
  const courses = [
    {
      badge: t('courses.inPerson'),
      badgeColor: "bg-yellow-400",
      title: t('courses.course1.title'),
      description: t('courses.course1.description'),
      bgGradient: "from-blue-50 to-purple-50",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      features: t.raw('courses.course1.features'),
    },
    {
      badge: t('courses.online'),
      badgeColor: "bg-purple-400 text-white",
      title: t('courses.course2.title'),
      description: t('courses.course2.description'),
      bgGradient: "from-purple-50 to-pink-50",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      features: t.raw('courses.course2.features'),
    },
    {
      badge: t('courses.online'),
      badgeColor: "bg-green-400 text-white",
      title: t('courses.course3.title'),
      description: t('courses.course3.description'),
      bgGradient: "from-green-50 to-blue-50",
      buttonColor: "bg-green-600 hover:bg-green-700",
      features: t.raw('courses.course3.features'),
    },
  ]
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={defaultTransition}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('courses.title')}
          </h2>
          <p className="text-xl text-gray-600">{t('courses.subtitle')}</p>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-3 gap-8"
        >
          {courses.map((course, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileHover={{ y: -8 }}
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
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`w-full px-6 py-4 ${course.buttonColor} text-white font-semibold rounded-xl transition-colors`}
                onClick={() => router.push('/signup')}
              >
                {t('common.registerNow')}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
