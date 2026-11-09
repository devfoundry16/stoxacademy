import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VideoPlayer } from "@/components/video-player";
import { Link } from "@/i18n/routing";
import { Check } from "lucide-react";
import { content as c, LINKS, VIDEOS } from "./content";

export const metadata = {
  title: "دورة الذهب والفوركس | أكاديمية ستوكس",
};

function Btn({ href, children, secondary }) {
  const cls = `inline-block px-8 py-4 text-lg font-semibold rounded-full transition-all hover:scale-105 ${
    secondary
      ? "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
      : "bg-blue-600 text-white hover:bg-blue-700"
  }`;
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>{children}</Link>
  ) : (
    <a href={href} className={cls}>{children}</a>
  );
}

// Renders the video when a URL is set, otherwise a labelled placeholder.
function Video({ url, label, className = "" }) {
  if (url) return <VideoPlayer videoUrl={url} className={className} />;
  return (
    <div className={`aspect-video bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 text-center p-4 ${className}`}>
      {label}
    </div>
  );
}

function Section({ title, children, alt }) {
  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 ${alt ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-5xl mx-auto">
        {title && <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

export default async function FunnelPage({ params }) {
  // Arabic-only page: send any other locale to /ar/funnel so the header matches.
  const { locale } = await params;
  if (locale !== "ar") redirect("/ar/funnel");

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">
      <Header />
      <div className="pt-16">
        {/* 1. Hero + VSL */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{c.hero.title}</h1>
            <p className="text-lg text-gray-600 mb-8">{c.hero.instructor}</p>
            <Video url={VIDEOS.vsl} label="VSL" className="mb-8" />
            <p className="text-gray-700 mb-6">{c.hero.intro}</p>
            <p className="font-semibold text-gray-900 mb-2">{c.hero.facts}</p>
            <p className="text-xl font-bold text-blue-600 mb-6">{c.hero.fee}</p>
            <Btn href={LINKS.enroll}>{c.hero.enroll}</Btn>
          </div>
        </section>

        {/* 2. Choose your next step */}
        <Section title={c.nextStep.title} alt>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              [c.nextStep.enrollText, c.nextStep.enrollBtn, LINKS.enroll, false],
              [c.nextStep.webinarText, c.nextStep.webinarBtn, LINKS.webinar, true],
              [c.nextStep.consultationText, c.nextStep.consultationBtn, LINKS.consultation, true],
            ].map(([text, label, href, secondary]) => (
              <div key={label} className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between text-center gap-6">
                <p className="text-gray-700">{text}</p>
                <Btn href={href} secondary={secondary}>{label}</Btn>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Understand the market */}
        <Section title={c.understand.title}>
          <div className="space-y-4 text-lg text-gray-700 max-w-3xl mx-auto">
            <p>{c.understand.p1}</p>
            <p>{c.understand.p2}</p>
            <p>{c.understand.p3}</p>
          </div>
        </Section>

        {/* 4. What you will learn */}
        <Section title={c.learn.title} alt>
          <ul className="grid sm:grid-cols-2 gap-4">
            {c.learn.items.map((item) => (
              <li key={item} className="flex gap-3 bg-white rounded-xl p-4 shadow-sm text-gray-800">
                <Check className="w-6 h-6 text-blue-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 5. Curriculum */}
        <Section title={c.curriculum.title}>
          <div className="space-y-4">
            {c.curriculum.sessions.map((s) => (
              <div key={s.title} className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. How the training works */}
        <Section title={c.how.title} alt>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 text-center">{c.how.text}</p>
          <ul className="flex flex-wrap justify-center gap-3">
            {c.how.points.map((p) => (
              <li key={p} className="bg-white rounded-full px-5 py-2 shadow-sm text-gray-800">{p}</li>
            ))}
          </ul>
        </Section>

        {/* 7. Instructor */}
        <Section title={c.instructor.title}>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 text-center">{c.instructor.text}</p>
          <div className="max-w-2xl mx-auto">
            <Video url={VIDEOS.instructor} label={c.instructor.videoLabel} />
          </div>
        </Section>

        {/* 8. Testimonials: first video featured, the rest beside it on desktop, stacked on mobile */}
        <Section title={c.testimonials.title} alt>
          <p className="text-center text-gray-600 -mt-6 mb-8">{c.testimonials.subtitle}</p>
          <div className="grid lg:grid-cols-3 gap-6">
            <Video
              url={VIDEOS.testimonials[0]}
              label={`${c.testimonials.videoLabel} 1`}
              className="lg:col-span-2"
            />
            <div className="flex flex-col gap-6">
              {VIDEOS.testimonials.slice(1).map((url, i) => (
                <Video key={i} url={url} label={`${c.testimonials.videoLabel} ${i + 2}`} />
              ))}
            </div>
          </div>
        </Section>

        {/* 9. Enrollment bonus */}
        <Section title={c.bonus.title}>
          <div className="bg-blue-50 rounded-2xl p-8 text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 mb-6">{c.bonus.text}</p>
            <Btn href={LINKS.enroll}>{c.bonus.btn}</Btn>
          </div>
        </Section>

        {/* 10. Course details */}
        <Section title={c.details.title} alt>
          <dl className="max-w-2xl mx-auto bg-white rounded-2xl shadow divide-y">
            {c.details.rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 p-4">
                <dt className="font-semibold text-gray-900">{k}</dt>
                <dd className="text-gray-700 text-left">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 11. Policy */}
        <Section title={c.policy.title}>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">{c.policy.text}</p>
        </Section>

        {/* 12. FAQ */}
        <Section title={c.faq.title} alt>
          <div className="max-w-3xl mx-auto space-y-3">
            {c.faq.items.map((f) => (
              <details key={f.q} className="bg-white rounded-xl shadow-sm p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer">{f.q}</summary>
                <p className="mt-3 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 13. Final CTA */}
        <Section title={c.final.title}>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 mb-4">{c.final.text}</p>
            <p className="font-semibold text-gray-900 mb-8">{c.final.fee}</p>
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <Btn href={LINKS.enroll}>{c.hero.enroll}</Btn>
              <Btn href={LINKS.webinar} secondary>{c.nextStep.webinarBtn}</Btn>
              <Btn href={LINKS.consultation} secondary>{c.nextStep.consultationBtn}</Btn>
            </div>
            <p className="text-sm text-gray-500">{c.final.disclaimer}</p>
          </div>
        </Section>
      </div>
      <Footer />
    </div>
  );
}
