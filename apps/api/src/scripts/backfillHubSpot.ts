/**
 * One-off backfill: sends existing leads from Supabase to HubSpot.
 *
 * Dry run by default (reads Supabase only, writes nothing anywhere):
 *   pnpm backfill:hubspot
 * Actually upsert into HubSpot:
 *   pnpm backfill:hubspot --apply
 *
 * Safe to re-run: contacts are upserted by email, so nothing is duplicated.
 * Never writes to Supabase.
 */
import { supabaseAdmin } from "../config/supabase";
import {
    ContactProperties,
    Lead,
    ensureProperties,
    toContactProperties,
    upsertContacts,
} from "../services/hubspotService";

const APPLY = process.argv.includes("--apply");
const PAGE = 1000;
const BATCH = 100; // HubSpot batch upsert limit

type Row = Record<string, any>;

const fetchAll = async (table: string, columns: string, onlyStudents = false): Promise<Row[]> => {
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
        let query = supabaseAdmin.from(table).select(columns).order("created_at").range(from, from + PAGE - 1);
        if (onlyStudents) query = query.eq("role", "student");
        const { data, error } = await query;
        if (error) throw new Error(`read ${table}: ${error.message}`);
        rows.push(...((data ?? []) as unknown as Row[]));
        if (!data || data.length < PAGE) return rows;
    }
};

// Merges every lead row into one contact per email, oldest first, so the latest
// source/name wins while per-source flags and the checklist score accumulate.
export const mergeLeads = (leads: { lead: Lead; at: string }[]): ContactProperties[] => {
    const byEmail = new Map<string, ContactProperties>();
    for (const { lead } of [...leads].sort((a, b) => a.at.localeCompare(b.at))) {
        if (!lead.email?.trim()) continue;
        const props = toContactProperties(lead);
        byEmail.set(props.email, { ...byEmail.get(props.email), ...props });
    }
    return [...byEmail.values()];
};

const main = async () => {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (APPLY && !token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");

    const [webinar, checklist, users] = await Promise.all([
        fetchAll("webinar_registrations", "email, full_name, phone_number, country, created_at"),
        fetchAll("checklist_responses", "email, full_name, phone_number, country, score, stage, created_at"),
        fetchAll("users", "email, first_name, last_name, phone_number, country, created_at", true),
    ]);

    const at = (r: Row) => r.created_at ?? "";
    const contacts = mergeLeads([
        ...webinar.map((r) => ({ at: at(r), lead: { email: r.email, fullName: r.full_name, phone: r.phone_number, country: r.country, source: "webinar" as const } })),
        ...checklist.map((r) => ({ at: at(r), lead: { email: r.email, fullName: r.full_name, phone: r.phone_number, country: r.country, checklistScore: r.score, checklistStage: r.stage, source: "checklist" as const } })),
        ...users.map((r) => ({ at: at(r), lead: { email: r.email, firstName: r.first_name, lastName: r.last_name, phone: r.phone_number, country: r.country, source: "signup" as const } })),
    ]);

    console.log(`Read ${webinar.length} webinar, ${checklist.length} checklist, ${users.length} student rows`);
    console.log(`→ ${contacts.length} unique contacts to upsert`);

    if (!APPLY) {
        console.log("Dry run: nothing sent. Re-run with --apply to upsert into HubSpot.");
        return;
    }

    await ensureProperties(token!);

    let ok = 0;
    const failed: string[] = [];
    for (let i = 0; i < contacts.length; i += BATCH) {
        const batch = contacts.slice(i, i + BATCH);
        const res = await upsertContacts(token!, batch);
        if (res.ok) {
            ok += batch.length;
        } else {
            // One bad contact (e.g. invalid email) fails the whole batch: retry one by one.
            console.warn(`Batch ${i / BATCH + 1} failed (${res.status}), retrying individually`);
            for (const c of batch) {
                const single = await upsertContacts(token!, [c]);
                if (single.ok) ok++;
                else {
                    failed.push(c.email);
                    console.error(`  ${c.email}: ${single.status} ${await single.text()}`);
                }
            }
        }
        console.log(`Progress: ${Math.min(i + BATCH, contacts.length)}/${contacts.length}`);
    }

    console.log(`Done: ${ok} upserted, ${failed.length} failed`);
    if (failed.length) process.exitCode = 1;
};

if (require.main === module) {
    main().catch((err) => {
        console.error("Backfill aborted:", err);
        process.exit(1);
    });
}
