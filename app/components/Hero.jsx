"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CircleArrowRight, Phone } from "lucide-react";
import { WordPullUp } from "./ui/word-pull-up";

const Hero = () => {
  return (
    <div className="bg-[url('/small-hero-bg.png')] lg:bg-[url('/hero-bg-image.png')] pl-3 section w-full bg-cover h-[95vh] rounded-2xl flex flex-col items-start justify-center text-[#ededed]">
      <div className="flex flex-col items-start lg:pl-3 gap-4">
        <div className="flex flex-row items-center justify-start">
          <Image
            src="/abel-wellness-main.webp"
            width={700}
            height={700}
            alt="AWHCC Logo"
            className="rounded-2xl object-contain w-10 h-10 lg:w-20 lg:h-20"
          />
          <WordPullUp
            className="text-xl lg:text-2xl font-medium text-neutral-900 lg:text-nowrap text-wrap max-w-[70vw] -mb-3 ml-3"
            words="ABEL Wellness & Homoeopathic Care Centre"
          />
        </div>

        <motion.h1
          initial={{ y: -100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-neutral-950 font-semibold text-[9vw] lg:text-[10vh] text-left max-w-[90vw] lg:max-w-[700px] leading-tight"
        >
          Individualised
        </motion.h1>
        <motion.h1
          initial={{ y: -100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-neutral-950 font-semibold text-[9vw] lg:text-[10vh] text-left max-w-[90vw] lg:max-w-[700px] leading-none -mt-2"
        >
          Homoeopathic Care
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-neutral-700 text-sm lg:text-lg max-w-[90vw] lg:max-w-[500px] mt-2 ml-1"
        >
          Consult qualified homoeopathic doctors for personalised treatment,
          supported by psychology and lifestyle guidance.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-neutral-600 text-xs lg:text-sm max-w-[400px] ml-1"
        >
          Online and in-clinic consultations available.
        </motion.p>

        {/* Trust Line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap gap-2 lg:gap-4 mt-2 ml-1"
        >
          <span className="text-neutral-600 text-xs lg:text-sm border border-neutral-400 rounded-full px-3 py-1">
            Evidence-oriented
          </span>
          <span className="text-neutral-600 text-xs lg:text-sm border border-neutral-400 rounded-full px-3 py-1">
            Ethical practice
          </span>
          <span className="text-neutral-600 text-xs lg:text-sm border border-neutral-400 rounded-full px-3 py-1">
            Patient-centred care
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-row gap-4 mt-4">
          <motion.button
            onClick={() => {
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            whileHover={{
              backgroundColor: "transparent",
              color: "#0a0a0a",
              outline: "5px solid #0a0a0a",
            }}
            className="px-6 py-4 bg-neutral-950 rounded-[50px] font-semibold text-sm lg:text-base"
          >
            Book Appointment
          </motion.button>
          <motion.button
            onClick={() => {
              window.open("tel:+916380093009", "_self");
            }}
            whileHover={{
              backgroundColor: "#0a0a0a",
              color: "#ededed",
            }}
            className="px-6 py-4 border-2 border-neutral-950 text-neutral-950 rounded-[50px] font-semibold flex items-center gap-2 text-sm lg:text-base"
          >
            <Phone size={18} />
            Talk to Care Team
          </motion.button>
        </div>
      </div>
      <div className="absolute flex gap-6 justify-center items-center right-0 lg:right-5 cursor-pointer rotate-90">
        <p className="text-neutral-950">Scroll to explore</p>
        <CircleArrowRight className="text-neutral-950" />
      </div>
    </div>
  );
};

export default Hero;
