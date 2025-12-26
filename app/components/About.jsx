"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
const About = ({ id }) => {
  return (
    <div
      id={id}
      className="min-h-screen flex flex-col lg:flex-row items-center justify-evenly bg-transparent w-screen section text-[#ededed]"
    >
      <div className="p-10 lg:max-w-[40vw] gap-10">
        <h1 className="text-neutral-950 text-bold text-5xl my-4 mb-10">
          Healing with Care, Naturally
        </h1>
        <motion.p
          initial={{ y: 100, opacity: 0 }}
          viewport={{ amount: 0.5 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-lg  text-neutral-800 text-justify my-6"
        >
          At ABEL Wellness & Homoeopathy Care Center (AWHCC), we believe in
          treating people, not just symptoms. With a blend of classical
          homoeopathy and compassionate care, we help individuals of all ages
          restore balance, build immunity, and achieve true wellness.
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
          alt="homoeopathy wellness center"
          className="rounded-2xl  h-[70vh] w-full lg:w-[60%] object-cover"
        />
      </motion.div>
    </div>
  );
};

export default About;
