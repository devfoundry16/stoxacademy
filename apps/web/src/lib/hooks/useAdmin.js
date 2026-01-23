'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          router.push('/login');
          return;
        }

        const token = session.access_token;

        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = response.data.user;

        try {
          await axios.get(`${API_URL}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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