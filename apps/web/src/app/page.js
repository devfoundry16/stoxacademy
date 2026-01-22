"use client";

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ChecklistFlow } from "@/components/ChecklistFlow"
import { WhyUsSection } from "@/components/why-us-section"
import { CoursesSection } from "@/components/courses-section"
import { WhyChooseUsSection } from "@/components/why-choose-us-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { SkillsSection } from "@/components/skills-section"
import { TeamSection } from "@/components/team-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { fadeIn } from "@/lib/animations"

export default function StoxAcademy() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="min-h-screen bg-white font-sans"
    >
      <Header />
      <HeroSection />
      <WhyUsSection />
      <CoursesSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <SkillsSection />
      <ChecklistFlow />
      <TeamSection />
      <FinalCTASection />
      <Footer />
    </motion.div>
  )
}
