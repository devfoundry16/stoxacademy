'use client';

import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import Modal from './admin/Modal';
import { useTranslations } from 'next-intl';
import { Tag, Loader2, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StripeCheckoutModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  itemName,
  onSuccess,
  onError,
  onApplyCoupon,
  originalPrice,
  discountPercentage,
  appliedCoupon,
  // Guest checkout props
  isGuest,
  onGuestCreateIntent,
}) {
  const t = useTranslations();
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Guest checkout state
  const [guestStep, setGuestStep] = useState(1); // 1 = email/name form, 2 = payment form
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [isCreatingGuestIntent, setIsCreatingGuestIntent] = useState(false);
  const [guestClientSecret, setGuestClientSecret] = useState(null);
  const [guestToken, setGuestToken] = useState(null);
  const [guestAmount, setGuestAmount] = useState(null);
  const [guestDiscountPercentage, setGuestDiscountPercentage] = useState(0);
  const [guestOriginalPrice, setGuestOriginalPrice] = useState(null);
  const [isNewAccount, setIsNewAccount] = useState(false);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  // The active clientSecret is either the guest one (after step 1) or the prop (for logged-in users)
  const activeClientSecret = isGuest ? guestClientSecret : clientSecret;
  const activeAmount = isGuest ? (guestAmount ?? amount) : amount;
  const activeOriginalPrice = isGuest ? (guestOriginalPrice ?? activeAmount) : (originalPrice ?? amount);
  const activeDiscountPercentage = isGuest ? guestDiscountPercentage : (discountPercentage ?? 0);

  const options = {
    clientSecret: activeClientSecret,
    appearance,
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t('checkout.pleaseEnterCouponCode'));
      return;
    }
    setIsValidating(true);
    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch {
      // Error handled by parent
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (onApplyCoupon) {
      onApplyCoupon(null);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestEmail.trim()) {
      toast.error(t('checkout.emailRequired'));
      return;
    }
    setIsCreatingGuestIntent(true);
    try {
      const data = await onGuestCreateIntent(guestEmail.trim(), guestFirstName.trim(), guestLastName.trim());
      setGuestClientSecret(data.clientSecret);
      setGuestToken(data.guestToken);
      setIsNewAccount(data.isNewUser ?? true);
      if (data.finalPrice != null) setGuestAmount(parseFloat(data.finalPrice));
      if (data.originalPrice != null) setGuestOriginalPrice(parseFloat(data.originalPrice));
      if (data.discountPercentage != null) setGuestDiscountPercentage(data.discountPercentage);
      setGuestStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.error || t('checkout.failedToInitialize'));
    } finally {
      setIsCreatingGuestIntent(false);
    }
  };

  // Intercept CheckoutForm onSuccess to inject guestToken before calling parent
  const handleCheckoutSuccess = (paymentIntent) => {
    if (onSuccess) onSuccess(paymentIntent, isGuest ? guestToken : null);
  };

  const handleClose = () => {
    // Reset guest state on close so the modal is fresh next time
    if (isGuest) {
      setGuestStep(1);
      setGuestEmail('');
      setGuestFirstName('');
      setGuestLastName('');
      setGuestClientSecret(null);
      setGuestToken(null);
      setGuestAmount(null);
      setGuestOriginalPrice(null);
      setGuestDiscountPercentage(0);
      setIsNewAccount(false);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('checkout.completePurchase')} size="lg">
      <div className="p-2 space-y-4">

        {/* GUEST STEP 1: Email + Name */}
        {isGuest && guestStep === 1 && (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                {t('checkout.guestCheckoutInfo')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.emailAddress')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder={t('checkout.emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreatingGuestIntent}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('checkout.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    placeholder={t('checkout.firstNamePlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreatingGuestIntent}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('checkout.lastName')}
                </label>
                <input
                  type="text"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  placeholder={t('checkout.lastNamePlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreatingGuestIntent}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingGuestIntent || !guestEmail.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isCreatingGuestIntent ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('checkout.preparing')}
                </>
              ) : (
                t('checkout.continueToPayment')
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              {t('checkout.alreadyHaveAccount')}{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                {t('checkout.signIn')}
              </a>
            </p>
          </form>
        )}

        {/* GUEST STEP 2 or LOGGED-IN: Coupon + Stripe Payment Form */}
        {(!isGuest || guestStep === 2) && (
          <>
            {/* Coupon Input — only for flows that support coupons (onApplyCoupon prop present) */}
            {onApplyCoupon && !appliedCoupon && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('checkout.haveCouponCode')}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t('checkout.enterCouponCode')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      disabled={isValidating}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {t('checkout.validating')}
                      </>
                    ) : (
                      t('checkout.apply')
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Stripe Payment Form */}
            {activeClientSecret && (
              <Elements key={activeClientSecret} options={options} stripe={stripePromise}>
                <CheckoutForm
                  onSuccess={handleCheckoutSuccess}
                  onError={onError}
                  amount={activeAmount}
                  itemName={itemName}
                  originalPrice={activeOriginalPrice}
                  discountPercentage={activeDiscountPercentage}
                  appliedCoupon={appliedCoupon}
                  onCouponRemove={handleRemoveCoupon}
                />
              </Elements>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
