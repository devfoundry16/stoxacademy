"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/header";
import { useAuthStore } from "@/store/authStore";
import { 
  Play, 
  Lock, 
  Clock, 
  BookOpen, 
  Star, 
  CheckCircle, 
  Users,
  Award,
  Download,
  Share2
} from "lucide-react";
import { VideoPlayer } from "@/components/video-player";

// Mock course data - replace with API call
const getCourseById = (id) => {
  const courses = {
    1: {
      id: 1,
      title: "Stock Market Fundamentals",
      description: "Learn the basics of stock market trading and investment strategies. This comprehensive course covers everything from understanding market mechanics to developing your first trading strategy.",
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
      duration: "4h 30m",
      level: "Beginner",
      price: 49.99,
      rating: 4.8,
      students: 1234,
      instructor: "John Smith",
      instructorAvatar: "https://i.pravatar.cc/150?img=12",
      isPurchased: false,
      lessons: [
        {
          id: 1,
          title: "Introduction to Stock Markets",
          duration: "15:30",
          isPreview: true,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          id: 2,
          title: "Understanding Stock Prices",
          duration: "22:15",
          isPreview: false,
        },
        {
          id: 3,
          title: "Types of Stocks",
          duration: "18:45",
          isPreview: false,
        },
        {
          id: 4,
          title: "Reading Stock Charts",
          duration: "25:30",
          isPreview: false,
        },
        {
          id: 5,
          title: "Market Orders vs Limit Orders",
          duration: "20:00",
          isPreview: false,
        },
        {
          id: 6,
          title: "Risk Management Basics",
          duration: "28:15",
          isPreview: false,
        },
      ],
      features: [
        "Lifetime access",
        "Certificate of completion",
        "Downloadable resources",
        "Mobile and desktop access",
        "Community support",
      ],
      requirements: [
        "No prior trading experience required",
        "Basic understanding of finance helpful",
        "Computer or mobile device",
      ],
      whatYouLearn: [
        "Understand how stock markets work",
        "Read and interpret stock charts",
        "Place different types of orders",
        "Manage risk in your portfolio",
        "Develop a trading strategy",
        "Analyze market trends",
      ],
    },
  };
  
  return courses[id] || courses[1];
};

export default function CourseDetailPage({ params }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = React.use(params)
  const course = getCourseById(id);
  const canAccess = isAuthenticated && course.isPurchased;

  const handleLessonClick = (lesson) => {
    if (!isAuthenticated) {
      alert("Please sign in to watch lessons");
      router.push("/login");
      return;
    }
    
    if (!lesson.isPreview && !canAccess) {
      alert("Please purchase this course to watch this lesson");
      return;
    }
    
    setSelectedLesson(lesson);
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      alert("Please sign in to purchase this course");
      router.push("/login");
      return;
    }
    
    // TODO: Implement payment flow
    alert("Payment integration coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20">
        {/* Course Header */}
        <div className="bg-linear-to-br from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                    {course.level}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-xl text-blue-100 mb-6">
                  {course.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{course.rating}</span>
                    <span className="text-blue-200">({course.students} ratings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration} total</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/20">
                  <Image
                    src={course.instructorAvatar}
                    alt={course.instructor}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm text-blue-200">Instructor</p>
                    <p className="font-semibold">{course.instructor}</p>
                  </div>
                </div>
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
                    <div className="text-3xl font-bold mb-2">${course.price}</div>
                    {canAccess ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Enrolled</span>
                      </div>
                    ) : (
                      <p className="text-gray-600">One-time payment</p>
                    )}
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={canAccess}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors mb-3 ${
                      canAccess
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {canAccess ? "Already Enrolled" : "Buy Now"}
                  </button>

                  <div className="space-y-3 text-sm">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Award className="w-4 h-4" />
                      <span>Gift</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              {selectedLesson && (
                <div className="mb-8">
                  <VideoPlayer
                    videoUrl={selectedLesson.videoUrl}
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
                      {selectedLesson.isPreview && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          FREE PREVIEW
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
                        className={`flex-1 px-6 py-4 text-sm font-semibold capitalize transition-colors ${
                          activeTab === tab
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === "overview" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">What you&apos;ll learn</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {course.whatYouLearn.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "curriculum" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Course Curriculum</h3>
                      <div className="text-sm text-gray-600 mb-4">
                        {course.lessons.length} lessons • {course.duration}
                      </div>
                      {/* Lessons are shown in sidebar */}
                      <p className="text-gray-600">
                        See the complete lesson list in the sidebar →
                      </p>
                    </div>
                  )}

                  {activeTab === "requirements" && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Requirements</h3>
                      <ul className="space-y-2">
                        {course.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lessons Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold text-lg">Course Content</h3>
                  <p className="text-sm text-gray-600">
                    {course.lessons.length} lessons
                  </p>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {course.lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`w-full p-4 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                        selectedLesson?.id === lesson.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {lesson.isPreview || canAccess ? (
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
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{lesson.duration}</span>
                            {lesson.isPreview && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">
                                Preview
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

