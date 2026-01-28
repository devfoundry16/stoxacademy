"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaLinkedin, FaTwitter, FaEnvelope } from "react-icons/fa";
import { useTranslations } from 'next-intl';

const avatarPaths = [
  "/images/team/Ameer Irshed.jpeg",
  "/images/team/firas elkader.jpeg",
  "/images/team/majd hawash.jpeg",
  "/images/team/Moataz habiballa.jpg",
  "/images/team/mohamed Nadaf.jpg",
  "/images/team/ola Shalabni.jpeg",
];

const socialLinks = [
  { linkedin: "#", twitter: "#", email: "ameer@stoxacademy.com" },
  { linkedin: "#", twitter: "#", email: "firas@stoxacademy.com" },
  { linkedin: "#", twitter: "#", email: "majd@stoxacademy.com" },
  { linkedin: "#", twitter: "#", email: "moataz@stoxacademy.com" },
  { linkedin: "#", twitter: "#", email: "mohamed@stoxacademy.com" },
  { linkedin: "#", twitter: "#", email: "ola@stoxacademy.com" },
];

export function TeamSection() {
  const t = useTranslations();
  const teamMembers = t.raw('team.members').map((member, index) => ({
    ...member,
    avatar: avatarPaths[index],
    social: socialLinks[index],
  }));
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [cardsToShow, setCardsToShow] = React.useState(3);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, teamMembers.length - cardsToShow);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? maxIndex : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
  };

  const visibleMembers = teamMembers.slice(
    currentIndex,
    currentIndex + cardsToShow
  );

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('team.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('team.description')}
          </p>
        </div>

        {/* Team Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {maxIndex > 0 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white hover:bg-blue-600 text-gray-900 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                aria-label="Previous team member"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white hover:bg-blue-600 text-gray-900 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                aria-label="Next team member"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="flex gap-8 transition-all duration-500">
            {visibleMembers.map((member, idx) => (
              <div
                key={currentIndex + idx}
                className="shrink-0 w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]"
              >
                <div className="group bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                  {/* Circular Avatar */}
                  <div className="flex justify-center pt-8 pb-4">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-100 group-hover:border-blue-600 transition-colors duration-300">
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-3">
                      {member.position}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {member.description}
                    </p>

                    {/* Social Links */}
                    <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
                      <a
                        href={member.social.linkedin}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <FaLinkedin className="w-5 h-5" />
                      </a>
                      <a
                        href={member.social.twitter}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-400 hover:text-white transition-colors duration-200"
                        aria-label={`${member.name}'s Twitter`}
                      >
                        <FaTwitter className="w-5 h-5" />
                      </a>
                      <a
                        href={`mailto:${member.social.email}`}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-green-600 hover:text-white transition-colors duration-200"
                        aria-label={`Email ${member.name}`}
                      >
                        <FaEnvelope className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          {maxIndex > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-3 rounded-full transition-all ${
                    idx === currentIndex ? "bg-blue-600 w-8" : "bg-gray-300 w-3"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
