"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
const Features = () => {
  return (
    <div className="min-h-screen min-w-screen text-[#ededed]">
      <div className="w-[95vw] h-auto ">
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10">
          <h1 className="text-3xl lg:text-5xl font-semibold max-w-[90vw] text-neutral-950 lg:max-w-[40vw] text-center lg:text-left">
            Why Patients Trust AWHCC
          </h1>
          <p className="text-center lg:text-right mt-5 text-neutral-900 lg:mt-0 lg:max-w-[40vw] text-lg font-light">
            Your Healing Journey with ABEL – Book your consultation, share your
            health details securely, meet your doctor via video/audio
            consultation, and receive your treatment plan & follow-up guidance.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-6 p-10">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-neutral-950 h-auto lg:h-[30vh] flex justify-center flex-col  w-full  py-5 px-10 rounded-3xl"
          >
            <h1 className="text-3xl font-semibold mb-5">
              ✔ Experienced Doctors
            </h1>
            <p className="mt-3 max-w-[90%]">
              Our team includes experienced Homoeopathic Doctors and
              psychologists who provide comprehensive care tailored to your
              individual needs.
            </p>
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className='bg-neutral-950 h-[30vh]  w-full bg-[url("/feature-image-1.png")] bg-cover py-5 px-10 rounded-3xl'
          >
            {/* <Image src='/feature-image-1.png' alt='feature-image-1' width={500} height={500} /> */}
          </motion.div>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 p-10 -my-5">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className=" bg-transparent border-[1px] border-neutral-950 rounded-2xl h-fit p-5  "
          >
            <h1 className="text-neutral-900 font-semibold text-2xl mb-8 ">
              ✔ Safe & Natural Remedies
            </h1>
            <p className="text-neutral-700 text-sm">
              All our treatments are based on safe and natural remedies without
              any side effects, helping you heal gently and effectively.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 2 }}
            viewport={{ once: true }}
            className=' bg-transparent  bg-[url("/feature-image-2.png")] bg-cover bg-top rounded-2xl h-fit p-5  '
          >
            <h1 className="text-neutral-900 font-semibold text-2xl invisible mb-8 ">
              Natural Healing
            </h1>
            <p className="text-neutral-700 text-sm invisible">
              Placeholder text for image section
            </p>
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className=" bg-violet-300  rounded-2xl h-fit p-5  "
          >
            <h1 className="text-neutral-900 font-semibold text-2xl mb-8 ">
              ✔ 100% Confidential
            </h1>
            <p className="text-neutral-700 text-sm">
              Your privacy matters to us. All online consultations are 100%
              confidential, and we offer convenient care accessible anywhere in
              the world.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Features;
