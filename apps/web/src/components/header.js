"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setUserDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Stox
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/courses"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Courses
              </Link>
              {isAuthenticated && (
                <Link
                  href="/live-sessions"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Live Sessions
                </Link>
              )}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors relative z-60"
                  >
                    {user?.user_metadata?.avatar_url ? (
                      <Image
                        src={user?.user_metadata?.avatar_url}
                        alt="User Avatar"
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0]}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 transition-transform ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  
                  {userDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-55" 
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-60">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-6 py-2 border-blue-600 border-2 text-black rounded-full hover:text-white hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-40 md:hidden">
          <nav className="flex flex-col p-6 gap-4">
            <Link href="/courses" className="text-gray-700 text-lg">
              Courses
            </Link>
            {isAuthenticated && (
              <Link href="/live-sessions" className="text-gray-700 text-lg">
                Live Sessions
              </Link>
            )}
            {isAuthenticated ? (
              <div className="space-y-2">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user?.user_metadata?.avatar_url}
                      alt="User Avatar"
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700 flex-1 text-left">
                    {user?.user_metadata?.full_name ||
                      user?.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {userDropdownOpen && (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-center hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-blue-600 text-white rounded-full text-center"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-blue-600 text-white rounded-full text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
