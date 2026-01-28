"use client";

import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import { Menu, X, LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, Link } from "@/i18n/routing";
import Image from "next/image";
import { LanguageSwitcher } from "./LanguageSwitcher";
export function Header() {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, isAuthenticated, loading } = useAuthStore();
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
                {t('header.brand')}
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/courses"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {t('common.courses')}
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/my-courses"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {t('common.myCourses')}
                  </Link>
                  <Link
                    href="/live-sessions"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {t('common.liveSessions')}
                  </Link>
                </>
              )}
              <LanguageSwitcher />
              {loading ? (
                <div className="flex items-center justify-center px-4 py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 relative z-60"
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
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                    {/* <span className="text-sm font-medium text-gray-700">
                      {user?.user_metadata?.full_name ||
                        user?.email?.split("@")[0]}
                    </span> */}
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
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          {t('common.profileSettings')}
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('common.logout')}
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
                    {t('common.login')}
                  </Link>
                  <Link
                    href="/signup"
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {t('common.signUp')}
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
              {t('common.courses')}
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/my-courses" className="text-gray-700 text-lg">
                  {t('common.myCourses')}
                </Link>
                <Link href="/live-sessions" className="text-gray-700 text-lg">
                  {t('common.liveSessions')}
                </Link>
              </>
            )}
            <div className="pt-4 border-t border-gray-200">
              <LanguageSwitcher />
            </div>
            {loading ? (
              <div className="flex items-center justify-center px-4 py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : isAuthenticated ? (
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
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 rounded-full text-center hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.profileSettings')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-center hover:bg-red-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-blue-600 text-white rounded-full text-center"
                >
                  {t('common.login')}
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-blue-600 text-white rounded-full text-center"
                >
                  {t('common.signUp')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
