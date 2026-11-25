import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Using the latest API version supported by the Stripe package
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// The /funnel course checkout charges a separate Stripe account; falls back to the main one until its key is set.
export const funnelStripe = process.env.STRIPE_FUNNEL_SECRET_KEY ? new Stripe(process.env.STRIPE_FUNNEL_SECRET_KEY) : stripe;
