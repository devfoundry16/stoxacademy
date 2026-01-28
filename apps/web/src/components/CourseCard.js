"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Lock } from "lucide-react";
import { LevelBadge } from "./LevelBadge";
import { CourseStats } from "./CourseStats";
import { motion } from "framer-motion";
import { fadeInUp, defaultTransition } from "@/lib/animations";
import { useTranslations } from 'next-intl';

export function CourseCard({ course, isAuthenticated, onClick }) {
  const t = useTranslations();
  const canAccess = isAuthenticated && course.isPurchased;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      transition={defaultTransition}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      <Link href={`/courses/${course.id}`}>
        <div className="relative h-48 overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          
          {/* Lock/Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {canAccess ? (
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="w-8 h-8 text-white" fill="white" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Level Badge */}
          <div className="absolute top-4 left-4">
            <LevelBadge level={course.level} />
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Course Stats */}
          <CourseStats
            duration={course.duration}
            lessonsCount={course.lessons_count}
            rating={course.rating}
            className="mb-4"
          />

          {/* Students Count */}
          <div className="text-sm text-gray-500 mb-4">
            {course.students.toLocaleString()} {t('courseCard.studentsEnrolled')}
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {canAccess ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{t('courseCard.enrolled')}</span>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  ${parseFloat(course.price).toFixed(2)}
                </span>
              </div>
            )}
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={(e) => {
                e.preventDefault();
                onClick();
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canAccess
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : isAuthenticated
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {canAccess ? t('courseCard.continueLearning') : isAuthenticated ? t('courseCard.buyNow') : t('courseCard.signIn')}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

