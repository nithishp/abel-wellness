"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import {
  UserCheck,
  Layers,
  Fingerprint,
  MessageSquareHeart,
  Globe,
} from "lucide-react";

const About = ({ id }) => {
  const features = [
    {
      icon: UserCheck,
      title: "Qualified & Accountable Medical Care",
      description:
        "Consultations are handled by formally trained homoeopathic doctors (BHMS & MD – Hom.), not assistants or protocol-based systems. Each case is approached clinically, with proper case-taking and follow-up.",
      color: "bg-emerald-100",
    },
    {
      icon: Layers,
      title: "Integrated, Not Isolated Treatment",
      description:
        "Health concerns rarely exist alone. At AWHCC, homoeopathic care is supported by psychology, nutrition, and lifestyle guidance where clinically appropriate—ensuring a broader, patient-relevant approach.",
      color: "bg-blue-100",
    },
    {
      icon: Fingerprint,
      title: "Individualised Prescriptions Only",
      description:
        "No fixed medicines. No one-size-fits-all remedies. Every prescription is based on individual symptoms, constitution, triggers, and response to treatment, reviewed periodically.",
      color: "bg-amber-100",
    },
    {
      icon: MessageSquareHeart,
      title: "Ethical Practice & Clear Communication",
      description:
        "We prioritise realistic expectations, transparent discussions, and patient education. Treatment goals, timelines, and limitations are explained clearly before and during care.",
      color: "bg-rose-100",
    },
    {
      icon: Globe,
      title: "Accessible Care – Online & In-Clinic",
      description:
        "Patients can consult us in person or online, without compromising consultation depth, confidentiality, or clinical standards.",
      color: "bg-violet-100",
    },
  ];

  return (
    <div
      id={id}
      className="min-h-screen flex flex-col items-center justify-center bg-white w-screen section text-[#ededed] py-16"
    >
      {/* Header Section */}
      <div className="text-center px-6 lg:px-10 mb-12">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-emerald-600 font-semibold text-sm lg:text-base uppercase tracking-wider mb-3"
        >
          Why Choose
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-neutral-950 font-bold text-3xl lg:text-5xl mb-4"
        >
          ABEL Wellness & Homoeopathic Care Centre
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-neutral-600 text-base lg:text-lg max-w-2xl mx-auto"
        >
          At AWHCC, we believe in treating people, not just symptoms. With a
          blend of classical homoeopathy and compassionate care, we help
          individuals achieve true wellness.
        </motion.p>
      </div>

      {/* Features Grid */}
      <div className="flex flex-wrap justify-center gap-6 px-6 lg:px-16 max-w-7xl">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`${feature.color} rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-shadow duration-300 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]`}
          >
            <div className="bg-white/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-neutral-800" />
            </div>
            <h3 className="text-neutral-900 font-semibold text-lg lg:text-xl mb-3">
              {feature.title}
            </h3>
            <p className="text-neutral-700 text-sm lg:text-base leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        onClick={() => {
          document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="mt-12 border-neutral-950 border-2 px-8 py-4 rounded-full bg-transparent text-black font-semibold hover:bg-neutral-950 hover:text-white transition-all duration-300"
      >
        Book Your Consultation
      </motion.button>
    </div>
  );
};

export default About;
