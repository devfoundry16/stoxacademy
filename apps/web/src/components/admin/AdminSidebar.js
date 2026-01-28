'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Video,
    FileText,
    LogOut,
    Menu,
    X,
    User,
    Settings
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AdminSidebar() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const t = useTranslations('admin.sidebar');
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const menuItems = [
        { name: t('dashboard'), href: '/admin', icon: LayoutDashboard },
        { name: t('users'), href: '/admin/users', icon: Users },
        { name: t('courses'), href: '/admin/courses', icon: BookOpen },
        { name: t('liveSessions'), href: '/admin/live-sessions', icon: Video },
        { name: t('checklist'), href: '/admin/checklist', icon: FileText },
        { name: t('profile'), href: '/admin/profile', icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/login');
    };
    
    const getFullName = (userData) => {
        if (userData.user_metadata?.full_name) {
            return userData.user_metadata?.full_name.split(' ')[0] + ' ' + userData.user_metadata?.full_name.split(' ')[1].charAt(0) + '.';
        } else if (userData.user_metadata?.first_name && userData.user_metadata?.last_name) {
            return userData.user_metadata?.first_name + ' ' + userData.user_metadata?.last_name?.charAt(0) + '.';
        }
        return t('user');
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden fixed top-4 z-50 p-2 bg-white rounded-lg shadow-lg ${isRTL ? 'right-4' : 'left-4'}`}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 h-screen w-64 bg-linear-to-b from-slate-900 to-slate-800 
          text-white shadow-2xl z-40 transition-transform duration-300 ease-in-out
          ${isRTL ? 'right-0' : 'left-0'}
          ${isMobileMenuOpen 
                ? 'translate-x-0' 
                : isRTL 
                    ? 'translate-x-full lg:translate-x-0' 
                    : '-translate-x-full lg:translate-x-0'
            }
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="p-6 border-b border-slate-700 text-center">
                        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Stox Academy
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">{t('adminPanel')}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                                            ? 'bg-linear-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50'
                                            : 'hover:bg-slate-700/50'
                                        }
                  `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-slate-700">
                        {user && (
                            <div className="relative">
                                {/* User Info - Clickable */}
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-3 px-3 py-3 bg-slate-700/50 rounded-lg w-full hover:bg-slate-700 transition-all duration-200 group"
                                >
                                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {getFullName(user)}
                                        </p>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                            isUserMenuOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu - Appears on the right */}
                                {isUserMenuOpen && (
                                    <>
                                        {/* Backdrop for mobile */}
                                        <div 
                                            className="lg:hidden fixed inset-0 bg-black/20 z-40"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        />
                                        
                                        {/* Menu positioned based on RTL */}
                                        <div className={`absolute bottom-full mb-2 left-0 right-0 lg:bottom-0 lg:mb-0 w-full lg:w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-600/50 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                                            isRTL 
                                                ? 'lg:right-auto lg:left-0 lg:mr-2 lg:-translate-x-full' 
                                                : 'lg:left-auto lg:right-0 lg:ml-2 lg:translate-x-full'
                                        }`}>
                                            <div className="p-2">
                                                {/* User info in menu */}
                                                <div className="px-3 py-2 border-b border-slate-700/50 mb-2">
                                                    <p className="text-xs font-semibold text-white truncate">
                                                        {user.user_metadata?.full_name || user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                                </div>

                                                {/* Profile Settings link */}
                                                <Link
                                                    href="/admin/profile"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-slate-700 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                        <Settings size={16} className="text-blue-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">{tCommon('profileSettings')}</span>
                                                </Link>
                                                
                                                {/* Logout button blended with user section */}
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsUserMenuOpen(false);
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-slate-700 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                                        <LogOut size={16} className="text-red-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">{tCommon('logout')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                />
            )}
        </>
    );
}
