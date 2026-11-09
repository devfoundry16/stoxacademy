"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Check, ArrowLeft, Plus, Gift, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { VideoPlayer } from "@/components/video-player";
import Aurora from "./rb/Aurora";
import ShinyText from "./rb/ShinyText";
import SpotlightCard from "./rb/SpotlightCard";
import { content as c, LINKS, VIDEOS } from "./content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GOLD = "#f5c451";
const TICKER = ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "XAG/USD", "WTI", "MT5", "TradingView", "RSI", "MACD", "CFD"];

// Fixed pseudo-random candles so server and client render the same markup.
const CANDLES = Array.from({ length: 28 }, (_, i) => {
  const t = i / 27;
  const base = 150 - t * 85 + Math.sin(i * 1.3) * 16;
  const body = 10 + ((i * 37) % 23);
  const up = (i * 7) % 3 !== 0;
  return { x: 14 + i * 20, y: base, body, wick: body + 14 + ((i * 11) % 12), up };
});

/* ---------- small reusable pieces ---------- */

function Btn({ href, children, secondary, full }) {
  const cls = `group relative inline-flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-full px-8 py-4 text-base sm:text-lg font-bold ${full ? "w-full justify-center px-5" : ""} transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
    secondary
      ? "border border-white/20 bg-white/5 text-white backdrop-blur hover:border-[#f5c451]/70 hover:shadow-[0_0_30px_-6px_#f5c451aa]"
      : "bg-[#f5c451] text-black shadow-[0_0_40px_-8px_#f5c451] hover:shadow-[0_0_60px_-4px_#f5c451]"
  }`;
  const inner = (
    <>
      {!secondary && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/50 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
      )}
      <span className="relative">{children}</span>
      <ArrowLeft className="relative size-5 transition-transform group-hover:-translate-x-1" />
    </>
  );
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} className={cls}>{inner}</a>
  );
}

function Video({ url, label, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1.5 shadow-2xl ${className}`}>
      {url ? (
        <VideoPlayer videoUrl={url} className="rounded-2xl" />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/0 p-4 text-center text-sm text-white/40">
          {label}
        </div>
      )}
    </div>
  );
}

function Spot({ className = "", children }) {
  return (
    <SpotlightCard
      spotlightColor={GOLD}
      intensity={0.18}
      borderGlow={0.8}
      ambient
      style={{ padding: 0 }}
      className={`h-full ${className}`}
    >
      {children}
    </SpotlightCard>
  );
}

function Section({ title, kicker, children, className = "" }) {
  return (
    <section className={`relative px-4 py-20 sm:px-6 lg:px-8 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-5xl">
        {title && (
          <div className="mb-14 text-center" data-reveal>
            {kicker && <span className="mb-3 block text-sm font-semibold tracking-widest text-[#f5c451]">{kicker}</span>}
            <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  const body = useRef(null);
  const icon = useRef(null);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    gsap.to(body.current, { height: next ? "auto" : 0, opacity: next ? 1 : 0, duration: 0.45, ease: "power3.out" });
    gsap.to(icon.current, { rotate: next ? 135 : 0, duration: 0.4, ease: "back.out(2)" });
  };
  return (
    <div className={`rounded-2xl border transition-colors ${open ? "border-[#f5c451]/40 bg-white/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
      <button onClick={toggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-5 text-start font-semibold text-white">
        {q}
        <span ref={icon} className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f5c451]/15 text-[#f5c451]">
          <Plus className="size-4" />
        </span>
      </button>
      <div ref={body} className="h-0 overflow-hidden opacity-0">
        <p className="px-5 pb-5 leading-relaxed text-white/60">{a}</p>
      </div>
    </div>
  );
}

/* ---------- hero chart ---------- */

function HeroChart() {
  return (
    <svg viewBox="0 0 580 230" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity=".35" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 90, 140, 190].map((y) => (
        <line key={y} x1="0" x2="580" y1={y} y2={y} stroke="white" strokeOpacity=".06" />
      ))}
      <g dir="ltr">
        {CANDLES.map((k, i) => (
          <g key={i} className="candle" style={{ transformOrigin: `${k.x}px 230px` }}>
            <line x1={k.x} x2={k.x} y1={k.y - 8} y2={k.y + k.wick} stroke={k.up ? GOLD : "#6b7280"} strokeWidth="1.5" />
            <rect x={k.x - 5} y={k.y} width="10" height={k.body} rx="2" fill={k.up ? GOLD : "#374151"} />
          </g>
        ))}
        <path
          className="trend"
          pathLength="1"
          d={`M14 ${CANDLES[0].y + 40} ` + CANDLES.map((k) => `L${k.x} ${k.y + k.body / 2}`).join(" ")}
          fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" strokeOpacity=".85"
        />
      </g>
    </svg>
  );
}

/* ---------- page ---------- */

export default function FunnelClient() {
  const root = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Hero intro
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".hero-word", { yPercent: 110, rotate: 4, duration: 1, stagger: 0.07 })
        .from(".hero-fade", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, "-=0.6")
        .from(".candle", { scaleY: 0, duration: 0.9, stagger: 0.03, ease: "back.out(1.4)" }, 0.2)
        .to(".trend", { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" }, 0.6);

      // Ambient motion
      gsap.to(".candle", { scaleY: "random(0.9, 1.08)", duration: "random(1.2, 2.4)", repeat: -1, yoyo: true, ease: "sine.inOut", stagger: { each: 0.1, from: "random" }, delay: 2.5 });
      gsap.to(".marquee-track", { xPercent: 50, duration: 30, repeat: -1, ease: "none" });

      // Generic scroll reveals
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: "power3.out", overwrite: true }),
      });
      gsap.set("[data-reveal]", { opacity: 0 });

      // Count-up stats
      gsap.utils.toArray(".stat-num").forEach((el) => {
        const o = { v: 0 };
        gsap.to(o, {
          v: Number(el.dataset.to), duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => (el.textContent = Math.round(o.v)),
        });
      });

      // Curriculum timeline: line fills with scroll, nodes light up
      gsap.fromTo(".tl-line", { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: ".tl", start: "top 60%", end: "bottom 60%", scrub: true } });
      gsap.utils.toArray(".tl-item").forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: "top 60%", end: "bottom 60%",
          toggleClass: { targets: el, className: "is-active" },
        });
      });

      // Sticky CTA appears after hero
      gsap.fromTo(".sticky-cta", { yPercent: 150 }, { yPercent: 0, ease: "power3.out", duration: 0.5, paused: true, scrollTrigger: { trigger: ".hero", start: "bottom top", toggleActions: "play none none reverse" } });
    });
  }, { scope: root });

  const words = c.hero.title.split(" ");
  const stats = [
    [8, "جلسات مباشرة", ""],
    [SESSIONS_PER_WEEK, "جلستان أسبوعياً", ""],
    [4, "أسابيع", ""],
    [500, "دولار هدية التسجيل", "$"],
  ];

  return (
    <div ref={root} dir="rtl" className="min-h-screen overflow-x-clip bg-[#07090d] text-white">
      <div className="fixed inset-x-0 top-16 z-40 h-0.5 origin-right bg-[#f5c451] [animation:grow_linear_both] [animation-timeline:scroll()]" style={{ transformOrigin: "right" }} />
      <style>{`@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .tl-item .tl-dot{transition:all .4s}
        .tl-item.is-active .tl-dot{background:${GOLD};box-shadow:0 0 0 6px #f5c45133,0 0 24px ${GOLD};color:#000}
        .tl-item.is-active .tl-card{border-color:#f5c45155;background:#ffffff0d}`}</style>

      {/* 1. HERO */}
      <section className="hero relative isolate overflow-hidden px-4 pb-20 pt-32 text-center sm:px-6 sm:pt-40">
        <div className="absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
          <Aurora colorStops={["#8a4b08", GOLD, "#5c3205"]} amplitude={0.9} blend={0.6} height={0.45} speed={0.6} glow={0.5} brightness={0.7} />
        </div>
        <div className="hero-chart absolute inset-x-0 top-40 -z-10 mx-auto h-[26rem] max-w-5xl opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]">
          <HeroChart />
        </div>

        <div className="mx-auto max-w-4xl">
          <span className="hero-fade mb-6 inline-block rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-1.5 text-sm font-medium text-[#f5c451]">
            {c.hero.facts.split("|")[0].trim()} · {c.hero.fee}
          </span>
          <h1 className="mb-6 text-4xl font-black leading-[1.35] sm:text-6xl">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom">
                <span className="hero-word inline-block px-[0.15em]">{i >= words.length - 3 ? <ShinyText color="#f5c451" shineColor="#fff7dc" speed={3} delay={1.5}>{w}</ShinyText> : w}</span>
              </span>
            ))}
          </h1>
          <p className="hero-fade mb-10 text-lg text-white/60">{c.hero.instructor}</p>
          <div className="hero-fade mx-auto mb-10 max-w-3xl">
            <Video url={VIDEOS.vsl} label="VSL" />
          </div>
          <p className="hero-fade mx-auto mb-8 max-w-2xl leading-relaxed text-white/70">{c.hero.intro}</p>
          <div className="hero-fade">
            <Btn href={LINKS.enroll}>{c.hero.enroll}</Btn>
          </div>
        </div>
      </section>

      {/* Ticker (decorative, symbols only) */}
      <div className="overflow-hidden border-y border-white/10 bg-white/[0.02] py-4" dir="ltr" aria-hidden>
        <div className="marquee-track flex w-max -translate-x-1/2 gap-12 whitespace-nowrap font-mono text-sm text-white/40">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-12">{t}<span className="text-[#f5c451]">◆</span></span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(([n, label, prefix]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="text-5xl font-black text-[#f5c451]" dir="ltr">
                {prefix}<span className="stat-num" data-to={n}>0</span>
              </div>
              <div className="mt-2 text-sm text-white/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Next step */}
      <Section title={c.nextStep.title} kicker="ابدأ من هنا">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [c.nextStep.enrollText, c.nextStep.enrollBtn, LINKS.enroll, false],
            [c.nextStep.webinarText, c.nextStep.webinarBtn, LINKS.webinar, true],
            [c.nextStep.consultationText, c.nextStep.consultationBtn, LINKS.consultation, true],
          ].map(([text, label, href, secondary], i) => (
            <div
              key={label}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.06] hover:shadow-[0_24px_50px_-24px_#f5c451] ${
                secondary ? "border-white/10 hover:border-[#f5c451]/50" : "border-[#f5c451]/50"
              }`}
            >
              {/* gold line draws across the top on hover */}
              <span className="absolute inset-x-0 top-0 h-0.5 origin-right scale-x-0 bg-[#f5c451] transition-transform duration-500 group-hover:scale-x-100" />
              <span className="mb-5 text-5xl font-black text-white/15 transition-colors duration-300 group-hover:text-[#f5c451]" dir="ltr">
                0{i + 1}
              </span>
              <p className="mb-8 flex-1 leading-loose text-white/70">{text}</p>
              <Btn href={href} secondary={secondary} full>{label}</Btn>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Understand */}
      <Section title={c.understand.title} kicker="لماذا هذه الدورة">
        <div className="mx-auto max-w-3xl space-y-5 text-lg leading-loose text-white/70">
          {[c.understand.p1, c.understand.p2, c.understand.p3].map((p) => (
            <p key={p} className="border-r-2 border-[#f5c451]/50 pr-5">{p}</p>
          ))}
        </div>
      </Section>

      {/* 4. Learn */}
      <Section title={c.learn.title} kicker="المحتوى">
        <ul className="grid gap-4 sm:grid-cols-2">
          {c.learn.items.map((item) => (
            <li key={item}>
              <Spot>
                <div className="flex items-center gap-4 p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f5c451] text-black"><Check className="size-5" /></span>
                  <span className="text-white/85">{item}</span>
                </div>
              </Spot>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5. Curriculum timeline */}
      <Section title={c.curriculum.title} kicker="8 جلسات">
        <div className="tl relative">
          <div className="absolute bottom-0 right-5 top-0 w-px bg-white/10" />
          <div className="tl-line absolute bottom-0 right-5 top-0 w-px bg-gradient-to-b from-[#f5c451] to-amber-600" />
          <div className="space-y-6">
            {c.curriculum.sessions.map((s, i) => (
              <div key={s.title} className="tl-item relative pr-16">
                <span className="tl-dot absolute right-0 top-3 grid size-10 place-items-center rounded-full border border-white/20 bg-[#0d1117] font-bold text-white/70">{i + 1}</span>
                <div className="tl-card rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-500">
                  <h3 className="mb-1 font-bold text-white">{s.title}</h3>
                  <p className="leading-relaxed text-white/60">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 6. How */}
      <Section title={c.how.title} kicker="الأسلوب">
        <p className="mx-auto mb-10 max-w-3xl text-center text-lg leading-loose text-white/70">{c.how.text}</p>
        <ul className="flex flex-wrap justify-center gap-3">
          {c.how.points.map((p) => (
            <li key={p} className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-white/85 transition hover:-translate-y-1 hover:border-[#f5c451]/60 hover:text-[#f5c451]">{p}</li>
          ))}
        </ul>
      </Section>

      {/* 7. Instructor */}
      <Section title={c.instructor.title} kicker="المدرب">
        <p className="mx-auto mb-10 max-w-3xl text-center text-lg leading-loose text-white/70">{c.instructor.text}</p>
        <div className="mx-auto max-w-2xl"><Video url={VIDEOS.instructor} label={c.instructor.videoLabel} /></div>
      </Section>

      {/* 8. Testimonials */}
      <Section title={c.testimonials.title} kicker={c.testimonials.subtitle}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Video url={VIDEOS.testimonials[0]} label={`${c.testimonials.videoLabel} 1`} />
          </div>
          <div className="flex flex-col gap-6">
            {VIDEOS.testimonials.slice(1).map((url, i) => (
              <div key={i}><Video url={url} label={`${c.testimonials.videoLabel} ${i + 2}`} /></div>
            ))}
          </div>
        </div>
      </Section>

      {/* 9. Bonus */}
      <Section title={c.bonus.title} kicker="مفاجأة">
        <div>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[#f5c451]/40 bg-gradient-to-br from-[#f5c451]/20 via-white/5 to-transparent p-8 text-center sm:p-12">
            <Gift className="mx-auto mb-5 size-12 text-[#f5c451]" />
            <div className="mb-4 text-6xl font-black" dir="ltr"><ShinyText color="#f5c451" shineColor="#fff7dc" speed={3}>$500</ShinyText></div>
            <p className="mb-8 text-lg leading-loose text-white/80">{c.bonus.text}</p>
            <Btn href={LINKS.enroll}>{c.bonus.btn}</Btn>
          </div>
        </div>
      </Section>

      {/* 10. Details */}
      <Section title={c.details.title} kicker="باختصار">
        <dl className="mx-auto max-w-2xl divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {c.details.rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 p-5 transition-colors hover:bg-white/5">
              <dt className="font-semibold text-[#f5c451]">{k}</dt>
              <dd className="text-white/80">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* 11. Policy */}
      <Section title={c.policy.title}>
        <div className="mx-auto flex max-w-3xl gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <ShieldCheck className="size-8 shrink-0 text-[#f5c451]" />
          <p className="leading-loose text-white/70">{c.policy.text}</p>
        </div>
      </Section>

      {/* 12. FAQ */}
      <Section title={c.faq.title} kicker="أسئلة">
        <div className="mx-auto max-w-3xl space-y-3">
          {c.faq.items.map((f) => <Faq key={f.q} {...f} />)}
        </div>
      </Section>

      {/* 13. Final CTA */}
      <section className="relative isolate overflow-hidden px-4 py-28 text-center">
        <div className="absolute left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5c451]/15 blur-[130px]" />
        <div className="mx-auto max-w-3xl">
          <h2 data-reveal className="mb-6 text-4xl font-black sm:text-6xl">{c.final.title}</h2>
          <p className="mb-4 text-lg leading-loose text-white/70">{c.final.text}</p>
          <p className="mb-10 font-semibold text-[#f5c451]">{c.final.fee}</p>
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            <Btn href={LINKS.enroll}>{c.hero.enroll}</Btn>
            <Btn href={LINKS.webinar} secondary>{c.nextStep.webinarBtn}</Btn>
            <Btn href={LINKS.consultation} secondary>{c.nextStep.consultationBtn}</Btn>
          </div>
          <p className="text-sm text-white/40">{c.final.disclaimer}</p>
        </div>
      </section>

      {/* Sticky mobile/desktop CTA */}
      <div className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07090d]/90 p-3 backdrop-blur sm:hidden">
        <Link href={LINKS.enroll} className="block rounded-full bg-[#f5c451] py-3 text-center font-bold text-black">{c.nextStep.enrollBtn}</Link>
      </div>
    </div>
  );
}

const SESSIONS_PER_WEEK = 2;
