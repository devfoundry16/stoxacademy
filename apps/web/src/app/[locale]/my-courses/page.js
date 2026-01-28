'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import Image from "next/image";
import { BookOpen, Clock, CheckCircle, PlayCircle, TrendingUp, Award } from 'lucide-react';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { courseService } from '@/lib/courseService';
import { authService } from '@/lib/auth';
import { LevelBadge } from '@/components/LevelBadge';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, defaultTransition } from '@/lib/animations';

function CourseProgressCard({ userCourse }) {
    const t = useTranslations();
    const router = useRouter();
    const course = userCourse.courses;
    const progress = userCourse.progress;

    const handleViewCourse = () => {
        router.push(`/courses/${course.id}`);
    };

    const handleContinueLearning = () => {
        router.push(`/courses/${course.id}`);
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            whileHover={{ y: -8 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
            {/* Course Thumbnail */}
            <div className="relative h-48 bg-linear-to-r from-blue-500 to-purple-500">
                {course.thumbnail ? (
                    <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={64} className="text-white opacity-50" />
                    </div>
                )}
                {/* Progress Badge */}
                <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        <span className="font-bold text-gray-900">{progress.progressPercentage}%</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Course Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                </h3>

                {/* Course Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {course.instructor && (
                        <span>{t('myCourses.by')} {course.instructor}</span>
                    )}
                    {course.level && (
                        <LevelBadge level={course.level} />
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">{t('myCourses.courseProgress')}</span>
                        <span className="text-sm font-bold text-blue-600">{progress.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progress.progressPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Lesson Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={16} className="text-blue-600" />
                            <span className="text-xs text-gray-600">{t('myCourses.total')}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{progress.totalLessons}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-xs text-gray-600">{t('myCourses.done')}</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">{progress.completedLessons}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-orange-600" />
                            <span className="text-xs text-gray-600">{t('myCourses.left')}</span>
                        </div>
                        <p className="text-lg font-bold text-orange-700">{progress.remainingLessons}</p>
                    </div>
                </div>

                {/* Action Button */}
                {progress.progressPercentage === 100 ? (
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        onClick={handleViewCourse}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                    >
                        <Award size={20} />
                        <span>{t('myCourses.completedReviewCourse')}</span>
                    </motion.button>
                ) : progress.progressPercentage > 0 ? (
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        onClick={handleContinueLearning}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                    >
                        <PlayCircle size={20} />
                        <span>{t('myCourses.continueLearning')}</span>
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                        onClick={handleContinueLearning}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                    >
                        <PlayCircle size={20} />
                        <span>{t('myCourses.startLearning')}</span>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

export default function MyCoursesPage() {
    const t = useTranslations();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchMyCourses();
    }, [router]);

    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await courseService.getUserCourses();
            setCourses(data.courses);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            setError(t('myCourses.failedToLoadCourses'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <LoadingSpinner message={t('myCourses.loadingCourses')} fullScreen />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <ErrorState message={error} fullScreen />
            </div>
        );
    }

    // Calculate overall stats
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress.progressPercentage === 100).length;
    const inProgressCourses = courses.filter(c => c.progress.progressPercentage > 0 && c.progress.progressPercentage < 100).length;
    const totalLessonsCompleted = courses.reduce((sum, c) => sum + c.progress.completedLessons, 0);

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50"
        >
            <Header />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={defaultTransition}
                className="pt-36 pb-20 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden"
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                            <BookOpen size={20} />
                            <span className="text-sm font-semibold">{t('myCourses.learningDashboard')}</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                            {t('myCourses.myCourses')}
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            {t('myCourses.trackProgress')}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...defaultTransition, delay: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-8"
            >
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <motion.div
                        variants={staggerItem}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BookOpen size={24} className="text-blue-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{totalCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{t('myCourses.totalCourses')}</p>
                    </motion.div>
                    <motion.div
                        variants={staggerItem}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <PlayCircle size={24} className="text-orange-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{inProgressCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{t('myCourses.inProgress')}</p>
                    </motion.div>
                    <motion.div
                        variants={staggerItem}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Award size={24} className="text-green-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{completedCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{t('myCourses.completed')}</p>
                    </motion.div>
                    <motion.div
                        variants={staggerItem}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <CheckCircle size={24} className="text-purple-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{totalLessonsCompleted}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{t('myCourses.lessonsDone')}</p>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Courses Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...defaultTransition, delay: 0.4 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16"
            >
                {courses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                            <BookOpen size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('myCourses.noCoursesYet')}</h3>
                        <p className="text-gray-600 text-lg mb-6">{t('myCourses.startLearning')}</p>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={() => router.push('/courses')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                        >
                            <BookOpen size={20} />
                            {t('myCourses.browseCourses')}
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {courses.map((userCourse, index) => (
                            <motion.div
                                key={userCourse.id}
                                variants={staggerItem}
                                transition={{ delay: index * 0.1 }}
                            >
                                <CourseProgressCard
                                    userCourse={userCourse}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}
