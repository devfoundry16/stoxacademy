"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { useAuthStore } from "@/store/authStore";
import { Play, Lock, Clock, BookOpen, Star } from "lucide-react";

// Mock courses data - replace with API call later
const courses = [
  {
    id: 1,
    title: "Stock Market Fundamentals",
    description: "Learn the basics of stock market trading and investment strategies",
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop",
    duration: "4h 30m",
    lessons: 12,
    level: "Beginner",
    price: 49.99,
    rating: 4.8,
    students: 1234,
    isPurchased: false,
  },
  {
    id: 2,
    title: "Technical Analysis Mastery",
    description: "Master chart patterns, indicators, and technical trading strategies",
    thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop",
    duration: "6h 15m",
    lessons: 18,
    level: "Intermediate",
    price: 79.99,
    rating: 4.9,
    students: 892,
    isPurchased: false,
  },
  {
    id: 3,
    title: "Options Trading Strategies",
    description: "Comprehensive guide to options trading and advanced strategies",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    duration: "8h 20m",
    lessons: 24,
    level: "Advanced",
    price: 99.99,
    rating: 4.7,
    students: 645,
    isPurchased: false,
  },
  {
    id: 4,
    title: "Cryptocurrency Investment",
    description: "Understanding blockchain, crypto trading, and portfolio management",
    thumbnail: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop",
    duration: "5h 45m",
    lessons: 15,
    level: "Intermediate",
    price: 69.99,
    rating: 4.6,
    students: 1567,
    isPurchased: false,
  },
  {
    id: 5,
    title: "Risk Management & Portfolio Building",
    description: "Learn to build and manage a diversified investment portfolio",
    thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop",
    duration: "3h 30m",
    lessons: 10,
    level: "Beginner",
    price: 39.99,
    rating: 4.9,
    students: 2103,
    isPurchased: false,
  },
  {
    id: 6,
    title: "Day Trading Bootcamp",
    description: "Intensive course on day trading strategies and execution",
    thumbnail: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop",
    duration: "10h 00m",
    lessons: 30,
    level: "Advanced",
    price: 149.99,
    rating: 4.8,
    students: 523,
    isPurchased: false,
  },
];

const levelColors = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced: "bg-purple-100 text-purple-700",
};

export default function CoursesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    if (selectedLevel === "All") return true;
    return course.level === selectedLevel;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "popular") return b.students - a.students;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  const handleCourseClick = (course) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Navigate to course detail page
    // Authenticated users can see details, preview lessons, and purchase
    // Non-authenticated users can see details and preview but must sign in to purchase
    router.push(`/courses/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Master Stock Trading
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Learn from expert traders with our comprehensive video courses
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <BookOpen className="w-5 h-5" />
              <span>{courses.length} Courses</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="w-5 h-5" />
              <span>4.8 Average Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/* Level Filter */}
          <div className="flex flex-wrap gap-2">
            {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLevel === level
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isAuthenticated={isAuthenticated}
              onClick={() => handleCourseClick(course)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, isAuthenticated, onClick }) {
  const canAccess = isAuthenticated && course.isPurchased;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
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
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level]}`}>
              {course.level}
            </span>
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
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessons} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
          </div>

          {/* Students Count */}
          <div className="text-sm text-gray-500 mb-4">
            {course.students.toLocaleString()} students enrolled
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ${course.price}
              </span>
            </div>
            <button
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
              {canAccess ? "Watch Now" : isAuthenticated ? "Buy Now" : "Sign In"}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

