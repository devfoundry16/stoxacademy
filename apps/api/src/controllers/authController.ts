import { Request, Response } from "express";
import { supabaseAdmin, supabaseClient } from "../config/supabase";
import { jwtDecode } from "jwt-decode";

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
    // Use admin client to sign in and get session
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
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        // queryParams: {
        //   access_type: 'offline',
        //   prompt: 'consent',
        // },
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

    // For OAuth callback, we need to create a client with anon key
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);

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
    // Try to validate token, but don't fail if it's invalid
    // After password changes, tokens might be temporarily invalid
    // Signout is safe to allow even with invalid tokens since client clears session
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      // Try to verify token, but don't fail if invalid
      try {
        await supabaseAdmin.auth.getUser(token);
      } catch (error) {
        // Token is invalid, but that's okay for signout
        // Client-side signout will clear the session anyway
      }
    }

    // Always return success - the actual session clearing happens on the client side
    return res.status(200).json({ message: "Signed out successfully" });
  } catch (error: any) {
    // Even if there's an error, return success since client will handle signout
    return res.status(200).json({ message: "Signed out successfully" });
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    
    
    if (authError || !authData.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    let { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, phone_number, age, country, role, created_at, updated_at")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const identities = authData.user.identities || [];
    const googleIdentity = identities.find((identity: any) => identity.provider === "google");
    const hasPassword = identities.some((identity: any) => identity.provider === "email");
    const isGoogleUser = !!googleIdentity && !hasPassword;

    return res.status(200).json({ 
      profile: {
        ...profile,
        isGoogleUser,
        hasPassword,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { firstName, lastName, phoneNumber, age, country } = req.body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phoneNumber !== undefined) updates.phone_number = phoneNumber || null;
    if (age !== undefined) updates.age = age === "" || age == null ? null : parseInt(age, 10);
    if (country !== undefined) updates.country = country || null;

    const { data: profile, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", authData.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(200).json({ profile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters",
      });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user?.email) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user has a password (signed in with email) or not (signed in with Google)
    const identities = authData.user.identities || [];
    const isGoogleUser = identities.some((identity: any) => identity.provider === "google");
    const hasPassword = identities.some((identity: any) => identity.provider === "email");

    // If user has a password (email sign-in), require current password
    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "Current password is required to change your password",
        });
      }

      // Verify current password
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: authData.user.email,
        password: currentPassword,
      });

      if (signInError) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }
    // If user is Google-only (no password), allow setting password without current password

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    const message = hasPassword 
      ? "Password updated successfully" 
      : "Password set successfully. You can now sign in with email and password.";

    return res.status(200).json({ message });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

