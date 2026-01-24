"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  UserCheck,
  Video,
  Stethoscope,
  FileText,
  CreditCard,
  Package,
} from "lucide-react";

const Features = () => {
  const steps = [
    {
      icon: CalendarCheck,
      step: "01",
      title: "Book an Appointment",
      description:
        "Patients book an appointment through our website or with assistance from our care team.",
      color: "bg-emerald-500",
    },
    {
      icon: UserCheck,
      step: "02",
      title: "Doctor Assignment",
      description:
        "A suitable doctor is assigned, and a confirmation email is sent with consultation details.",
      color: "bg-blue-500",
    },
    {
      icon: Video,
      step: "03",
      title: "Join Consultation",
      description:
        "Join the consultation 10–15 minutes before. Keep previous medical records and prescriptions ready.",
      color: "bg-violet-500",
    },
    {
      icon: Stethoscope,
      step: "04",
      title: "Doctor Consultation",
      description:
        "The doctor conducts a detailed consultation and reviews all relevant medical information.",
      color: "bg-rose-500",
    },
    {
      icon: FileText,
      step: "05",
      title: "Treatment Plan",
      description:
        "The treatment approach, expectations, and follow-up plan are clearly discussed.",
      color: "bg-amber-500",
    },
    {
      icon: CreditCard,
      step: "06",
      title: "Payment",
      description:
        "Payment is completed after the consultation and treatment discussion.",
      color: "bg-cyan-500",
    },
    {
      icon: Package,
      step: "07",
      title: "Medicine Dispatch",
      description:
        "Prescribed medicines are securely packed and dispatched with clear usage instructions.",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen min-w-screen text-[#ededed] py-16">
      <div className="w-[95vw] h-auto">
        {/* Header Section */}
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10 mb-8">
          <div>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-2"
            >
              How It Works
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl lg:text-5xl font-semibold text-neutral-950 max-w-[90vw] lg:max-w-[40vw]"
            >
              From Appointment to Medicine Dispatch
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center lg:text-right mt-5 text-neutral-700 lg:mt-0 lg:max-w-[35vw] text-base lg:text-lg"
          >
            Your healing journey with AWHCC is structured, transparent, and
            patient-centred. Here's what to expect.
          </motion.p>
        </div>

        {/* Steps Timeline */}
        <div className="px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.slice(0, 4).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative z-10">
                  <div
                    className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-neutral-500 text-xs font-mono">
                    STEP {item.step}
                  </span>
                  <h3 className="text-neutral-900 font-semibold text-lg mt-2 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {/* Decorative number */}
                <span className="absolute -right-2 -bottom-4 text-[80px] font-bold text-neutral-100 select-none z-0">
                  {item.step}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Second Row - 3 items centered */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-5xl mx-auto">
            {steps.slice(4).map((item, index) => (
              <motion.div
                key={index + 4}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index + 4) * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-neutral-200 rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative z-10">
                  <div
                    className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-neutral-500 text-xs font-mono">
                    STEP {item.step}
                  </span>
                  <h3 className="text-neutral-900 font-semibold text-lg mt-2 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {/* Decorative number */}
                <span className="absolute -right-2 -bottom-4 text-[80px] font-bold text-neutral-100 select-none z-0">
                  {item.step}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10 px-6"
        >
          <p className="text-neutral-600 text-sm italic max-w-2xl mx-auto">
            Timelines and response vary based on individual health conditions
            and follow-up consistency.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;
