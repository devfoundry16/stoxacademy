import { Request, Response } from "express";
import { supabaseAdmin, getSupabaseClient, getSupabaseServerClient } from "../config/supabase";

export const signUpWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, age, country } =
      req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          age,
          country,
          role: "student",
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Store user data in database table
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        age: age ? parseInt(age) : null,
        country: country || null,
        role: "student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      // If database insert fails, try to delete the auth user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({
        error: `Failed to create user profile: ${dbError.message}`
      });
    }

    // Sign in the user to get session tokens
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return res.status(400).json({ error: signInError.message });
    }

    return res.status(201).json({
      user: authData.user,
      session: signInData.session,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signInWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signInWithGoogle = async (req: Request, res: Response) => {
  try {
    // Use regular client with anon key for OAuth flows, not service role
    const supabase = getSupabaseServerClient(req, res);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ url: data.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "No code provided" });
    }

    // Use regular client with anon key for OAuth callback, not service role
    const supabase = getSupabaseServerClient(req, res);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if user profile exists in database, if not create it
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!existingUser) {
      // Extract user data from OAuth metadata
      const userMetadata = data.user.user_metadata || {};
      const firstName = userMetadata.full_name?.split(" ")[0] || userMetadata.first_name || "";
      const lastName = userMetadata.full_name?.split(" ").slice(1).join(" ") || userMetadata.last_name || "";

      // Create user profile in database
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email || "",
          first_name: firstName,
          last_name: lastName,
          phone_number: null,
          age: null,
          country: null,
          role: "student",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Failed to create user profile:", dbError);
        // Continue anyway - user is authenticated but profile creation failed
      }
    }

    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Signed out successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(200).json({ user: data.user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

