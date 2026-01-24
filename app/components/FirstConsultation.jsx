"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ClipboardList,
  FileText,
  Search,
  MessageSquare,
  Pill,
  AlertCircle,
} from "lucide-react";

const FirstConsultation = () => {
  const expectations = [
    {
      icon: Clock,
      title: "Adequate Consultation Time",
      description:
        "Your first consultation is longer than a routine visit. This allows the doctor to understand not just symptoms, but the pattern behind them.",
      color: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: ClipboardList,
      title: "Detailed Case-Taking",
      description:
        "The doctor will discuss your main health concerns, past illnesses, treatments, lifestyle, sleep, stress, digestion, and emotional well-being where relevant.",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FileText,
      title: "Review of Medical Records",
      description:
        "Bring old reports and prescriptions for in-clinic consultations, or keep them ready to share during online consultations. Previous treatment history improves clarity.",
      color: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: Search,
      title: "Clinical Assessment",
      description:
        "The doctor analyses the case in detail, identifies individual symptom patterns and triggers, and correlates physical and emotional factors where relevant.",
      color: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      icon: MessageSquare,
      title: "Treatment Plan Discussion",
      description:
        "You will be clearly informed about the proposed treatment approach, expected course, follow-up frequency, and realistic expectations. No exaggerated promises.",
      color: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      icon: Pill,
      title: "Prescription & Next Steps",
      description:
        "Medicines are prescribed specifically for you with clear dosage and usage instructions. Follow-up timelines are discussed. For online consultations, medicines are dispatched securely.",
      color: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen min-w-screen py-16 bg-white rounded-2xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Your First Visit
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl lg:text-5xl font-bold text-neutral-950 mb-4"
          >
            What to Expect in Your First Consultation
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-600 text-base lg:text-lg max-w-2xl mx-auto"
          >
            At AWHCC, consultations are structured, unhurried, and clinically
            focused.
          </motion.p>
        </div>

        {/* Expectations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {expectations.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${item.color} rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0`}
                >
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-neutral-900 font-semibold text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 lg:p-8"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-neutral-900 font-semibold text-lg mb-3">
                Important Notes for Patients
              </h3>
              <ul className="space-y-2">
                <li className="text-neutral-700 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  Chronic conditions usually require time and follow-ups
                </li>
                <li className="text-neutral-700 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  Response varies from person to person
                </li>
                <li className="text-neutral-700 text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  No instant or guaranteed outcomes are promised
                </li>
              </ul>
              <p className="text-neutral-600 text-sm mt-4 italic">
                Ethical practice and informed consent are integral to care at
                AWHCC.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => {
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-colors duration-300"
          >
            Book Your First Consultation
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FirstConsultation;
