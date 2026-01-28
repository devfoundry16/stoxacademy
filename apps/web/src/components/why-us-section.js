"use client";

import Image from "next/image";
import { useTranslations } from 'next-intl';

export function WhyUsSection() {
  const t = useTranslations();
  const features = [
    t('whyUs.features.tours'),
    t('whyUs.features.practicalTraining'),
    t('whyUs.features.freeSessions'),
    t('whyUs.features.expertMeetings'),
    t('whyUs.features.marketNews'),
    t('whyUs.features.discordCommunity'),
  ];
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('whyUs.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('whyUs.description')}
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-2xl font-bold">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature}
                </h3>
              </div>
            ))}
          </div>
          <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/professionals.avif"
              alt="Trading professionals at work"
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
