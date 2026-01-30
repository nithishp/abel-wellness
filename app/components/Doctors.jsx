"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Award, BookOpen, Stethoscope, Brain } from "lucide-react";

const Doctors = ({ id }) => {
  const doctors = [
    {
      name: "Dr. Dinesh",
      role: "Founder & Managing Director",
      title: "Consultant Homoeopathic Physician",
      image: "/dinesh.webp",
      qualifications: [
        "BHMS",
        "Diploma in Diet and Nutrition",
        "Fellowship in Medical Cosmetology",
        "Certification in Psychology",
      ],
      focus: [
        "Chronic diseases",
        "Lifestyle-related disorders",
        "Integrative care with nutrition",
      ],
      description:
        "Dr. Dinesh is a qualified homoeopathic physician with a structured, patient-centred clinical approach. His practice focuses on detailed case-taking, ethical prescribing, and long-term management of chronic and lifestyle-related conditions.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      name: "Dr. Preethi James",
      role: "Chief Consultant – Homoeopathy",
      title: "MD (Hom.)",
      image: "/preethi-james.webp",
      qualifications: [
        "BHMS",
        "MD (Hom.)",
        "BSS Advanced Diploma in Acupuncture",
      ],
      focus: [
        "Chronic and complex cases",
        "Women's health concerns",
        "Integrative therapeutic approaches",
      ],
      description:
        "Dr. Preethi James is the Chief Consultant at AWHCC, bringing advanced academic training and clinical experience in homoeopathic medicine. Her consultations emphasise accurate diagnosis, individualised prescriptions, and consistent follow-up.",
      color: "from-violet-500 to-purple-600",
    },
  ];

  const psychologist = {
    name: "Ms. Ablin Jebisha",
    role: "Consultant Psychologist",
    title: "B.Sc. Psychology",
    image: "/jebisha.webp",
    focus: [
      "Stress management",
      "Emotional well-being",
      "Supportive counselling",
    ],
    description:
      "Ms. Ablin Jebisha provides psychological support services at AWHCC. Her work focuses on emotional well-being, stress-related concerns, and counselling support as part of an integrated care model.",
    color: "from-rose-500 to-pink-600",
  };

  return (
    <div id={id} className="min-h-screen min-w-screen py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Our Team
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl lg:text-5xl font-bold text-neutral-950 mb-4"
          >
            Doctors & Care Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-600 text-base lg:text-lg max-w-2xl mx-auto"
          >
            Qualified • Accountable • Patient-Centred
          </motion.p>
        </div>

        {/* Medical Doctors */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl lg:text-2xl font-semibold text-neutral-800 mb-8 flex items-center gap-3"
          >
            <Stethoscope className="w-6 h-6 text-emerald-600" />
            Medical Doctors
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {doctors.map((doctor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className={`bg-gradient-to-r ${doctor.color} p-6 text-white`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold">
                        {doctor.name}
                      </h3>
                      <p className="text-white/90 text-sm">{doctor.role}</p>
                      <p className="text-white/80 text-xs mt-1">
                        {doctor.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                    {doctor.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-neutral-800 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Qualifications & Training
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.qualifications.map((qual, idx) => (
                        <span
                          key={idx}
                          className="bg-neutral-100 text-neutral-700 text-xs px-3 py-1 rounded-full"
                        >
                          {qual}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-neutral-800 font-semibold text-sm mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      Clinical Focus Areas
                    </h4>
                    <ul className="space-y-1">
                      {doctor.focus.map((area, idx) => (
                        <li
                          key={idx}
                          className="text-neutral-600 text-sm flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Psychology Team */}
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl lg:text-2xl font-semibold text-neutral-800 mb-8 flex items-center gap-3"
          >
            <Brain className="w-6 h-6 text-rose-500" />
            Psychology Team
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-xl hover:shadow-xl transition-shadow duration-300"
          >
            <div
              className={`bg-gradient-to-r ${psychologist.color} p-6 text-white`}
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
                  <Image
                    src={psychologist.image}
                    alt={psychologist.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold">
                    {psychologist.name}
                  </h3>
                  <p className="text-white/90 text-sm">{psychologist.role}</p>
                  <p className="text-white/80 text-xs mt-1">
                    {psychologist.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                {psychologist.description}
              </p>

              <div>
                <h4 className="text-neutral-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Focus Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {psychologist.focus.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-rose-50 text-rose-700 text-xs px-3 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
