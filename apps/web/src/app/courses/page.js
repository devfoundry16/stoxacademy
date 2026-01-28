"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { Header } from "@/components/header";
import { useAuthStore } from "@/store/authStore";
import { courseService } from "@/lib/courseService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { CourseCard } from "@/components/CourseCard";
import { BookOpen, Star } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from "@/lib/animations";

export default function CoursesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await courseService.getAllCourses({
          level: selectedLevel,
          sortBy: sortBy,
        });
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedLevel, sortBy]);

  const handleCourseClick = (course) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push(`/courses/${course.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingSpinner message={t('courses.page.loadingCourses')} fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ErrorState
          message={error}
          actionLabel={t('common.retry')}
          onAction={() => window.location.reload()}
          fullScreen
        />
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="min-h-screen bg-gray-50"
    >
      <Header />
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={defaultTransition}
        className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-600 to-purple-600 text-white"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...defaultTransition, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t('courses.page.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...defaultTransition, delay: 0.2 }}
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
          >
            {t('courses.page.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...defaultTransition, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 text-sm"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5" />
              <span>{courses.length} {t('courses.page.coursesCount')}</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters and Sort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...defaultTransition, delay: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/* Level Filter */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-wrap gap-2"
          >
            {[
              { key: "All", label: t('courses.page.all') },
              { key: "Beginner", label: t('courses.page.beginner') },
              { key: "Intermediate", label: t('courses.page.intermediate') },
              { key: "Advanced", label: t('courses.page.advanced') }
            ].map((level) => (
              <motion.button
                key={level.key}
                variants={staggerItem}
                onClick={() => setSelectedLevel(level.key)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLevel === level.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {level.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="popular">{t('courses.page.mostPopular')}</option>
            <option value="price-low">{t('courses.page.priceLowToHigh')}</option>
            <option value="price-high">{t('courses.page.priceHighToLow')}</option>
          </select>
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('courses.page.noCoursesFound')}
            description={t('courses.page.tryAdjustingFilters')}
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                variants={staggerItem}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard
                  course={course}
                  isAuthenticated={isAuthenticated}
                  onClick={() => handleCourseClick(course)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

