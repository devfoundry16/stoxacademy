"use client";

import { useTranslations } from 'next-intl';

export function SkillsSection() {
  const t = useTranslations();
  const skills = t.raw('skills.items');
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">{t('skills.title')}</h2>
          <p className="text-2xl mb-12 font-semibold">{t('skills.subtitle')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, idx) => (
              <div key={idx} className="p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                <p className="text-lg font-medium">{skill}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  