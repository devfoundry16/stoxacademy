"use client";

import { useTranslations } from 'next-intl';

export function WhyChooseUsSection() {
  const t = useTranslations();
  const reasons = [
    {
      title: t('whyChooseUs.reasons.professionalTeam.title'),
      desc: t('whyChooseUs.reasons.professionalTeam.description'),
    },
    {
      title: t('whyChooseUs.reasons.highestProfessionalism.title'),
      desc: t('whyChooseUs.reasons.highestProfessionalism.description'),
    },
    {
      title: t('whyChooseUs.reasons.practicalExperience.title'),
      desc: t('whyChooseUs.reasons.practicalExperience.description'),
    },
    {
      title: t('whyChooseUs.reasons.realValue.title'),
      desc: t('whyChooseUs.reasons.realValue.description'),
    },
  ];
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            {t('whyChooseUs.title')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  