"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const Testimonials = () => {
  const cardAnimation = {
    hidden: {
      opacity: 0,
      scale: 0,
    },
    visible: {
      opacity: 1,
      transition: { type: "spring", duration: 1 },
      scale: 1,
    },
    hover: {
      backgroundColor: "#fef9aa",
    },
  };
  return (
    <div className="min-h-screen min-w-screen section text-[#ededed]">
      <div className="bg-[url('/service-bg.png')] bg-cover w-[95vw] h-auto rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 p-10 h-full row-auto gap-5">
          <h1 className="text-5xl col-span-2 font-semibold max-w-[40vw]">
            What Our Patients Say
          </h1>
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black  row-span-3 col-span-2"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/1.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">R.S.</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Chennai
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h1 className="font-semibold">Life-changing treatment! </h1>
              <p className="mt-5 text-lg ">
                I was suffering from migraines for years. After 3 months of
                treatment here, I feel like I have my life back! The
                personalized approach and natural remedies made all the
                difference.
                <br />
                <br />
                Dr. Abel took the time to understand my complete health history
                and provided a treatment plan that addressed the root cause, not
                just the symptoms.
              </p>
            </div>
          </motion.div>
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black row-span-2 col-span-2 lg:col-span-1"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/2.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">Priya</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Bengaluru
                </p>
              </div>
            </div>
            <div className="mt-5">
              <h1 className="font-semibold">Easy & Convenient </h1>
              <p className="mt-5 text-lg ">
                The online consultation was so easy and convenient. Dr. Abel
                explained everything in detail and I felt truly cared for.
              </p>
            </div>
          </motion.div>{" "}
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black row-span-1 col-span-2 lg:col-span-1"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/3.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">Anitha K.</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Nagercoil
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Natural healing works! </h1>
            </div>
          </motion.div>{" "}
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black row-span-1 col-span-2 lg:col-span-1"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/4.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">Ramesh M.</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Dubai, UAE
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Caring & Professional </h1>
            </div>
          </motion.div>
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black row-span-1 col-span-2 lg:col-span-2"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/5.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">Lakshmi S.</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Madurai
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Excellent Results </h1>
              <p className="mt-5 text-lg ">
                My child&#39;s recurring cold and cough issues have
                significantly improved with homoeopathic treatment. Highly
                recommend AWHCC!
              </p>
            </div>
          </motion.div>{" "}
          <motion.div
            variants={cardAnimation}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            className="bg-yellow-100 border-[2px] text-3xl text-black rounded-2xl p-5 border-black row-span-1 col-span-2"
          >
            <div className="flex flex-row gap-5 items-center">
              <Image
                src="/profile/6.jpg"
                alt="Profile image"
                width={24}
                height={24}
                className="w-[10%] aspect-square object-cover rounded-full border-[2px] border-neutral-950"
              />
              <div className="flex flex-col justify-start items-start">
                <h1 className="font-semibold text-xl">Suresh P.</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Coimbatore
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Women&#39;s Wellness </h1>
              <p className="mt-5 text-lg ">
                After struggling with hormonal issues for years, I finally found
                relief through homoeopathy at AWHCC. Thank you, Dr. Abel!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
