'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authService } from '@/lib/auth';
import { getDashboardStats } from '@/lib/api/adminApi';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userData = await authService.getCurrentUser();

        try {
          await getDashboardStats();
          setIsAdmin(true);
          setUser(userData);
        } catch (error) {
          if (error.response?.status === 403) {
            toast.error('You are not authorized to access the admin dashboard.');
          }
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