"use client"
import { VideoPlayer } from "./video-player"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations"
import { useAuthStore } from "@/store/authStore"
export function HeroSection() {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated } = useAuthStore()
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={staggerItem} className="space-y-6">
            <motion.div
              variants={fadeInUp}
              className="inline-block px-4 py-2 bg-yellow-400 text-sm font-semibold rounded-full"
            >
              {t('hero.badge')}
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              {t('hero.title')}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 leading-relaxed"
            >
              {t('hero.description')}
            </motion.p>
            {!isAuthenticated && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all"
                onClick={() => router.push("/signup")}
              >
                {t('hero.cta')}
              </motion.button>
            )}
          </motion.div>
          <motion.div
            variants={fadeInUp}
            className="w-full flex justify-center"
          >
            <div className="w-full max-w-2xl">
              <VideoPlayer videoUrl="https://video.wixstatic.com/video/fabad3_833a8bb8b0c54caba161c3f2e9ab517b/720p/mp4/file.mp4" thumbnailUrl="/images/hero_thumbnail.png" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
