import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c'
);

export default stripePromise;

// The /funnel course checkout uses a separate Stripe account; falls back to the main one until its key is set.
export const funnelStripePromise = process.env.NEXT_PUBLIC_STRIPE_FUNNEL_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_FUNNEL_PUBLISHABLE_KEY)
  : stripePromise;
