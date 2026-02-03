"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import toast from "react-hot-toast";
import { Header } from "@/components/header";
import { useAuthStore } from "@/store/authStore";
import { courseService } from "@/lib/courseService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { paymentService } from "@/lib/paymentService";
import StripeCheckoutModal from "@/components/StripeCheckoutModal";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { LevelBadge } from "@/components/LevelBadge";
import { CourseStats } from "@/components/CourseStats";
import {
  Play,
  Lock,
  Clock,
  CheckCircle,
  Users,
  BookOpen
} from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations";


export default function CourseDetailPage({ params }) {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountInfo, setDiscountInfo] = useState({
    originalPrice: 0,
    finalPrice: 0,
    discountPercentage: 0,
  });
  const { id } = React.use(params);
  // Fetch course from API
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await courseService.getCourseById(id);
        setCourse(data.course);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleLessonClick = (lesson) => {
    if (!isAuthenticated) {
      toast.error(t('courseDetail.signInToWatch'));
      router.push("/login");
      return;
    }

    if (!lesson.is_preview && !course?.isPurchased) {
      toast.error(t('courseDetail.purchaseToWatch'));
      return;
    }

    setSelectedLesson(lesson);
  };

  const handleLessonProgressToggle = async (lesson, e) => {
    e.stopPropagation(); // Prevent triggering the lesson click handler

    if (!isAuthenticated) {
      toast.error(t('courseDetail.signInToUpdateProgress'));
      router.push("/login");
      return;
    }

    if (!course?.isPurchased && !lesson.is_preview) {
      toast.error(t('courseDetail.purchaseToMarkComplete'));
      return;
    }

    const newCompletedStatus = !lesson.completed;

    try {
      // Optimistically update the UI
      setCourse(prevCourse => ({
        ...prevCourse,
        lessons: prevCourse.lessons.map(l =>
          l.id === lesson.id
            ? { ...l, completed: newCompletedStatus }
            : l
        ),
      }));

      // Update progress on the server
      await courseService.updateLessonProgress(lesson.id, newCompletedStatus);

      toast.success(
        newCompletedStatus
          ? t('courseDetail.lessonCompleted')
          : t('courseDetail.lessonIncomplete')
      );
    } catch (err) {
      // Revert on error
      setCourse(prevCourse => ({
        ...prevCourse,
        lessons: prevCourse.lessons.map(l =>
          l.id === lesson.id
            ? { ...l, completed: !newCompletedStatus }
            : l
        ),
      }));

      toast.error(err.response?.data?.error || t('courseDetail.failedToUpdateProgress'));
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error(t('courseDetail.signInToPurchase'));
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      // Create payment intent without coupon initially
      const response = await paymentService.createCoursePaymentIntent(course.id);
      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setDiscountInfo({
        originalPrice: parseFloat(course.price),
        finalPrice: parseFloat(course.price),
        discountPercentage: 0,
      });
      setCheckoutModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || t('courseDetail.failedToInitializePayment'));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (couponCode) => {
    console.log('-------------Apply Coupon-----------')
    console.log("couponCode", couponCode);
    if (!couponCode) {
      // Remove coupon - recreate payment intent without coupon
      try {
        const response = await paymentService.createCoursePaymentIntent(course.id);
        setClientSecret(response.clientSecret);
        setPaymentIntentId(response.paymentIntentId);
        setAppliedCoupon(null);
        setDiscountInfo({
          originalPrice: parseFloat(course.price),
          finalPrice: parseFloat(course.price),
          discountPercentage: 0,
        });
        toast.success(t('courseDetail.couponRemoved'));
      } catch (error) {
        toast.error(t('courseDetail.failedToRemoveCoupon'));
      }
      return;
    }

    // Apply coupon - recreate payment intent with coupon
    try {
      const response = await paymentService.createCoursePaymentIntent(
        course.id,
        couponCode
      );
      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setAppliedCoupon(couponCode);
      setDiscountInfo({
        originalPrice: parseFloat(response.originalPrice),
        finalPrice: parseFloat(response.finalPrice),
        discountPercentage: response.discountPercentage,
      });

      toast.success(`${t('courseDetail.couponApplied')} ${response.discountPercentage}% ${t('courseDetail.off')}`);
    } catch (error) {
      toast.error(error.response?.data?.error || t('courseDetail.invalidCoupon'));
      throw error;
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setLoading(true);
      // Confirm payment on backend
      await paymentService.confirmCoursePayment(paymentIntent.id);
      setCheckoutModalOpen(false);
      toast.success(t('courseDetail.coursePurchased'));
      // Refresh course data
      const data = await courseService.getCourseById(id);
      setCourse(data.course);
    } catch (err) {
      toast.error(err.response?.data?.error || t('courseDetail.paymentConfirmationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast.error(error.message || t('courseDetail.paymentFailed'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingSpinner message={t('courseDetail.loadingCourse')} fullScreen />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ErrorState
          message={error || t('courseDetail.courseNotFound')}
          actionLabel={t('common.backToCourses')}
          onAction={() => router.push("/courses")}
          fullScreen
        />
      </div>
    );
  }

  const canAccess = isAuthenticated && course.isPurchased;
  const features = Array.isArray(course.features) ? course.features : [];
  const requirements = Array.isArray(course.requirements) ? course.requirements : [];
  const whatYouLearn = Array.isArray(course.what_you_learn) ? course.what_you_learn : [];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="min-h-screen bg-gray-50"
    >
      <Header />

      <div className="pt-15">
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={defaultTransition}
          className="bg-linear-to-br from-blue-600 to-purple-600 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <LevelBadge level={course.level} />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-xl text-blue-100 mb-6">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-white">
                  <CourseStats
                    duration={course.duration}
                    lessonsCount={course.lessons_count}
                    rating={course.rating}
                    className="text-white"
                  />
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{course.students.toLocaleString()} {t('courseDetail.students')}</span>
                  </div>
                </div>

                {course.instructor && (
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/20">
                    {course.instructor_avatar && (
                      <Image
                        src={course.instructor_avatar}
                        alt={course.instructor}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-blue-200">{t('courseDetail.instructor')}</p>
                      <p className="font-semibold">{course.instructor}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-xl p-6 text-gray-900 sticky top-24">
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2">
                      ${parseFloat(course.price).toFixed(2)}
                    </div>
                    {canAccess ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">{t('courseDetail.enrolled')}</span>
                      </div>
                    ) : (
                      <p className="text-gray-600">{t('courseDetail.oneTimePayment')}</p>
                    )}
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={canAccess}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors mb-3 ${canAccess
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {canAccess ? t('courseDetail.alreadyEnrolled') : t('courseDetail.buyNow')}
                  </button>

                  {features.length > 0 && (
                    <div className="space-y-3 text-sm">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.2 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              {selectedLesson && selectedLesson.video_url && (
                <div className="mb-8">
                  <VideoPlayer
                    videoUrl={selectedLesson.video_url}
                    thumbnailUrl={course.thumbnail}
                    className="w-full aspect-video"
                  />
                  <div className="bg-white rounded-b-xl p-6 shadow-md">
                    <h2 className="text-2xl font-bold mb-2">{selectedLesson.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedLesson.duration}
                      </span>
                      {selectedLesson.is_preview && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {t('courseDetail.freePreview')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    {["overview", "curriculum", "requirements"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-6 py-4 text-sm font-semibold capitalize transition-colors ${activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        {t(`courseDetail.tabs.${tab}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === "overview" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">{t('courseDetail.whatYouWillLearn')}</h3>
                      {whatYouLearn.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-3">
                          {whatYouLearn.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">{t('courseDetail.courseOverviewComingSoon')}</p>
                      )}
                    </div>
                  )}

                  {activeTab === "curriculum" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">{t('courseDetail.courseCurriculum')}</h3>
                      <div className="text-sm text-gray-600 mb-4">
                        {t('courseDetail.lessonsAndDuration', { count: course.lessons?.length || 0, duration: course.duration })}
                      </div>
                      <p className="text-gray-600">
                        {t('courseDetail.seeCompleteLessonList')}
                      </p>
                    </div>
                  )}

                  {activeTab === "requirements" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">{t('courseDetail.requirements')}</h3>
                      {requirements.length > 0 ? (
                        <ul className="space-y-2">
                          {requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">{t('courseDetail.noSpecificRequirements')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lessons Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...defaultTransition, delay: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24"
              >
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold text-lg">{t('courseDetail.courseContent')}</h3>
                  <p className="text-sm text-gray-600">
                    {course.lessons?.length || 0} {t('courseDetail.lessons')}
                  </p>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {course.lessons && course.lessons.length > 0 ? (
                    course.lessons.map((lesson, index) => (
                      <motion.button
                        key={lesson.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ x: 0 }}
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedLesson?.id === lesson.id ? "bg-blue-50" : ""
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {lesson.is_preview || canAccess ? (
                              <Play className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                {index + 1}. {lesson.title}
                              </h4>
                              {isAuthenticated && (lesson.is_preview || canAccess) && (
                                <input
                                  type="checkbox"
                                  checked={lesson.completed || false}
                                  onChange={(e) => handleLessonProgressToggle(lesson, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                                  aria-label={lesson.completed ? t('courseDetail.markLessonIncomplete', { title: lesson.title }) : t('courseDetail.markLessonComplete', { title: lesson.title })}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{lesson.duration}</span>
                              {lesson.is_preview && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">
                                  {t('courseDetail.preview')}
                                </span>
                              )}
                              {lesson.completed && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {t('courseDetail.completed')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="p-4">
                      <EmptyState
                        icon={BookOpen}
                        title={t('courseDetail.noLessonsAvailable')}
                        description={t('courseDetail.lessonsWillBeAddedSoon')}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stripe Checkout Modal */}
      {clientSecret && (
        <StripeCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          clientSecret={clientSecret}
          amount={discountInfo.finalPrice}
          itemName={course.title}
          originalPrice={discountInfo.originalPrice}
          discountPercentage={discountInfo.discountPercentage}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={handleApplyCoupon}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </motion.div>
  );
}
