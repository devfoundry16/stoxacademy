'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAdmin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                // Get session from Supabase (automatically refreshed)
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    router.push('/login');
                    return;
                }

                const token = session.access_token;

                // Get current user
                const response = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = response.data.user;

                // Check if user has user_metadata with role or fetch from database
                let userRole = userData.user_metadata?.role;

                // If role not in metadata, we need to fetch from users table
                // For now, we'll try to get dashboard stats which will fail if not admin
                try {
                    await axios.get(`${API_URL}/api/admin/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    // If this succeeds, user is admin
                    setIsAdmin(true);
                    setUser(userData);
                } catch (error) {
                    // Not admin, redirect
                    router.push('/');
                }
            } catch (error) {
                console.error('Admin check failed:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, [router]);

    return { isAdmin, loading, user };
};
