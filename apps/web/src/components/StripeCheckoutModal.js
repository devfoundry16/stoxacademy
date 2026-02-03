'use client';

import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import Modal from './admin/Modal';
import { useTranslations } from 'next-intl';
import { Tag, Loader2 } from 'lucide-react';
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
}) {
  const t = useTranslations();
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

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

  const options = {
    clientSecret,
    appearance,
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setIsValidating(true);
    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (onApplyCoupon) {
      onApplyCoupon(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('checkout.completePurchase')} size="lg">
      <div className="p-2 space-y-4">
        {/* Coupon Input Section - Only show if no coupon is applied */}
        {!appliedCoupon && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Have a coupon code?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
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
                    Validating...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Stripe Payment Form */}
        {clientSecret && (
          <Elements key={clientSecret} options={options} stripe={stripePromise}>
            <CheckoutForm
              onSuccess={onSuccess}
              onError={onError}
              amount={amount}
              itemName={itemName}
              originalPrice={originalPrice || amount}
              discountPercentage={discountPercentage || 0}
              appliedCoupon={appliedCoupon}
              onCouponRemove={handleRemoveCoupon}
            />
          </Elements>
        )}
      </div>
    </Modal>
  );
}
