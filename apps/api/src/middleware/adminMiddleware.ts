import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";

/**
 * Middleware to verify that the authenticated user has admin role
 * Must be used after authentication middleware
 */
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Verify the token and get user
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Check role from database (source of truth) instead of user_metadata
        // This ensures role changes in the database are immediately effective
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", userData.user.id)
            .single();

        if (dbError || !dbUser) {
            return res.status(401).json({ error: "User not found in database" });
        }

        // Check if user has admin role
        if (dbUser.role !== "admin") {
            return res.status(403).json({
                error: "Access denied. Admin privileges required."
            });
        }

        // Attach user info to request for use in controllers
        (req as any).user = {
            id: userData.user.id,
            email: userData.user.email,
            role: dbUser.role,
        };

        next();
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Middleware to verify that the authenticated user has admin or instructor role
 */
export const requireAdminOrInstructor = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !userData.user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // Check role from database (source of truth) instead of user_metadata
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", userData.user.id)
            .single();

        if (dbError || !dbUser) {
            return res.status(401).json({ error: "User not found in database" });
        }

        const userRole = dbUser.role;

        if (userRole !== "admin" && userRole !== "instructor") {
            return res.status(403).json({
                error: "Access denied. Admin or instructor privileges required."
            });
        }

        (req as any).user = {
            id: userData.user.id,
            email: userData.user.email,
            role: userRole,
        };

        next();
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

