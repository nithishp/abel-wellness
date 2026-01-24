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
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Nav from "@/app/components/CornerNav";
import Footer from "@/app/components/Footer";

export default function ChronicSkinConditionsPage() {
  const suitableFor = [
    "Have recurrent or long-standing skin complaints",
    "Experience frequent relapses after stopping medicines",
    "Want an individualised, non-protocol-based approach",
    "Prefer a treatment plan that considers overall health, not just the skin",
  ];

  const notSuitableFor = [
    "Acute medical or surgical emergencies",
    "Rapidly worsening conditions requiring immediate hospital care",
  ];

  const expectations = [
    "Detailed case taking (initial consultation is usually longer)",
    "Review of previous reports, prescriptions, and treatment history",
    "Clear discussion about treatment scope, expected course, and follow-ups",
    "Periodic assessment and adjustment of medicines as needed",
  ];

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <Nav />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 pt-24 pb-16 px-6 lg:px-10">
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
            Chronic Skin Conditions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/90 text-lg lg:text-xl max-w-3xl"
          >
            Individualised Homoeopathic Care
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
            Understanding Chronic Skin Conditions
          </h2>
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <p className="text-neutral-700 leading-relaxed mb-4">
              Chronic skin problems such as acne, eczema, psoriasis, urticaria,
              and recurrent allergic rashes often persist despite repeated
              topical or suppressive treatments. While temporary relief may
              occur, symptoms commonly recur when underlying triggers remain
              unaddressed.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Skin conditions are influenced by multiple factors—genetic
              tendency, immune response, hormonal balance, stress, digestion,
              lifestyle, and environmental exposure. Managing them effectively
              requires more than symptom control alone.
            </p>
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
            How Homoeopathy Approaches Chronic Skin Conditions
          </h2>
          <div className="bg-emerald-50 rounded-2xl p-6 lg:p-8 border border-emerald-100">
            <p className="text-neutral-700 leading-relaxed mb-4">
              At AWHCC, homoeopathic treatment is individualised, not
              disease-label based. Prescriptions are selected after a detailed
              assessment of:
            </p>
            <ul className="space-y-3">
              {[
                "Nature and pattern of skin complaints",
                "Triggers, aggravations, and relieving factors",
                "Past treatments (including steroid or long-term medication use)",
                "General health, digestion, sleep, stress, and emotional factors",
                "Family and medical history",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-neutral-700"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4 font-medium">
              The aim is to support the body's regulatory mechanisms, reduce
              recurrence, and improve overall skin health gradually—while
              closely monitoring response over time.
            </p>
            <p className="text-emerald-700 mt-4 italic">
              Treatment focuses on long-term regulation, not quick cosmetic
              suppression.
            </p>
          </div>
        </motion.section>

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
                In such cases, appropriate referrals or co-management are
                advised.
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
              Consultations are available both in-clinic and online, without
              compromising clinical depth or confidentiality.
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
                  Chronic skin conditions often require time, consistency, and
                  follow-up. Improvement is usually gradual and varies from
                  person to person. No guaranteed or instant results are
                  promised—ethical, transparent communication is part of our
                  practice.
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
            Book Your Consultation
          </h2>
          <p className="text-neutral-600 mb-8">
            If you are looking for a structured, patient-centred approach to
            managing chronic skin concerns:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold flex items-center gap-2 justify-center transition-colors">
                <Calendar size={18} />
                Book a Skin Consultation
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
