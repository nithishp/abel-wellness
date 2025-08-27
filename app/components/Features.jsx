"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
const Features = () => {
  return (
    <div className="min-h-screen min-w-screen ">
      <div className="w-[95vw] h-auto ">
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10">
          <h1 className="text-3xl lg:text-5xl font-semibold max-w-[90vw] text-neutral-950 lg:max-w-[40vw] text-center lg:text-left">
            Modern dentistry with a personal touch.
          </h1>
          <p className="text-center lg:text-right mt-5 text-neutral-900 lg:mt-0 lg:max-w-[40vw] text-lg font-light">
            where your comfort and dental health are our highest priorities. Our
            team of skilled professionals is here to make your visit as smooth
            and stress-free as possible, using the latest technology and
            personalized care to deliver exceptional results.
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
            <h1 className="text-3xl font-semibold mb-5">100% successfull</h1>
            <p className="mt-3 max-w-[90%]">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sed
              dicta, blanditiis dignissimos placeat in autem. Quam magnam
              explicabo eveniet voluptatibus, atque natus veritatis, sunt
              assumenda.
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
              Qualified Staff
            </h1>
            <p className="text-neutral-700 text-sm">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem,
              esse. Praesentium obcaecati quidem, dolores enim id repudiandae
              iste illo ducimus neque fugit modi quaerat vitae eius amet porro
              explicabo excepturi
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
              Qualified Staff
            </h1>
            <p className="text-neutral-700 text-sm invisible">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem,
              esse. Praesentium obcaecati quidem, dolores enim id repudiandae
              iste illo ducimus neque fugit modi quaerat vitae eius amet porro
              explicabo excepturi
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
              Qualified Staff
            </h1>
            <p className="text-neutral-700 text-sm">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem,
              esse. Praesentium obcaecati quidem, dolores enim id repudiandae
              iste illo ducimus neque fugit modi quaerat vitae eius amet porro
              explicabo excepturi
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Features;
