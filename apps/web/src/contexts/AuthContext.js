"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/lib/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Optionally verify the token is still valid
      authService
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (userData) => {
    const data = await authService.signUp(userData);
    setUser(data.user);
    return data;
  };

  const signIn = async (email, password) => {
    const data = await authService.signIn(email, password);
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

