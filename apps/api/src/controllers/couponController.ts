import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { randomUUID } from "crypto";

// ==================== Admin Coupon Management ====================

export const getAllCoupons = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin
            .from("coupons")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false });

        // Apply search filter
        if (search) {
            query = query.ilike("code", `%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + Number(limit) - 1);

        const { data: coupons, error, count } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({
            coupons,
            pagination: {
                total: count || 0,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil((count || 0) / Number(limit)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getCouponById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: coupon, error } = await supabaseAdmin
            .from("coupons")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        return res.status(200).json({ coupon });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, percentage, usage_limit, is_active = true } = req.body;

        if (!code || !percentage) {
            return res.status(400).json({ error: "Missing required fields: code, percentage" });
        }

        // Validate percentage
        if (percentage < 1 || percentage > 100) {
            return res.status(400).json({ error: "Percentage must be between 1 and 100" });
        }

        // Convert code to uppercase for consistency
        const upperCode = code.toUpperCase().trim();

        // Check if code already exists
        const { data: existing } = await supabaseAdmin
            .from("coupons")
            .select("id")
            .eq("code", upperCode)
            .single();

        if (existing) {
            return res.status(400).json({ error: "Coupon code already exists" });
        }

        const { data: coupon, error } = await supabaseAdmin
            .from("coupons")
            .insert({
                id: randomUUID(),
                code: upperCode,
                percentage: Number(percentage),
                usage_limit: usage_limit ? Number(usage_limit) : null,
                is_active,
                usage_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ coupon });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, percentage, usage_limit, is_active } = req.body;

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (code !== undefined) {
            const upperCode = code.toUpperCase().trim();

            // Check if new code conflicts with existing coupon
            const { data: existing } = await supabaseAdmin
                .from("coupons")
                .select("id")
                .eq("code", upperCode)
                .neq("id", id)
                .single();

            if (existing) {
                return res.status(400).json({ error: "Coupon code already exists" });
            }

            updateData.code = upperCode;
        }

        if (percentage !== undefined) {
            if (percentage < 1 || percentage > 100) {
                return res.status(400).json({ error: "Percentage must be between 1 and 100" });
            }
            updateData.percentage = Number(percentage);
        }

        if (usage_limit !== undefined) {
            updateData.usage_limit = usage_limit ? Number(usage_limit) : null;
        }

        if (is_active !== undefined) {
            updateData.is_active = is_active;
        }

        const { data: coupon, error } = await supabaseAdmin
            .from("coupons")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ coupon });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("coupons")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const toggleCouponStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get current status
        const { data: coupon, error: fetchError } = await supabaseAdmin
            .from("coupons")
            .select("is_active")
            .eq("id", id)
            .single();

        if (fetchError || !coupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        // Toggle status
        const { data: updatedCoupon, error } = await supabaseAdmin
            .from("coupons")
            .update({
                is_active: !coupon.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ coupon: updatedCoupon });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// ==================== User Coupon Validation ====================

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({ error: "Coupon code is required" });
        }

        const upperCode = code.toUpperCase().trim();

        const { data: coupon, error } = await supabaseAdmin
            .from("coupons")
            .select("*")
            .eq("code", upperCode)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ error: "Invalid coupon code" });
        }

        // Check if coupon is active
        if (!coupon.is_active) {
            return res.status(400).json({ error: "This coupon is not active" });
        }

        // Check if usage limit reached
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ error: "This coupon has reached its usage limit" });
        }

        return res.status(200).json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                percentage: coupon.percentage,
            },
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const incrementCouponUsage = async (couponCode: string) => {
    try {
        const upperCode = couponCode.toUpperCase().trim();

        const { data: coupon, error: fetchError } = await supabaseAdmin
            .from("coupons")
            .select("id, usage_count")
            .eq("code", upperCode)
            .single();

        if (fetchError || !coupon) {
            console.error("Coupon not found for usage increment:", upperCode);
            return;
        }

        const { error } = await supabaseAdmin
            .from("coupons")
            .update({
                usage_count: coupon.usage_count + 1,
                updated_at: new Date().toISOString(),
            })
            .eq("id", coupon.id);

        if (error) {
            console.error("Error incrementing coupon usage:", error);
        }
    } catch (error: any) {
        console.error("Error in incrementCouponUsage:", error);
    }
};
