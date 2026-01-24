"use client";
import { MoveUpRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const Services = ({ id }) => {
  const services = [
    {
      title: "Chronic Skin Conditions",
      description:
        "Individualised homoeopathic care for acne, eczema, psoriasis, urticaria, and recurrent allergic rashes. Treatment focuses on long-term regulation, not quick cosmetic suppression.",
      bgColor: "#b0fbee",
      slug: "chronic-skin-conditions",
      points: [
        "Acne & Pimples",
        "Eczema & Psoriasis",
        "Urticaria & Allergic Rashes",
        "Recurrent Skin Issues",
      ],
    },
    {
      title: "Digestive & Metabolic Disorders",
      description:
        "Comprehensive care for gastritis, acidity, bloating, constipation, irritable bowel symptoms, and metabolic imbalance through individualised assessment.",
      bgColor: "#fef3c7",
      slug: "digestive-metabolic-disorders",
      points: [
        "Gastritis & Acidity",
        "Bloating & Indigestion",
        "Constipation & IBS",
        "Metabolic Imbalance",
      ],
    },
    {
      title: "Women's Health Concerns",
      description:
        "Personalised care for PCOS, menstrual irregularities, hormonal imbalance, and menopausal symptoms through holistic assessment and regulatory treatment.",
      bgColor: "#fce7f3",
      slug: "womens-health",
      points: [
        "PCOS Management",
        "Menstrual Irregularities",
        "Hormonal Imbalance",
        "Menopausal Symptoms",
      ],
    },
    {
      title: "Joint & Musculoskeletal",
      description:
        "Support for knee pain, osteoarthritis, chronic back pain, neck stiffness, and recurrent muscle aches with focus on gradual functional improvement.",
      bgColor: "#dbeafe",
      slug: "joint-musculoskeletal",
      points: [
        "Knee & Joint Pain",
        "Osteoarthritis Care",
        "Back & Neck Pain",
        "Muscle Stiffness",
      ],
    },
    {
      title: "Mental Health & Stress",
      description:
        "Integrated homoeopathic and psychological care for chronic stress, anxiety, sleep disturbances, and psychosomatic complaints in a supportive environment.",
      bgColor: "#d4a6f5",
      slug: "mental-health-stress",
      points: [
        "Stress & Anxiety",
        "Sleep Disturbances",
        "Emotional Exhaustion",
        "Psychosomatic Issues",
      ],
    },
    {
      title: "Lifestyle & Preventive Care",
      description:
        "Individualised medical support for recurring health patterns, fatigue, and reduced vitality. Focus on sustainable health regulation, not quick fixes.",
      bgColor: "#b1f5a6",
      slug: "lifestyle-preventive-care",
      points: [
        "Recurring Illnesses",
        "Fatigue & Low Energy",
        "Immunity Support",
        "Long-term Wellness",
      ],
    },
  ];

  return (
    <div id={id} className="min-h-screen h-auto min-w-screen section">
      <div className="bg-[url('/service-bg.png')] bg-cover flex flex-col justify-evenly w-full h-auto rounded-2xl text-[#ededed] pb-10">
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10">
          <h1 className="text-3xl lg:text-5xl font-semibold max-w-[90vw] lg:max-w-[40vw] text-center lg:text-left">
            Our Services
          </h1>
          <p className="text-center lg:text-right mt-5 lg:mt-0 lg:max-w-[40vw] text-lg font-light">
            Individualised homoeopathic care for chronic and lifestyle
            conditions, supported by psychology and lifestyle guidance where
            clinically appropriate.
          </p>
        </div>

        {/* Services Grid */}
        <div className="lg:px-10 py-5 lg:py-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-4">
          {services.map((service, index) => (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              style={{ backgroundColor: service.bgColor }}
              key={index}
              className="w-full h-auto min-h-[380px] rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
            >
              <div>
                <div className="flex flex-row justify-between items-start mb-5">
                  <h2 className="text-neutral-800 font-semibold text-xl lg:text-2xl max-w-[75%]">
                    {service.title}
                  </h2>
                  <Link href={`/services/${service.slug}`}>
                    <div className="bg-neutral-800 rounded-full h-10 w-10 flex justify-center items-center p-2 hover:bg-neutral-700 transition-colors cursor-pointer">
                      <MoveUpRight className="text-white" size={20} />
                    </div>
                  </Link>
                </div>
                <p className="text-sm text-neutral-700 border-b-2 border-neutral-800/30 pb-5">
                  {service.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {service.points.map((point, idx) => (
                    <li
                      key={idx}
                      className="text-neutral-800 text-sm flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={`/services/${service.slug}`}>
                <button className="mt-6 text-neutral-800 font-medium text-sm hover:underline flex items-center gap-1">
                  Learn more <MoveUpRight size={14} />
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
