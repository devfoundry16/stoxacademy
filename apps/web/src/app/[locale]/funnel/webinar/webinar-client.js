"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import apiClient from "@/lib/api";
import { countries } from "@/lib/countries";
import { FIELDS, forms } from "../content";
import { FormShell, Field, SubmitButton, Notice } from "../form-shell";

// TODO: WhatsApp number verification (OTP) once the sender number is provided.
export default function WebinarClient() {
  const f = forms.webinar;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    setBusy(true);
    setError(null);
    try {
      await apiClient.post("/api/funnel/webinar-registrations", d);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || forms.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormShell title={f.title} subtitle={f.subtitle}>
      {done ? (
        <Notice>{f.success}</Notice>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field label={FIELDS.fullName} name="fullName" autoComplete="name" />
          <Field label={FIELDS.email} name="email" type="email" autoComplete="email" dir="ltr" />
          <Field label={FIELDS.phone} name="phone" type="tel" autoComplete="tel" dir="ltr" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/80">{FIELDS.country}</span>
            <div className="relative">
            <select required name="country" defaultValue="" className="w-full appearance-none rounded-xl border border-white/15 bg-[#0d1017] py-3 pe-4 ps-12 text-white outline-none focus:border-[#f5c451]">
              <option value="" />
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-white/60" />
            </div>
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton busy={busy}>{f.submit}</SubmitButton>
        </form>
      )}
    </FormShell>
  );
}
