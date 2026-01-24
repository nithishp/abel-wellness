"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Nav from "@/app/components/CornerNav";
import Footer from "@/app/components/Footer";

export default function ServicePageTemplate({
  title,
  subtitle = "Individualised Homoeopathic Care",
  gradientFrom = "from-emerald-500",
  gradientTo = "to-teal-600",
  understanding,
  approach,
  assessmentPoints,
  treatmentFocus,
  conditions,
  suitableFor,
  notSuitableFor,
  notSuitableNote = "In such cases, appropriate referrals or co-management are advised.",
  expectations,
  importantNote,
  ctaTitle = "Book Your Consultation",
  ctaDescription,
  ctaButtonText,
}) {
  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <Nav />

      {/* Hero Section */}
      <div
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} pt-24 pb-16 px-6 lg:px-10`}
      >
        <div className="max-w-5xl mx-auto">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Services
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl lg:text-5xl font-bold text-white mb-4"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/90 text-lg lg:text-xl max-w-3xl"
          >
            {subtitle}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/70 text-sm mt-2"
          >
            ABEL Wellness & Homoeopathic Care Centre (AWHCC)
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
        {/* Understanding Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-6">
            Understanding {title}
          </h2>
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            {understanding.map((para, index) => (
              <p
                key={index}
                className="text-neutral-700 leading-relaxed mb-4 last:mb-0"
              >
                {para}
              </p>
            ))}
          </div>
        </motion.section>

        {/* Approach Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-6">
            {approach.title}
          </h2>
          <div className="bg-emerald-50 rounded-2xl p-6 lg:p-8 border border-emerald-100">
            <p className="text-neutral-700 leading-relaxed mb-4">
              {approach.intro}
            </p>
            <ul className="space-y-3">
              {assessmentPoints.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-neutral-700"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
            {approach.conclusion && (
              <p className="text-neutral-700 leading-relaxed mt-4 font-medium">
                {approach.conclusion}
              </p>
            )}
            {treatmentFocus && (
              <p className="text-emerald-700 mt-4 italic">{treatmentFocus}</p>
            )}
          </div>
        </motion.section>

        {/* Conditions Section */}
        {conditions && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-6">
              Conditions Commonly Consulted For
            </h2>
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl"
                  >
                    <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></span>
                    <span className="text-neutral-700 text-sm">
                      {condition}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-neutral-600 text-sm mt-4 italic">
                Each case is evaluated individually, even when diagnoses appear
                similar.
              </p>
            </div>
          </motion.section>
        )}

        {/* Suitable / Not Suitable */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Who Can Consider This Consultation
            </h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
              <p className="text-neutral-600 text-sm mb-4">
                This service may be suitable if you:
              </p>
              <ul className="space-y-3">
                {suitableFor.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-neutral-700 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-500" />
              Who May Not Be Suitable
            </h3>
            <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
              <ul className="space-y-3 mb-4">
                {notSuitableFor.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-neutral-700 text-sm"
                  >
                    <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-neutral-600 text-sm italic">
                {notSuitableNote}
              </p>
            </div>
          </motion.section>
        </div>

        {/* Expectations Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-6">
            What to Expect During Consultation
          </h2>
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expectations.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-neutral-700 text-sm">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-neutral-600 text-sm mt-6 italic">
              Consultations are available both in-clinic and online, with strict
              confidentiality and adequate consultation time.
            </p>
          </div>
        </motion.section>

        {/* Important Note */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                  Important Note on Expectations
                </h3>
                <p className="text-neutral-700 text-sm leading-relaxed">
                  {importantNote}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
            {ctaTitle}
          </h2>
          <p className="text-neutral-600 mb-8">{ctaDescription}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold flex items-center gap-2 justify-center transition-colors">
                <Calendar size={18} />
                {ctaButtonText}
              </button>
            </Link>
            <button
              onClick={() => window.open("tel:+916380093009", "_self")}
              className="px-8 py-4 border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white rounded-full font-semibold flex items-center gap-2 justify-center transition-colors"
            >
              <Phone size={18} />
              Speak to Our Care Team
            </button>
          </div>
        </motion.section>
      </div>

      <Footer />
    </div>
  );
}
