import { Request, Response, NextFunction } from "express";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabase";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      // Auth server unreachable is not an invalid token: a 401 here makes the frontend sign the user out
      if (isAuthRetryableFetchError(error)) {
        return res.status(503).json({ error: "Auth service unavailable" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token verification failed" });
  }
};

