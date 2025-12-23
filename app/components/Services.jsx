"use client";
import { MoveUpRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

const Services = () => {
  const cards = [
    {
      title: "General Online Consultation",
      description:
        "One-on-one sessions with our doctors to assess your health condition and provide a personalized homoeopathy treatment plan.",
      bgColor: "#b0fbee",
      points: [
        "Video/Audio Consultation",
        "Personalized Treatment Plans",
        "Follow-up Guidance",
      ],
    },
    {
      title: "Chronic Disease Management",
      description:
        "Comprehensive care for long-term conditions with natural remedies that address the root cause of your health issues.",
      bgColor: "#d4a6f5",
      points: [
        "Migraine & Headaches",
        "Asthma & Allergies",
        "Arthritis & Joint Pain",
        "Skin Issues (eczema, psoriasis, acne)",
      ],
    },
    {
      title: "Child Health Care",
      description:
        "Gentle and safe treatments for children's health issues, helping them grow stronger with natural immunity boosters.",
      bgColor: "#b1f5a6",
      points: [
        "Recurrent Cold & Cough",
        "Growth & Development Concerns",
        "Immunity Boosting",
        "Behavioral & Concentration Issues",
      ],
    },
  ];

  const moreCards = [
    {
      title: "Women's Wellness",
      description:
        "Support for women through different stages of life with personalized homoeopathic care.",
      bgColor: "#fce7f3",
      points: [
        "Hormonal Balance & PCOD",
        "Menstrual Irregularities",
        "Pregnancy & Postnatal Care",
        "Menopause Management",
      ],
    },
    {
      title: "Lifestyle & Stress Management",
      description:
        "Holistic care for modern-day challenges, helping you achieve balance and vitality in your daily life.",
      bgColor: "#fef3c7",
      points: [
        "Anxiety, Stress & Sleep Disorders",
        "Digestive Issues",
        "Weight Management Support",
        "General Wellness & Vitality",
      ],
    },
  ];

  return (
    <div className="min-h-screen h-auto min-w-screen section">
      <div className="bg-[url('/service-bg.png')] bg-cover flex flex-col justify-evenly w-full h-auto lg:h-auto rounded-2xl text-[#ededed] pb-10">
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10">
          <h1 className="text-3xl lg:text-5xl font-semibold max-w-[90vw] lg:max-w-[40vw] text-center lg:text-left">
            Holistic healing with personalized care.
          </h1>
          <p className="text-center lg:text-right mt-5 lg:mt-0 lg:max-w-[40vw] text-lg font-light">
            We provide safe, gentle, and holistic healthcare solutions for all
            ages, combining classical homeopathy with modern patient care.
          </p>
        </div>
        <div className="lg:px-10 py-5 lg:py-0 flex flex-col items-center lg:flex-row justify-evenly gap-5">
          {cards.map((card, index) => (
            <motion.div
              initial={{ y: -100 * index, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              style={{ backgroundColor: card.bgColor }}
              key={index}
              className="w-full max-w-[340px] lg:max-w-[400px] h-auto lg:h-[400px] rounded-2xl p-6 lg:p-10"
            >
              <div className="flex flex-row justify-between">
                <h1 className="text-neutral-800 font-semibold text-xl lg:text-3xl max-w-[70%] mb-5 lg:mb-7">
                  {card.title}
                </h1>
                <div className="bg-neutral-800 rounded-full h-8 w-8 lg:h-10 lg:w-10 flex justify-center items-center p-2 lg:p-3">
                  <MoveUpRight />
                </div>
              </div>
              <p className="text-xs lg:text-sm text-neutral-800 border-b-2 border-[#140909] pb-5 lg:pb-7">
                {card.description}
              </p>

              <ul className="mt-4 lg:mt-6 list-disc list-inside text-neutral-800">
                {card.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Additional Services Row */}
        <div className="lg:px-10 py-5 lg:py-8 flex flex-col items-center lg:flex-row justify-center gap-5">
          {moreCards.map((card, index) => (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              style={{ backgroundColor: card.bgColor }}
              key={index}
              className="w-full max-w-[340px] lg:max-w-[450px] h-auto lg:h-[350px] rounded-2xl p-6 lg:p-10"
            >
              <div className="flex flex-row justify-between">
                <h1 className="text-neutral-800 font-semibold text-xl lg:text-3xl max-w-[70%] mb-5 lg:mb-7">
                  {card.title}
                </h1>
                <div className="bg-neutral-800 rounded-full h-8 w-8 lg:h-10 lg:w-10 flex justify-center items-center p-2 lg:p-3">
                  <MoveUpRight />
                </div>
              </div>
              <p className="text-xs lg:text-sm text-neutral-800 border-b-2 border-[#140909] pb-5 lg:pb-7">
                {card.description}
              </p>

              <ul className="mt-4 lg:mt-6 list-disc list-inside text-neutral-800">
                {card.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
