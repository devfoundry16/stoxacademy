'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { BookOpen, Clock, CheckCircle, PlayCircle, TrendingUp, Award } from 'lucide-react';
import { Header, LoadingSpinner, ErrorState } from '@/components';
import { courseService } from '@/lib/courseService';
import { authService } from '@/lib/auth';
import { LevelBadge } from '@/components/LevelBadge';

function CourseProgressCard({ userCourse }) {
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
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
                        <span>By {course.instructor}</span>
                    )}
                    {course.level && (
                        <LevelBadge level={course.level} />
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Course Progress</span>
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
                            <span className="text-xs text-gray-600">Total</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{progress.totalLessons}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-xs text-gray-600">Done</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">{progress.completedLessons}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={16} className="text-orange-600" />
                            <span className="text-xs text-gray-600">Left</span>
                        </div>
                        <p className="text-lg font-bold text-orange-700">{progress.remainingLessons}</p>
                    </div>
                </div>

                {/* Action Button */}
                {progress.progressPercentage === 100 ? (
                    <button
                        onClick={handleViewCourse}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                    >
                        <Award size={20} />
                        <span>Completed - Review Course</span>
                    </button>
                ) : progress.progressPercentage > 0 ? (
                    <button
                        onClick={handleContinueLearning}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                    >
                        <PlayCircle size={20} />
                        <span>Continue Learning</span>
                    </button>
                ) : (
                    <button
                        onClick={handleContinueLearning}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                    >
                        <PlayCircle size={20} />
                        <span>Start Learning</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function MyCoursesPage() {
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
            setError('Failed to load your courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <LoadingSpinner message="Loading your courses..." fullScreen />
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
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
            <Header />

            {/* Page Header */}
            <div className="pt-36 pb-20 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                            <BookOpen size={20} />
                            <span className="text-sm font-semibold">Learning Dashboard</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                            My Courses
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            Track your learning progress and continue where you left off
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BookOpen size={24} className="text-blue-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{totalCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Total Courses</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <PlayCircle size={24} className="text-orange-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{inProgressCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Award size={24} className="text-green-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{completedCourses}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <CheckCircle size={24} className="text-purple-600" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{totalLessonsCompleted}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Lessons Done</p>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
                {courses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                            <BookOpen size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No courses yet</h3>
                        <p className="text-gray-600 text-lg mb-6">Start learning by purchasing your first course</p>
                        <button
                            onClick={() => router.push('/courses')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                        >
                            <BookOpen size={20} />
                            Browse Courses
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((userCourse) => (
                            <CourseProgressCard
                                key={userCourse.id}
                                userCourse={userCourse}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
