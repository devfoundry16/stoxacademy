import { create } from 'zustand';
import { authService } from '@/lib/auth';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  loading: true,
  isAuthenticated: false,

  // Actions
  initialize: async () => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      // Verify the token is still valid
      try {
        const userData = await authService.getCurrentUser();
        set({ user: userData, isAuthenticated: true, loading: false });
      } catch (error) {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  signUp: async (userData) => {
    const data = await authService.signUp(userData);
    set({ user: data.user, isAuthenticated: true });
    // Dispatch event for cross-component updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-storage-change'));
    }
    return data;
  },

  signIn: async (email, password) => {
    const data = await authService.signIn(email, password);
    set({ user: data.user, isAuthenticated: true });
    // Dispatch event for cross-component updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-storage-change'));
    }
    return data;
  },

  signInWithGoogle: async () => {
    const data = await authService.signInWithGoogle();
    // Redirect to Google OAuth
    if (data.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }
    return data;
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false });
    // Dispatch event for cross-component updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-storage-change'));
    }
  },

  refreshUser: async () => {
    if (authService.isAuthenticated()) {
      try {
        const userData = await authService.getCurrentUser();
        set({ user: userData, isAuthenticated: true });
      } catch (error) {
        set({ user: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Listen for storage changes
  setupStorageListener: () => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = () => {
      const storedUser = authService.getStoredUser();
      if (storedUser && authService.isAuthenticated()) {
        authService
          .getCurrentUser()
          .then((userData) => {
            set({ user: userData, isAuthenticated: true });
          })
          .catch(() => {
            set({ user: null, isAuthenticated: false });
          });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('auth-storage-change', handleStorageChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-storage-change', handleStorageChange);
    };
  },
}));

