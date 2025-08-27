'use client'
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const Testimonials = () => {
  const cardAnimation = {
    hidden:{
      opacity:0,
      scale:0
    },
    visible:{
      opacity:1,
      transition: { type: "spring",duration:1 },
      scale:1
    },
    hover:{
      backgroundColor:'#fef9aa'
      
    }
  }
  return (
    <div className="min-h-screen min-w-screen section">
      <div className="bg-[url('/service-bg.png')] bg-cover w-[95vw] h-auto rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 p-10 h-full row-auto gap-5">
          <h1 className="text-5xl col-span-2 font-semibold max-w-[40vw]">
            Elevating oral health with personalized service.
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h1 className="font-semibold">Best dentist </h1>
              <p className="mt-5 text-lg ">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Optio
                fugit porro voluptate facere corporis eum rem ullam temporibus
                velit libero! Eos, officiis nihil voluptatum assumenda rem
                provident ad ea voluptas!
                <br />
                <br />
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rerum
                quasi quod eum! Ad deserunt eos nisi sequi quibusdam
                necessitatibus laudantium ipsam. Reprehenderit ipsum minus totam
                aliquid, ipsam aperiam iste nesciunt.
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>
            <div className="mt-5">
              <h1 className="font-semibold">100% Recommend </h1>
              <p className="mt-5 text-lg ">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Optio
                fugit porro voluptate facere corporis eum rem ullam temporibus
                velit libero!
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Good service </h1>
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Polite Doctor </h1>
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Very good </h1>
              <p className="mt-5 text-lg ">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Optio
                fugit porro voluptate facere corporis eum rem ullam.
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
                <h1 className="font-semibold text-xl">John Doe</h1>
                <p className="font-light text-sm italic text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="font-semibold">Fast treatment </h1>
              <p className="mt-5 text-lg ">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Optio
                fugit porro voluptate facere corporis eum rem ullam.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
