"use client";
import React from 'react'
import Image from "next/image";
import { motion } from "framer-motion";
import { CircleArrowDown, CircleArrowRight } from 'lucide-react';
import { WordPullUp } from './ui/word-pull-up';
const Hero = () => {
  return (
    <div className=" bg-[url('/small-hero-bg.png')] lg:bg-[url('/hero-bg-image.png')] pl-3 section  w-full bg-cover h-[95vh] rounded-2xl flex flex-col items-start justify-center text-[#ededed]">
      <div className="flex flex-col items-start lg:pl-3">
        <WordPullUp
          className="text-lg font-medium text-neutral-900 lg:text-nowrap text-wrap max-w-[70vw] -mb-3 ml-3 "
          words="Expert Dental care in namma Nagercoil !!!"
        />

        <motion.h1
          initial={{ y: -100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-neutral-950 font-semibold text-[20vw] lg:text-[20vh] text-left max-w-[500px] leading-0"
        >
          Dental
        </motion.h1>
        <motion.h1
          initial={{ y: -100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-neutral-950 font-semibold text-[20vw] lg:text-[20vh] text-left max-w-[500px] leading-none"
        >
          Care
        </motion.h1>
        <motion.button
          whileHover={{
            backgroundColor: "transparent",
            color: "#0a0a0a",
            outline: "5px solid #0a0a0a",
          }}
          className="px-6 py-4 bg-neutral-950 rounded-[50px] mt-10 font-semibold"
        >
          Book an Appointment
        </motion.button>
      </div>
      <div className="absolute flex gap-6 justify-center items-center right-0 lg:right-5 cursor-pointer rotate-90">
        <p className="text-neutral-950 ">Scroll to explore</p>
        <CircleArrowRight className="text-neutral-950" />
      </div>
    </div>
  );
}

export default Hero