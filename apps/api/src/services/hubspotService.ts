/**
 * HubSpot lead sync
 *
 * Upserts website leads into HubSpot as contacts (matched by email).
 * No-op until HUBSPOT_ACCESS_TOKEN (a HubSpot service key) is set.
 * syncLeadToHubSpot never throws: a HubSpot failure must not break registration.
 * Always await it: on Vercel the function is frozen once the response is sent,
 * so a fire-and-forget call never reaches HubSpot.
 */

const HUBSPOT_API = "https://api.hubapi.com";

export type LeadSource = "webinar" | "checklist" | "signup" | "purchase" | "live_session";
export type ContactProperties = Record<string, string>;

export interface Lead {
    email: string;
    source: LeadSource;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    phone?: string | null;
    country?: string | null;
    checklistScore?: number | null;
    checklistStage?: string | null;
    lastPurchase?: string | null;
}

const yesNo = [
    { label: "Yes", value: "true", displayOrder: 0 },
    { label: "No", value: "false", displayOrder: 1 },
];

// Custom contact properties that tag a contact as a Stox Academy lead.
// One flag per source, only ever set to true, so a later source never erases an earlier one.
const CUSTOM_PROPERTIES = [
    { name: "stox_lead_source", label: "Stox latest lead source", type: "string", fieldType: "text" },
    { name: "stox_webinar_lead", label: "Stox webinar registrant", type: "bool", fieldType: "booleancheckbox", options: yesNo },
    { name: "stox_checklist_lead", label: "Stox checklist taker", type: "bool", fieldType: "booleancheckbox", options: yesNo },
    { name: "stox_signup_lead", label: "Stox account signup", type: "bool", fieldType: "booleancheckbox", options: yesNo },
    { name: "stox_purchase_lead", label: "Stox paying customer", type: "bool", fieldType: "booleancheckbox", options: yesNo },
    { name: "stox_live_session_lead", label: "Stox live session booker", type: "bool", fieldType: "booleancheckbox", options: yesNo },
    { name: "stox_last_purchase", label: "Stox latest purchase/booking", type: "string", fieldType: "text" },
    { name: "stox_checklist_score", label: "Stox checklist score", type: "number", fieldType: "number" },
    { name: "stox_checklist_stage", label: "Stox checklist stage", type: "string", fieldType: "text" },
];

let warnedMissingToken = false;
let propertiesReady: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST with a retry on 429 (rate limit), which a bulk backfill can hit.
const hubspotPost = async (token: string, path: string, body: unknown, attempt = 0): Promise<Response> => {
    const res = await fetch(`${HUBSPOT_API}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000), // a slow HubSpot must not hang the user's request
    });
    if (res.status === 429 && attempt < 5) {
        await sleep(1000 * 2 ** attempt);
        return hubspotPost(token, path, body, attempt + 1);
    }
    return res;
};

// Creates the custom properties once per process; 409 means it already exists.
export const ensureProperties = (token: string) =>
    (propertiesReady ??= (async () => {
        // Parallel: this runs on every cold start, inside the user's request.
        await Promise.all(
            CUSTOM_PROPERTIES.map(async (p) => {
                const res = await hubspotPost(token, "/crm/v3/properties/contacts", {
                    ...p,
                    groupName: "contactinformation",
                });
                if (!res.ok && res.status !== 409) {
                    throw new Error(`create property ${p.name}: ${res.status} ${await res.text()}`);
                }
            })
        );
    })().catch((err) => {
        propertiesReady = null; // retry on the next lead
        throw err;
    }));

export const toContactProperties = (lead: Lead): ContactProperties => {
    const [first, ...rest] = (lead.fullName ?? "").trim().split(/\s+/);
    const props: Record<string, unknown> = {
        email: lead.email.toLowerCase().trim(),
        firstname: lead.firstName ?? first,
        lastname: lead.lastName ?? rest.join(" "),
        phone: lead.phone,
        country: lead.country,
        stox_lead_source: lead.source,
        [`stox_${lead.source}_lead`]: true,
        stox_checklist_score: lead.checklistScore,
        stox_checklist_stage: lead.checklistStage,
        stox_last_purchase: lead.lastPurchase,
    };
    // Drop empty values so an upsert never blanks out data HubSpot already has.
    return Object.fromEntries(
        Object.entries(props)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => [k, String(v)])
    );
};

// Upserts up to 100 contacts (HubSpot's batch limit). Emails must be unique within the batch.
export const upsertContacts = (token: string, contacts: ContactProperties[]) =>
    hubspotPost(token, "/crm/v3/objects/contacts/batch/upsert", {
        inputs: contacts.map((properties) => ({ idProperty: "email", id: properties.email, properties })),
    });

export const syncLeadToHubSpot = async (lead: Lead): Promise<void> => {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
        if (!warnedMissingToken) {
            console.warn("HUBSPOT_ACCESS_TOKEN not set; skipping HubSpot lead sync");
            warnedMissingToken = true;
        }
        return;
    }

    try {
        await ensureProperties(token);
        const res = await upsertContacts(token, [toContactProperties(lead)]);
        if (!res.ok) {
            console.error("HubSpot upsert failed:", res.status, await res.text());
        }
    } catch (error) {
        console.error("HubSpot lead sync error:", error);
    }
};
