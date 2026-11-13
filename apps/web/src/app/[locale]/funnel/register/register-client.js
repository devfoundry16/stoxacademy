"use client";

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@/lib/stripe";
import { paymentService } from "@/lib/paymentService";
import CheckoutForm from "@/components/CheckoutForm";
import { FIELDS, forms } from "../content";
import { FormShell, Field, SubmitButton, Notice } from "../form-shell";

// Id of the Gold & Forex course row (price 950) in the `courses` table.
const COURSE_ID = process.env.NEXT_PUBLIC_FUNNEL_COURSE_ID;

export default function RegisterClient() {
  const f = forms.register;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [intent, setIntent] = useState(null); // { clientSecret, guestToken, finalPrice }
  const [paid, setPaid] = useState(false);

  const startPayment = async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const [firstName, ...rest] = d.get("fullName").trim().split(/\s+/);
    setBusy(true);
    setError(null);
    try {
      setIntent(
        await paymentService.createGuestCoursePaymentIntent(COURSE_ID, d.get("email").trim(), firstName, rest.join(" "), null, d.get("phone").trim()),
      );
    } catch (err) {
      setError(err?.response?.data?.error || forms.error);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (paymentIntent) => {
    try {
      await paymentService.confirmGuestCoursePayment(paymentIntent.id, intent.guestToken);
      setPaid(true);
    } catch (err) {
      setError(err?.response?.data?.error || forms.error);
    }
  };

  return (
    <FormShell title={f.title} subtitle={f.subtitle}>
      {paid ? (
        <Notice>{f.success}</Notice>
      ) : intent ? (
        <div className="rounded-2xl bg-white p-5 text-gray-900" dir="ltr">
          <Elements key={intent.clientSecret} options={{ clientSecret: intent.clientSecret }} stripe={stripePromise}>
            <CheckoutForm onSuccess={confirm} onError={() => {}} amount={parseFloat(intent.finalPrice)} itemName="Gold & Forex" originalPrice={parseFloat(intent.originalPrice)} discountPercentage={0} />
          </Elements>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <form onSubmit={startPayment} className="space-y-5">
          <Field label={FIELDS.fullName} name="fullName" autoComplete="name" />
          <Field label={FIELDS.email} name="email" type="email" autoComplete="email" dir="ltr" />
          <Field label={FIELDS.phone} name="phone" type="tel" autoComplete="tel" dir="ltr" />
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy}>{f.submit}</SubmitButton>
        </form>
      )}
    </FormShell>
  );
}
