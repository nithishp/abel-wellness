"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
const About = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-evenly bg-transparent w-screen section">
      <div className="p-10 lg:max-w-[40vw] gap-10">
        <h1 className="text-neutral-950 text-bold text-5xl my-4 mb-10">
          Crafting smiles one smile at a time
        </h1>
        <motion.p
          initial={{ y: 100, opacity: 0 }}
          viewport={{ amount: 0.5 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-lg  text-neutral-800 text-justify my-6"
        >
          At Dental Care, we are committed to providing high quality dental
          services tailored to meet the unique needs of each patient. With years
          of experience and a compassionate approach, our dedicated team is here
          to guide you on your journey to optimal dental health. We believe that
          everyone deserves a smile they can be proud of, and we’re here to make
          that a reality
        </motion.p>
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-neutral-950 border-[1px] px-6 py-4 rounded-full bg-transparent text-black"
        >
          About clinic
        </motion.button>
      </div>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        viewport={{ amount: 0.3 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-end items-center p-10 lg:pr-10"
      >
        <Image
          src="/about-image.png"
          width={700}
          height={700}
          alt="dentist image"
          className="rounded-2xl  h-[70vh] w-full lg:w-[60%] object-cover"
        />
      </motion.div>
    </div>
  );
};

export default About;
