'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { checkAdmin } from '@/lib/api/adminApi';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await checkAdmin();
        setIsAdmin(true);
      } catch (error) {
        const status = error.response?.status;
        if (status === 403) {
          toast.error('You are not authorized to access the admin dashboard.');
          router.push('/');
        } else if (status === 401) {
          router.push('/login');
        } else {
          console.error('Admin check failed:', error);
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  return { isAdmin, loading };
};
