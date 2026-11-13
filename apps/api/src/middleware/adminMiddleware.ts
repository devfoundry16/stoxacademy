import { Request, Response, NextFunction } from "express";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabase";

/**
 * Builds a middleware that verifies the bearer token and checks the user's role in the database.
 */
const requireRole = (roles: string[], deniedMessage: string) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({ error: "No token provided" });
            }

            // getClaims verifies the JWT locally against the project's cached JWKS (no network
            // round trip) when asymmetric signing keys are enabled; with a legacy HS256 secret it
            // falls back to getUser() on the Auth server.
            const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
            if (claimsError || !claimsData) {
                // Auth server unreachable is not an invalid token: a 401 here would log the user out
                if (isAuthRetryableFetchError(claimsError)) {
                    return res.status(503).json({ error: "Auth service unavailable" });
                }
                return res.status(401).json({ error: "Invalid token" });
            }
            const { sub: userId, email } = claimsData.claims;

            // Role from database (source of truth) so role changes take effect immediately
            const { data: dbUser, error: dbError } = await supabaseAdmin
                .from("users")
                .select("role")
                .eq("id", userId)
                .single();

            if (dbError || !dbUser) {
                return res.status(401).json({ error: "User not found in database" });
            }

            if (!roles.includes(dbUser.role)) {
                return res.status(403).json({ error: deniedMessage });
            }

            (req as any).user = { id: userId, email, role: dbUser.role };
            next();
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };

export const requireAdmin = requireRole(["admin"], "Access denied. Admin privileges required.");

export const requireAdminOrInstructor = requireRole(
    ["admin", "instructor"],
    "Access denied. Admin or instructor privileges required."
);
