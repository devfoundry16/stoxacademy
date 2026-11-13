"use client";

import { Link } from "@/i18n/routing";
import { forms } from "./content";

export function FormShell({ title, subtitle, children }) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#07090d] px-4 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-lg">
        <Link href="/funnel" className="mb-8 inline-block text-sm text-white/60 hover:text-[#f5c451]">{forms.back}</Link>
        <h1 className="mb-3 text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mb-8 text-white/60">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/80">{label}</span>
      <input
        required
        {...props}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#f5c451]"
      />
    </label>
  );
}

export function SubmitButton({ busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-full bg-[#f5c451] px-8 py-4 text-lg font-bold text-black shadow-[0_0_40px_-8px_#f5c451] transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Notice({ tone = "ok", children }) {
  const cls = tone === "ok" ? "border-[#f5c451]/40 bg-[#f5c451]/10 text-[#f5c451]" : "border-red-500/40 bg-red-500/10 text-red-300";
  return <p role={tone === "ok" ? "status" : "alert"} className={`rounded-xl border p-4 ${cls}`}>{children}</p>;
}
