"use client";

import React from "react";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
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
              <a
                href="#"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Courses
              </a>
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.first_name ||
                        user?.email?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-6 py-2 border-red-600 border-2 text-red-600 rounded-full hover:text-white hover:bg-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
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
            <a href="#" className="text-gray-700 text-lg">
              Courses
            </a>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.user_metadata?.first_name ||
                      user?.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-center"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
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
