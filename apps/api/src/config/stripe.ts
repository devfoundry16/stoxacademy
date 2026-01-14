import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Using the latest API version supported by the Stripe package
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
