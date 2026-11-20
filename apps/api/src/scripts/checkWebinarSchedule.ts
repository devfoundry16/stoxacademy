/**
 * Self-check for the webinar countdown schedule. Run: pnpm check:webinar
 */
import assert from "node:assert/strict";
import { atJerusalemTime, planWebinarNotifications as planFor } from "../services/webinarNotificationService";
import { arabicDaysLeft, renderWebinarEmail, webinarLabels, whatsappParams } from "../templates/webinarTemplates";
import { sendWhatsAppTemplate, toWhatsAppNumber } from "../services/whatsappService";

// Webinar is 2 Dec 2026, 17:00 Jerusalem (UTC+2 in winter) = 15:00 UTC.
const start = new Date("2026-12-02T15:00:00Z");
const webinar = { id: "48d99176-77c2-4965-8774-d8c19685a72f", startsAt: start };
const planWebinarNotifications = (at: Date) => planFor(at, start);
const render = (key: string, name: string) => renderWebinarEmail(key, name, webinar)!;

const keys = (at: Date, channel: string) =>
    planWebinarNotifications(at).filter((n) => n.channel === channel).map((n) => n.templateKey);

assert.equal(atJerusalemTime("2026-12-02", 17).toISOString(), start.toISOString());
assert.equal(atJerusalemTime("2026-07-01", 9).toISOString(), "2026-07-01T06:00:00.000Z"); // summer time UTC+3

// PM's example: registering with 12 days left → tomorrow's email is the "11 days left" one (countdown_3).
const nov20 = atJerusalemTime("2026-11-20", 14);
const plan = planWebinarNotifications(nov20);
const emails = plan.filter((n) => n.channel === "email");
assert.deepEqual(emails.map((n) => n.templateKey), [
    "confirmation",
    ...Array.from({ length: 12 }, (_, i) => `countdown_${i + 3}`),
    "reminder_1h",
    "post_webinar",
]);
assert.equal(emails[1].scheduledFor.toISOString(), "2026-11-21T07:00:00.000Z"); // 9:00 Jerusalem next day
assert.equal(emails[12].scheduledFor.toISOString(), "2026-12-02T07:00:00.000Z"); // countdown_14 on webinar morning
assert.equal(emails[13].scheduledFor.toISOString(), "2026-12-02T14:00:00.000Z"); // 1 hour before
assert.equal(emails[14].scheduledFor.toISOString(), "2026-12-02T17:00:00.000Z"); // post_webinar: 17:00 + 60 min + 1h = 19:00 Jerusalem
assert.equal(planFor(nov20, start, 90).slice(-1)[0].scheduledFor.toISOString(), "2026-12-02T17:30:00.000Z"); // follows the session's duration
// Copy not written yet → render returns null and the sender marks it skipped (never sends placeholder text).
assert.equal(renderWebinarEmail("post_webinar", "A", webinar), null);
assert.deepEqual(keys(nov20, "whatsapp"), ["confirmation", "reminder_10d", "reminder_8d", "reminder_6d", "reminder_4d", "reminder_2d", "reminder_1h"]);

// PM's question: registering 4 days before (28 Nov) → only emails 11–14, one per day, then the 1-hour reminder.
const nov28 = planWebinarNotifications(atJerusalemTime("2026-11-28", 14)).filter((n) => n.channel === "email");
assert.deepEqual(
    nov28.map((n) => [n.templateKey, n.scheduledFor.toISOString()]),
    [
        ["confirmation", atJerusalemTime("2026-11-28", 14).toISOString()],
        ["countdown_11", "2026-11-29T07:00:00.000Z"], // باقي 3 أيام
        ["countdown_12", "2026-11-30T07:00:00.000Z"], // باقي يومان
        ["countdown_13", "2026-12-01T07:00:00.000Z"], // باقي يوم واحد
        ["countdown_14", "2026-12-02T07:00:00.000Z"], // webinar morning
        ["reminder_1h", "2026-12-02T14:00:00.000Z"],
        ["post_webinar", "2026-12-02T17:00:00.000Z"],
    ]
);
assert.ok(render("countdown_11", "A").html.includes("باقي 3 أيام"));

// Registering 20 days early: all 14 emails, starting 13 days before.
assert.equal(keys(atJerusalemTime("2026-11-12", 10), "email").filter((k) => k.startsWith("countdown_")).length, 14);

// Registering at 10:00 on 22 Nov (10 days before): that day's 9:00 WhatsApp reminder already passed.
assert.equal(keys(atJerusalemTime("2026-11-22", 10), "whatsapp")[1], "reminder_8d");

// Registering on webinar day: confirmation + 1h reminder only; after the start: nothing.
assert.deepEqual(keys(atJerusalemTime("2026-12-02", 12), "email"), ["confirmation", "reminder_1h", "post_webinar"]);
assert.deepEqual(planWebinarNotifications(atJerusalemTime("2026-12-02", 18)), []);

// Countdown text and Arabic counting.
assert.equal(arabicDaysLeft(1), "يوم واحد");
assert.equal(arabicDaysLeft(2), "يومان");
assert.equal(arabicDaysLeft(10), "10 أيام");
assert.equal(arabicDaysLeft(11), "11 يومًا");
const email3 = render("countdown_3", "<Ali>");
assert.ok(email3.html.includes("باقي 11 يومًا"));
assert.ok(email3.html.includes("&lt;Ali&gt;") && !email3.html.includes("<Ali>"));
assert.ok(!render("countdown_14", "Ali").html.includes("{"));
for (let n = 1; n <= 13; n++) assert.ok(!render(`countdown_${n}`, "A").html.includes("{left}"), `countdown_${n}`);

// Date, time and link come from the live session.
assert.deepEqual(webinarLabels(start), { date: "2 ديسمبر 2026", time: "5:00 مساءً بتوقيت القدس" });
assert.deepEqual(webinarLabels(new Date("2027-06-15T07:30:00Z")), { date: "15 يونيو 2027", time: "10:30 صباحًا بتوقيت القدس" });
assert.ok(email3.html.includes("/en/live-sessions/48d99176-77c2-4965-8774-d8c19685a72f"));
assert.ok(email3.html.includes("2 ديسمبر 2026"));

assert.ok(render("confirmation", "A").html.includes("\u200E+972528268954\u200E")); // "+" stays before digits in RTL

// WhatsApp params follow token order; numbers need a country code.
assert.deepEqual(whatsappParams("reminder_4d", "Ali", webinar).params.length, 3); // no name in message 4
assert.equal(whatsappParams("reminder_2d", "Ali", webinar).params[0], "Ali");
assert.equal(toWhatsAppNumber("+972 52-826-8954"), "972528268954");
assert.equal(toWhatsAppNumber("00962791234567"), "962791234567");
assert.equal(toWhatsAppNumber("0528268954"), null);

(async () => {
    // Without keys, WhatsApp is skipped instead of failing.
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    assert.deepEqual(await sendWhatsAppTemplate("+972528268954", "webinar_confirmation", []), {
        success: false,
        skipped: true,
        error: "WhatsApp not configured",
    });
    console.log("webinar schedule checks passed");
})();
