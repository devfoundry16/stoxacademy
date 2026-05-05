"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from 'next-intl'
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations"
import { useAuthStore } from "@/store/authStore"
import { paymentService } from "@/lib/paymentService"
import StripeCheckoutModal from "@/components/StripeCheckoutModal"
import toast from "react-hot-toast"
import { CheckCircle, Clock } from "lucide-react"

const section1Colors = [
  { bgGradient: "from-blue-50 to-purple-50", badgeColor: "bg-blue-600", buttonColor: "bg-blue-600 hover:bg-blue-700", accentColor: "text-blue-600" },
  { bgGradient: "from-yellow-50 to-orange-50", badgeColor: "bg-yellow-500", buttonColor: "bg-yellow-500 hover:bg-yellow-600", accentColor: "text-yellow-600" },
  { bgGradient: "from-purple-50 to-pink-50", badgeColor: "bg-purple-600", buttonColor: "bg-purple-600 hover:bg-purple-700", accentColor: "text-purple-600" },
]

const section2Colors = [
  { bgGradient: "from-teal-50 to-cyan-50", badgeColor: "bg-teal-600", buttonColor: "bg-teal-600 hover:bg-teal-700", accentColor: "text-teal-600" },
  { bgGradient: "from-indigo-50 to-blue-50", badgeColor: "bg-indigo-600", buttonColor: "bg-indigo-600 hover:bg-indigo-700", accentColor: "text-indigo-600" },
]

// Map course card index to program_type used in backend
const PROGRAM_TYPES = ["stock_market", "gold_forex", "crypto"]

// Map session index to category key used in backend
const SESSION_CATEGORIES = ["gold_forex", "crypto"]

export function CoursesSection() {
  const router = useRouter()
  const t = useTranslations()
  const { isAuthenticated } = useAuthStore()

  const section1 = t.raw('courses.section1')
  const section2 = t.raw('courses.section2')

  // Subscription + package state
  const [subscriptions, setSubscriptions] = useState([])
  const [sessionPackages, setSessionPackages] = useState([])
  const [statusLoading, setStatusLoading] = useState(false)

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    clientSecret: null,
    amount: null,
    itemName: "",
    paymentIntentId: null,
    type: null,        // "subscription" | "session_package"
    packageType: null,
    category: null,
    programType: null, // "stock_market" | "gold_forex" | "crypto"
    isGuest: false,
  })
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return
    setStatusLoading(true)
    try {
      const data = await paymentService.getSubscriptionStatus()
      setSubscriptions(data.subscriptions || [])
      setSessionPackages(data.sessionPackages || [])
    } catch {
      // silent — status is non-critical on initial load
    } finally {
      setStatusLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // ----- 90 Circle -----
  const handleSubscribeClick = async (programIdx) => {
    const programType = PROGRAM_TYPES[programIdx]
    const courseName = section1.courses[programIdx]?.title || section1.title
    const itemName = `${section1.title} — ${courseName}`

    if (isAuthenticated) {
      setIsCreatingIntent(true)
      try {
        const data = await paymentService.createSubscriptionPaymentIntent(programType)
        setCheckoutModal({
          open: true,
          clientSecret: data.clientSecret,
          amount: parseFloat(data.finalPrice),
          itemName,
          paymentIntentId: data.paymentIntentId,
          type: "subscription",
          packageType: null,
          category: null,
          programType,
          isGuest: false,
        })
      } catch (err) {
        toast.error(err?.response?.data?.error || "Failed to start checkout")
      } finally {
        setIsCreatingIntent(false)
      }
    } else {
      // Guest flow: open modal directly — Step 1 (email form) will be shown
      setCheckoutModal({
        open: true,
        clientSecret: null,
        amount: null,
        itemName,
        paymentIntentId: null,
        type: "subscription",
        packageType: null,
        category: null,
        programType,
        isGuest: true,
      })
    }
  }

  const handleSubscriptionSuccess = async (paymentIntentId, guestToken) => {
    try {
      if (guestToken) {
        await paymentService.confirmGuestSubscriptionPayment(paymentIntentId, guestToken)
        toast.success(t('courses.section1.subscribeSuccess'))
        toast.success(t('checkout.checkEmailToSetPassword'), { duration: 6000 })
      } else {
        await paymentService.confirmSubscriptionPayment(paymentIntentId)
        toast.success(t('courses.section1.subscribeSuccess'))
      }
      setCheckoutModal(m => ({ ...m, open: false }))
      fetchStatus()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to confirm subscription")
    }
  }

  // ----- Session Packages -----
  const handleBuyPackageClick = async (packageType, category) => {
    const sessions = packageType === "3_sessions" ? 3 : 6
    const itemName = `${sessions} ${t('courses.section2.sectionLabel')} (${category === 'gold_forex' ? 'Gold & Forex' : 'Crypto'})`

    if (isAuthenticated) {
      setIsCreatingIntent(true)
      try {
        const data = await paymentService.createSessionPackagePaymentIntent(packageType, category)
        setCheckoutModal({
          open: true,
          clientSecret: data.clientSecret,
          amount: parseFloat(data.finalPrice),
          itemName,
          paymentIntentId: data.paymentIntentId,
          type: "session_package",
          packageType,
          category,
          isGuest: false,
        })
      } catch (err) {
        toast.error(err?.response?.data?.error || "Failed to start checkout")
      } finally {
        setIsCreatingIntent(false)
      }
    } else {
      // Guest flow: open modal directly — Step 1 (email form) will be shown
      setCheckoutModal({
        open: true,
        clientSecret: null,
        amount: null,
        itemName,
        paymentIntentId: null,
        type: "session_package",
        packageType,
        category,
        isGuest: true,
      })
    }
  }

  const handleSessionPackageSuccess = async (paymentIntentId, guestToken) => {
    try {
      if (guestToken) {
        await paymentService.confirmGuestSessionPackagePayment(paymentIntentId, guestToken)
        toast.success(t('courses.section2.buySuccess'))
        toast.success(t('checkout.checkEmailToSetPassword'), { duration: 6000 })
      } else {
        await paymentService.confirmSessionPackagePayment(paymentIntentId)
        toast.success(t('courses.section2.buySuccess'))
      }
      setCheckoutModal(m => ({ ...m, open: false }))
      fetchStatus()
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to confirm purchase")
    }
  }

  const handleCheckoutSuccess = (paymentIntent, guestToken) => {
    const paymentIntentId = paymentIntent?.id || checkoutModal.paymentIntentId
    if (checkoutModal.type === "subscription") {
      handleSubscriptionSuccess(paymentIntentId, guestToken)
    } else {
      handleSessionPackageSuccess(paymentIntentId, guestToken)
    }
  }

  const closeModal = () => setCheckoutModal(m => ({ ...m, open: false }))

  // Helpers
  const getSubscriptionForProgram = (programType) =>
    subscriptions.find(s => s.program_type === programType) || null

  const getPackageForCategory = (category) =>
    sessionPackages.find(p => p.category === category && p.sessions_remaining > 0) || null

  const formatExpiry = (dateStr) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

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
              const programType = PROGRAM_TYPES[idx]
              const activeSub = getSubscriptionForProgram(programType)
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

                    {/* CTA area */}
                    {activeSub ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          <span>{t('courses.section1.activeSubscription')}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t('courses.section1.subscriptionExpires')}: {formatExpiry(activeSub.expires_at)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {activeSub.group_sessions_remaining} {t('courses.section1.groupSessionsRemaining')} &middot; {activeSub.individual_sessions_remaining} {t('courses.section1.individualSessionsRemaining')}
                        </div>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        disabled={isCreatingIntent || statusLoading}
                        className={`w-full px-6 py-3.5 ${colors.buttonColor} text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                        onClick={() => handleSubscribeClick(idx)}
                      >
                        {isCreatingIntent
                          ? t('courses.section1.subscribing')
                          : t('courses.section1.subscribeButton')}
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
              const category = SESSION_CATEGORIES[idx]
              const existingPackage = getPackageForCategory(category)

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

                    {/* CTA area */}
                    {existingPackage ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          <span>{t('courses.section2.packageActive')}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {existingPackage.sessions_remaining} {t('courses.section2.sessionsRemaining')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 0 }}
                          disabled={isCreatingIntent || statusLoading}
                          className={`flex-1 px-4 py-3 ${colors.buttonColor} text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                          onClick={() => handleBuyPackageClick("3_sessions", category)}
                        >
                          {t('courses.section2.buy3Button')}
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 0 }}
                          disabled={isCreatingIntent || statusLoading}
                          className={`flex-1 px-4 py-3 border-2 border-current ${colors.accentColor} font-semibold rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50`}
                          onClick={() => handleBuyPackageClick("6_sessions", category)}
                        >
                          {t('courses.section2.buy6Button')}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

      </div>

      {/* Stripe Checkout Modal */}
      <StripeCheckoutModal
        isOpen={checkoutModal.open}
        onClose={closeModal}
        clientSecret={checkoutModal.clientSecret}
        amount={checkoutModal.amount}
        itemName={checkoutModal.itemName}
        onSuccess={handleCheckoutSuccess}
        onError={(err) => toast.error(err || "Payment failed")}
        isGuest={checkoutModal.isGuest}
        onGuestCreateIntent={
          checkoutModal.isGuest
            ? (email, firstName, lastName) => {
                if (checkoutModal.type === "subscription") {
                  return paymentService.createGuestSubscriptionPaymentIntent(email, firstName, lastName, checkoutModal.programType)
                } else {
                  return paymentService.createGuestSessionPackagePaymentIntent(
                    checkoutModal.packageType,
                    checkoutModal.category,
                    email,
                    firstName,
                    lastName,
                  )
                }
              }
            : undefined
        }
      />
    </section>
  )
}
