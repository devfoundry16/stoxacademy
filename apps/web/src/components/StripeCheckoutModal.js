'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import Modal from './admin/Modal';

export default function StripeCheckoutModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  itemName,
  onSuccess,
  onError,
}) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Purchase">
      <div className="p-2">
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              onSuccess={onSuccess}
              onError={onError}
              amount={amount}
              itemName={itemName}
            />
          </Elements>
        )}
      </div>
    </Modal>
  );
}
