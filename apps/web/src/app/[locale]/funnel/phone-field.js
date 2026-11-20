"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

// "IL" -> 🇮🇱 (regional indicator letters)
const flag = (code) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** Searchable country dial-code picker + number input. Submits the full international number (E.164, e.g. +972528268954) as `name`. */
export function PhoneField({ label, name, invalidMessage }) {
  // Built in the browser only: server and browser translate/sort country names differently (hydration mismatch).
  const [options, setOptions] = useState([]);
  useEffect(() => {
    const ar = new Intl.DisplayNames(["ar"], { type: "region" });
    const en = new Intl.DisplayNames(["en"], { type: "region" });
    setOptions(
      getCountries()
        .map((code) => ({ code, label: ar.of(code) || code, en: en.of(code) || code, dial: getCountryCallingCode(code) }))
        .sort((a, b) => a.label.localeCompare(b.label, "ar"))
    );
  }, []);

  const [country, setCountry] = useState(null); // option object
  const [query, setQuery] = useState("");
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);

  const q = query.trim().toLowerCase().replace(/^\+/, "");
  const filtered = q
    ? options.filter((o) => o.label.includes(q) || o.en.toLowerCase().includes(q) || o.code.toLowerCase() === q || o.dial.startsWith(q))
    : options;

  const valid = Boolean(country && number && isValidPhoneNumber(number, country.code));
  const e164 = valid ? parsePhoneNumber(number, country.code).number : "";
  const showError = touched && number && !valid;
  const inputRef = useRef(null);

  // Lets the browser block the submit while the number is invalid.
  useEffect(() => {
    inputRef.current?.setCustomValidity(number && !valid ? invalidMessage : "");
  }, [number, valid, invalidMessage]);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-white/80">{label}</span>
      <div dir="ltr" className="flex gap-2">
        <Combobox value={country} onChange={(c) => c && setCountry(c)} onClose={() => setQuery("")} immediate>
          <div className="relative w-32 shrink-0">
            <ComboboxInput
              aria-label="رمز الدولة"
              placeholder="الدولة"
              autoComplete="off"
              displayValue={(c) => (c ? `${flag(c.code)} +${c.dial}` : "")}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pe-8 ps-3 !text-white outline-none transition placeholder:text-white/40 focus:border-[#f5c451]"
            />
            <ComboboxButton className="absolute inset-y-0 end-0 flex items-center px-2 text-white/60" aria-label="عرض الدول">
              <ChevronDown className="size-4" />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            anchor={{ to: "bottom end", gap: 6, padding: 16 }}
            transition
            className="z-50 max-h-72 w-[var(--input-width)] min-w-72 overflow-y-auto rounded-xl border border-white/15 bg-[#0d1017] p-1 shadow-2xl shadow-black/60 outline-none transition duration-100 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0 [--anchor-max-height:18rem]"
          >
            <div className="sticky top-0 flex items-center gap-2 border-b border-white/10 bg-[#0d1017] px-3 py-2 text-xs text-white/50">
              <Search className="size-3.5" aria-hidden="true" />
              ابحث باسم الدولة أو الرمز
            </div>
            {filtered.length === 0 && <div className="px-3 py-3 text-sm text-white/50">لا توجد نتائج</div>}
            {filtered.map((o) => (
              <ComboboxOption
                key={o.code}
                value={o}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/90 data-[focus]:bg-[#f5c451]/15 data-[selected]:text-[#f5c451]"
              >
                <span className="text-lg leading-none">{flag(o.code)}</span>
                <span dir="rtl" className="flex-1 truncate text-right">{o.label}</span>
                <span className="tabular-nums text-white/50">+{o.dial}</span>
                <Check className="invisible size-4 text-[#f5c451] group-data-[selected]:visible" aria-hidden="true" />
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
        <input
          required
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label={label}
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
          onBlur={() => setTouched(true)}
          onInvalid={(e) => {
            if (!number) return; // empty: keep the browser's "required" message
            e.preventDefault(); // show our inline message instead of the browser bubble
            setTouched(true);
            e.target.focus();
          }}
          aria-invalid={showError || undefined}
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 !text-white outline-none transition focus:border-[#f5c451] aria-[invalid]:border-red-500/70"
        />
      </div>
      {/* Carries the full number; empty until the number is valid, which the form's submit handler rejects. */}
      <input type="hidden" name={name} value={e164} />
      {showError && <span role="alert" className="mt-1.5 block text-sm text-red-300">{invalidMessage}</span>}
    </div>
  );
}
