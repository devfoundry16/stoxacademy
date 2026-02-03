'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Loader2, Tag, X } from 'lucide-react';

export default function CheckoutForm({
  onSuccess,
  onError,
  amount,
  itemName,
  originalPrice,
  discountPercentage,
  appliedCoupon,
  onCouponRemove
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      if (onError) onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setIsLoading(false);
      if (onSuccess) onSuccess(paymentIntent);
    } else {
      setMessage('Payment processing. Please wait...');
      setIsLoading(false);
    }
  };

  const hasDiscount = discountPercentage > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Applied Coupon Badge */}
      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="text-green-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Coupon Applied: {appliedCoupon}
              </p>
              <p className="text-xs text-green-600">
                {discountPercentage}% discount
              </p>
            </div>
          </div>
          {onCouponRemove && (
            <button
              type="button"
              onClick={onCouponRemove}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Remove coupon"
            >
              <X size={18} className="text-green-600" />
            </button>
          )}
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        {hasDiscount && (
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-blue-200">
            <span className="text-sm text-gray-600">Original Price:</span>
            <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
          </div>
        )}
        {hasDiscount && (
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-blue-200">
            <span className="text-sm text-green-600 font-medium">Discount ({discountPercentage}%):</span>
            <span className="text-sm text-green-600 font-medium">-${(originalPrice - amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Amount:</span>
          <span className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{itemName}</p>
      </div>

      <PaymentElement id="payment-element" />

      {message && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {message}
        </div>
      )}

      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secured by Stripe. Your payment information is encrypted and secure.
      </p>
    </form>
  );
}
