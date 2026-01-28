"use client"
import { ImageCarousel } from "./image-carousel"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import { useAuthStore } from "@/store/authStore"
export function FinalCTASection() {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated } = useAuthStore()
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">{t('finalCta.title')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('finalCta.description')}
          </p>
          {!isAuthenticated && (
            <button className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 mb-12"
              onClick={() => router.push("/signup")}>
              {t('common.registerNow')}
            </button>
          )}
        </div>
        <ImageCarousel />
      </div>
    </section>
  )
}
