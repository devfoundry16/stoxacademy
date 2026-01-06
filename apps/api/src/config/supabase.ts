import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { Request, Response } from "express"; // Ensure this is 'express'
import dotenv from "dotenv";
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const getSupabaseClient = (accessToken?: string) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: "",
    });
  }

  return client;
};


export const getSupabaseServerClient = (req: Request, res: Response) => {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name],
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookie(name, value, {
              ...options,
              httpOnly: true,
              secure: true,          // REQUIRED for HTTPS
              sameSite: "none",      // REQUIRED for cross-site
              path: "/",
            });
          });
        },
      },
    }
  );
};