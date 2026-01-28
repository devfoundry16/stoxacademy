"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Link, useRouter } from "@/i18n/routing";
import { Header, LoadingSpinner } from "@/components";
import { authService } from "@/lib/auth";
import { countries } from "@/lib/countries";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { fadeInUp, defaultTransition } from "@/lib/animations";
import { User, Lock, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileSettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    age: "",
    country: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authService.getProfile();
      setProfile(data);
      setIsGoogleUser(data.isGoogleUser || false);
      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        phoneNumber: data.phone_number || "",
        age: data.age != null ? String(data.age) : "",
        country: data.country || "",
      });
    } catch (err) {
      setError(err.response?.data?.error || t('profile.loadingProfile'));
      if (err.response?.status === 401) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await authService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        age: formData.age,
        country: formData.country,
      });
      await refreshUser();
      toast.success(t('profile.profileUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || t('profile.failedToUpdateProfile'));
      toast.error(err.response?.data?.error || t('profile.failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'));
      toast.error(t('profile.passwordsDoNotMatch'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError(t('profile.passwordTooShort'));
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    // For email users, require current password
    if (!isGoogleUser && !passwordData.currentPassword) {
      setError(t('profile.currentPasswordRequired'));
      toast.error(t('profile.currentPasswordRequired'));
      return;
    }
    setChangingPassword(true);
    try {
      await authService.updatePassword(
        isGoogleUser ? null : passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      const successMsg = isGoogleUser 
        ? t('profile.passwordSet')
        : t('profile.passwordUpdated');
      toast.success(successMsg);
      // Update isGoogleUser state since they now have a password
      if (isGoogleUser) {
        setIsGoogleUser(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error || t('profile.failedToUpdatePassword');
      setError(msg);
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingSpinner message={t('profile.loadingProfile')} fullScreen />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50"
    >
      <Header />

      <div className="pt-28 pb-16 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={defaultTransition}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.profileSettings')}</h1>
          <p className="text-gray-600 mt-1">
            {t('profile.updatePersonalInfo')}
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Profile form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('profile.personalInformation')}
            </h2>
          </div>

          <form onSubmit={handleSubmitProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('profile.firstName')}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('profile.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('profile.lastName')}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('profile.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('profile.emailCannotBeChanged')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('profile.phoneNumber')}
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('profile.phonePlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('profile.age')}
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="13"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('profile.agePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('profile.country')}
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">{t('profile.selectCountry')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? t('profile.saving') : t('profile.saveProfile')}
            </motion.button>
          </form>
        </motion.section>

        {/* Password form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isGoogleUser ? t('profile.setPassword') : t('profile.changePassword')}
            </h2>
          </div>

          {isGoogleUser && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <p className="font-medium mb-1">{t('profile.signedInWithGoogle')}</p>
              <p>{t('profile.setPasswordDescription')}</p>
            </div>
          )}

          <form onSubmit={handleSubmitPassword} className="space-y-5">
            {!isGoogleUser && (
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t('profile.currentPassword')}
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('profile.passwordPlaceholder')}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('profile.newPassword')}
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={t('profile.atLeast6Characters')}
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('profile.confirmNewPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={t('profile.passwordPlaceholder')}
              />
            </div>

            <motion.button
              type="submit"
              disabled={changingPassword}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {changingPassword 
                ? (isGoogleUser ? t('profile.setting') : t('profile.updating')) 
                : (isGoogleUser ? t('profile.setPassword') : t('profile.updatePassword'))}
            </motion.button>
          </form>
        </motion.section>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/my-courses" className="text-blue-600 hover:text-blue-700">
            {t('common.backToMyCourses')}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
