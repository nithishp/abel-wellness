'use client'
import { MoveUpRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

const Services = () => {
  const cards = [
    {
      title: "General Dentistry",
      description:
        "Regular check-ups, cleanings, and patient education to keep your teeth and gums healthy. Preventive care is the foundation of a beautiful smile.",
      bgColor: "#b0fbee",
      points: [
        "Routine Cleanings and Exams",
        "Oral Cancer Screenings",
        "Personalized Home Care Advice",
      ],
    },
    {
      title: "Cosmetic Dentistry",
      description:
        "Enhance your smile with our range of cosmetic services, including teeth whitening, veneers, and smile makeovers. Let us help you achieve the smile you’ve always wanted.",
      bgColor: "#d4a6f5",
      points: ["Teeth Whitening", "Veneers", "Smile Makeovers"],
    },
    {
      title: "Restorative Dentistry",
      description:
        "From fillings and crowns to implants and dentures, we provide solutions to restore the function and appearance of your teeth, helping you eat, speak, and smile with confidence.",
      bgColor: "#b1f5a6",
      points: [
        "Tooth-Colored Fillings",
        "Crowns and Bridges",
        "Dental Implants",
      ],
    },
  ];

  return (
    <div className="min-h-screen h-auto min-w-screen section">
      <div className="bg-[url('/service-bg.png')] bg-cover flex flex-col justify-evenly w-full h-auto  lg:h-[95vh] rounded-2xl">
        <div className="w-full flex flex-col lg:flex-row justify-start items-start lg:justify-between p-6 lg:p-10">
          <h1 className="text-3xl lg:text-5xl font-semibold max-w-[90vw] lg:max-w-[40vw] text-center lg:text-left">
            Elevating oral health with personalized service.
          </h1>
          <p className="text-center lg:text-right mt-5 lg:mt-0 lg:max-w-[40vw] text-lg font-light">
            where your comfort and dental health are our highest priorities. Our
            team of skilled professionals is here to make your visit as smooth
            and stress-free as possible, using the latest technology and
            personalized care to deliver exceptional results.
          </p>
        </div>
        <div className="  lg:px-10 py-5 lg:py-0 flex flex-col items-center lg:flex-row justify-evenly gap-5">
          {cards.map((card, index) => (
            <motion.div
              initial={{ y: -100 * index, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              style={{ backgroundColor: card.bgColor }}
              key={index}
              className="w-full max-w-[340px] lg:max-w-[400px] h-auto lg:h-[400px] rounded-2xl p-6 lg:p-10"
            >
              <div className="flex flex-row justify-between">
                <h1 className="text-neutral-800 font-semibold text-xl lg:text-3xl max-w-[70%] mb-5 lg:mb-7">
                  {card.title}
                </h1>
                <div className="bg-neutral-800 rounded-full h-8 w-8 lg:h-10 lg:w-10 flex justify-center items-center p-2 lg:p-3">
                  <MoveUpRight />
                </div>
              </div>
              <p className="text-xs lg:text-sm text-neutral-800 border-b-2 border-[#140909] pb-5 lg:pb-7">
                {card.description}
              </p>

              <ul className="mt-4 lg:mt-6 list-disc list-inside text-neutral-800">
                {card.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
