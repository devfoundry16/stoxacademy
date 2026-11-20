/**
 * WhatsApp sending via Meta's WhatsApp Cloud API (approved templates only).
 * Without WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID it sends nothing and reports `skipped`,
 * so the webinar flow keeps going with emails only.
 */

const GRAPH_URL = "https://graph.facebook.com/v21.0";

export function isWhatsAppConfigured(): boolean {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Meta wants the international number as digits only. Returns null when the country code is missing. */
export function toWhatsAppNumber(phone: string): string | null {
    let digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    // shortcut: a local number like 05x… has no country code; we don't map the form's country to a dial code yet.
    if (!digits || digits.startsWith("0") || digits.length < 8) return null;
    return digits;
}

export async function sendWhatsAppTemplate(
    phone: string,
    templateName: string,
    params: string[],
    language = "ar"
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
    if (!isWhatsAppConfigured()) return { success: false, skipped: true, error: "WhatsApp not configured" };

    const to = toWhatsAppNumber(phone);
    if (!to) return { success: false, error: `Phone number has no country code: ${phone}` };

    try {
        const response = await fetch(`${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: language },
                    components: params.length
                        ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }]
                        : [],
                },
            }),
        });
        if (!response.ok) {
            const data: any = await response.json().catch(() => ({}));
            return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Unknown error" };
    }
}
