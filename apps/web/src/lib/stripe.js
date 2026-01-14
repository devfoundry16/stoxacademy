import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c'
);

export default stripePromise;
