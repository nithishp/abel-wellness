"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, Phone, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative w-[calc(100%+2rem)] -mx-4 -mt-4 -mb-10 h-[calc(100vh+2.5rem)] pb-10 bg-[url('/hero-bg-image-pink.webp')] bg-cover bg-center overflow-hidden">
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-8 lg:px-16 xl:px-24 max-w-7xl">
        {/* Logo and Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
        >
          <Image
            src="/abel-wellness-main.webp"
            width={56}
            height={56}
            alt="AWHCC Logo"
            className="rounded-xl object-contain w-12 h-12 lg:w-14 lg:h-14 shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-lg lg:text-xl font-semibold text-neutral-800 tracking-tight">
              ABEL Wellness & Homoeopathic Care Centre
            </span>
            <span className="text-xs lg:text-sm text-neutral-600 -mt-0.5">
              AWHCC
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <div className="space-y-2 lg:space-y-3 mb-6">
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-900 tracking-tight"
          >
            Individualised
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Homoeopathic
            </span>
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-neutral-900 tracking-tight"
          >
            Care
          </motion.h1>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-neutral-600 text-base lg:text-lg max-w-lg leading-relaxed mb-3"
        >
          Consult qualified homoeopathic doctors for personalised treatment,
          supported by psychology and lifestyle guidance.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="text-neutral-500 text-sm lg:text-base mb-6 flex items-center gap-2"
        >
          <Sparkles size={16} className="text-pink-500" />
          Online and in-clinic consultations available
        </motion.p>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="flex flex-wrap gap-2 lg:gap-3 mb-8"
        >
          {[
            "Evidence-oriented",
            "Ethical practice",
            "Patient-centred care",
          ].map((badge, index) => (
            <span
              key={index}
              className="text-xs lg:text-sm font-medium text-neutral-700 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300"
            >
              {badge}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <motion.button
            onClick={() => {
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-semibold text-sm lg:text-base shadow-lg shadow-neutral-900/25 hover:shadow-xl hover:shadow-neutral-900/30 transition-all duration-300"
          >
            Book Appointment
          </motion.button>
          <motion.button
            onClick={() => {
              window.open("tel:+916380093009", "_self");
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-neutral-200 hover:border-pink-400 text-neutral-800 rounded-full font-semibold flex items-center justify-center gap-2 text-sm lg:text-base shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <Phone
              size={18}
              className="group-hover:text-pink-500 transition-colors"
            />
            Talk to Care Team
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => {
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        }}
      >
        <span className="text-neutral-500 text-sm font-medium">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={20} className="text-neutral-400" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;
