# Stripe Payment Integration Setup Guide

## Overview

This project integrates Stripe for processing payments for both courses and live sessions. The integration uses Stripe Payment Intents with the Payment Element for a modern, customizable checkout experience.

## Installation

### Backend (API)

```bash
cd apps/api
pnpm add stripe
```

### Frontend (Web)

```bash
cd apps/web
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

## Configuration

### Backend Environment Variables

Add these to `apps/api/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SJbX1LKFkodhXbkwLRsxxp118ffAscoWDXZMGJxR3T0VYA7h1xDp2T6zwWCTBwM3qkpcbLYstVQYZ8VnaThtQGd00mCEiDK5B
STRIPE_PUBLISHABLE_KEY=pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Environment Variables

Add these to `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c
```

## Features Implemented

### Backend Features

1. **Payment Controller** (`apps/api/src/controllers/paymentController.ts`):
   - `createCoursePaymentIntent`: Creates a payment intent for course purchase
   - `confirmCoursePayment`: Confirms payment and creates enrollment
   - `createLiveSessionPaymentIntent`: Creates a payment intent for live session
   - `confirmLiveSessionPayment`: Confirms payment and creates enrollment
   - `handleStripeWebhook`: Handles Stripe webhook events

2. **Payment Routes** (`apps/api/src/routes/paymentRoutes.ts`):
   - POST `/api/payments/course/create-intent` - Create course payment intent
   - POST `/api/payments/course/confirm` - Confirm course payment
   - POST `/api/payments/live-session/create-intent` - Create session payment intent
   - POST `/api/payments/live-session/confirm` - Confirm session payment
   - POST `/api/payments/webhook` - Stripe webhook handler

3. **Security**:
   - All payment endpoints require authentication
   - Payment intents include metadata for verification
   - Duplicate purchase prevention
   - User verification before enrollment

### Frontend Features

1. **Stripe Components**:
   - `CheckoutForm.js`: Reusable payment form using Stripe Payment Element
   - `StripeCheckoutModal.js`: Modal wrapper for checkout with Stripe Elements

2. **Payment Service** (`apps/web/src/lib/paymentService.js`):
   - API methods for creating and confirming payments

3. **Integration**:
   - Course detail page: Stripe payment on purchase button
   - Live session detail page: Stripe payment on enrollment button
   - Beautiful checkout modal with payment element
   - Error handling and success callbacks

## Payment Flow

### Course Purchase Flow

1. User clicks "Purchase Course" button
2. Frontend calls `createCoursePaymentIntent` API
3. Backend creates Stripe Payment Intent and returns `clientSecret`
4. Frontend opens checkout modal with Stripe Payment Element
5. User enters payment details and submits
6. Stripe processes payment
7. Frontend calls `confirmCoursePayment` API with payment intent ID
8. Backend verifies payment with Stripe
9. Backend creates enrollment record in `user_courses` table
10. Backend increments course student count
11. User gains access to course

### Live Session Enrollment Flow

1. User clicks "Enroll Now" button
2. Frontend calls `createLiveSessionPaymentIntent` API
3. Backend creates Stripe Payment Intent and returns `clientSecret`
4. Frontend opens checkout modal with Stripe Payment Element
5. User enters payment details and submits
6. Stripe processes payment
7. Frontend calls `confirmLiveSessionPayment` API with payment intent ID
8. Backend verifies payment with Stripe
9. Backend creates enrollment record in `user_live_sessions` table
10. Backend increments session participants count
11. User can join the live session

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any 5-digit ZIP code.

### Testing the Integration

1. Start the backend server:
```bash
cd apps/api
pnpm dev
```

2. Start the frontend server:
```bash
cd apps/web
pnpm dev
```

3. Navigate to a course or live session detail page
4. Click the purchase/enroll button
5. Enter test card details in the Stripe payment form
6. Complete the payment
7. Verify enrollment in the database

## Webhook Setup (Production)

For production, set up Stripe webhooks:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret
5. Add to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Security Considerations

✅ All payment endpoints require authentication
✅ Payment verification happens on the backend
✅ User ownership verification before enrollment
✅ Duplicate purchase prevention
✅ Webhook signature verification
✅ HTTPS required in production

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payments/course/create-intent` | POST | Required | Create course payment intent |
| `/api/payments/course/confirm` | POST | Required | Confirm course payment |
| `/api/payments/live-session/create-intent` | POST | Required | Create session payment intent |
| `/api/payments/live-session/confirm` | POST | Required | Confirm session payment |
| `/api/payments/webhook` | POST | No | Stripe webhook handler |

## Troubleshooting

### Common Issues

1. **"No such payment_intent" error**:
   - Ensure `clientSecret` is correctly passed to the Payment Element
   - Check that the payment intent ID matches

2. **"Invalid API key" error**:
   - Verify environment variables are set correctly
   - Ensure you're using the correct key for test/production

3. **Payment not confirming**:
   - Check browser console for errors
   - Verify webhook endpoint is accessible (production)
   - Check Stripe Dashboard logs

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Payment Element Guide](https://stripe.com/docs/payments/payment-element)
- [Stripe Test Cards](https://stripe.com/docs/testing)

## Notes

- Currently using **test mode** keys
- Switch to production keys when deploying to production
- Monitor Stripe Dashboard for payment activity
- Set up proper error handling and logging in production
