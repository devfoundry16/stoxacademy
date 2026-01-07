'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Video,
    FileText,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Live Sessions', href: '/admin/live-sessions', icon: Video },
    { name: 'Checklist', href: '/admin/checklist', icon: FileText },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 
          text-white shadow-2xl z-40 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="p-6 border-b border-slate-700">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Stox Academy
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
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
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50'
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
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/20 transition-colors duration-200 text-red-400"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
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
