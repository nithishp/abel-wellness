"use client";
import { motion } from "framer-motion";
import React from "react";

const testimonials = [
  // Indian testimonials (60%)
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "Chennai, Tamil Nadu",
    title: "Life-changing treatment!",
    content:
      "I was suffering from chronic migraines for over 8 years. After just 3 months of treatment at AWHCC, I feel like I have my life back! Dr. Dinesh took the time to understand my complete health history and lifestyle. The personalized approach and natural remedies made all the difference. No more dependency on painkillers!",
    rating: 5,
    condition: "Chronic Migraines",
  },
  {
    id: 2,
    name: "Priya Venkatesh",
    location: "Bengaluru, Karnataka",
    title: "Finally found relief from anxiety",
    content:
      "The online consultation was so convenient for my busy schedule. Dr. Preethi patiently listened to all my concerns about work-related stress and anxiety. Within weeks of starting treatment, I noticed a significant improvement in my sleep quality and overall mental well-being. Truly grateful!",
    rating: 5,
    condition: "Anxiety & Stress",
  },
  {
    id: 3,
    name: "Anitha Krishnamurthy",
    location: "Nagercoil, Tamil Nadu",
    title: "Natural healing truly works!",
    content:
      "As a mother of two, I was skeptical about homoeopathy at first. But after seeing how gently and effectively it treated my children's recurring allergies without any side effects, I'm now a firm believer. The whole family consults Dr. Dinesh now!",
    rating: 5,
    condition: "Childhood Allergies",
  },
  {
    id: 4,
    name: "Suresh Pillai",
    location: "Coimbatore, Tamil Nadu",
    title: "Digestive issues resolved",
    content:
      "Years of acidity and IBS made my daily life miserable. Conventional medicine only provided temporary relief. Dr. Dinesh's holistic approach addressed my diet, stress levels, and prescribed the right remedies. Six months later, I can enjoy my favorite foods again!",
    rating: 5,
    condition: "IBS & Acidity",
  },
  {
    id: 5,
    name: "Lakshmi Sundaram",
    location: "Madurai, Tamil Nadu",
    title: "Excellent care for my child",
    content:
      "My 5-year-old son had recurring cold, cough, and tonsillitis issues. We were tired of repeated antibiotics. AWHCC's gentle treatment not only resolved his immediate symptoms but also boosted his immunity significantly. He hasn't missed school in months!",
    rating: 5,
    condition: "Pediatric Care",
  },
  {
    id: 6,
    name: "Deepa Nair",
    location: "Kochi, Kerala",
    title: "Hormonal balance restored",
    content:
      "PCOS had been affecting my life for years - irregular cycles, weight gain, and mood swings. Dr. Preethi's treatment plan was comprehensive and considerate of my overall well-being. After 8 months, my cycles are regular and I feel like myself again.",
    rating: 5,
    condition: "PCOS",
  },
  // Western/European testimonials (40%)
  {
    id: 7,
    name: "Sarah Mitchell",
    location: "London, United Kingdom",
    title: "Best decision for my health",
    content:
      "I discovered AWHCC through a friend's recommendation while searching for alternative treatments for my eczema. The online consultations are seamless, and Dr. Dinesh's expertise in homoeopathy is remarkable. My skin has improved dramatically, and the flare-ups are now rare.",
    rating: 5,
    condition: "Eczema",
  },
  {
    id: 8,
    name: "Michael Thompson",
    location: "Melbourne, Australia",
    title: "Professional & knowledgeable",
    content:
      "Despite the time zone difference, the consultation experience was smooth. Dr. Preethi's thorough approach to understanding my chronic fatigue syndrome impressed me. The treatment has given me back the energy I thought I'd lost forever. Highly recommend to anyone seeking genuine healing.",
    rating: 5,
    condition: "Chronic Fatigue",
  },
  {
    id: 9,
    name: "Emma Schmidt",
    location: "Munich, Germany",
    title: "Gentle yet effective treatment",
    content:
      "I was hesitant about online medical consultations, but AWHCC exceeded my expectations. The remedies for my joint pain and arthritis have been remarkably effective. I appreciate the follow-up care and Dr. Dinesh's genuine concern for my progress.",
    rating: 5,
    condition: "Arthritis",
  },
  {
    id: 10,
    name: "James O'Connor",
    location: "Dublin, Ireland",
    title: "A holistic approach that works",
    content:
      "After trying numerous treatments for my insomnia and stress, I found lasting relief through homoeopathy at AWHCC. Dr. Preethi's calm demeanor and detailed consultations made me feel truly understood. I finally sleep through the night!",
    rating: 5,
    condition: "Insomnia",
  },
];

const TestimonialCard = ({ testimonial, className, featured = false }) => {
  const cardAnimation = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", duration: 0.8, bounce: 0.3 },
    },
  };

  return (
    <motion.div
      variants={cardAnimation}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`group bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 text-black rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 ${className}`}
    >
      {/* Quote Icon */}
      <div className="mb-4">
        <svg
          className="w-8 h-8 text-amber-400 opacity-60"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Condition Badge */}
      <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-200/60 text-amber-800 rounded-full mb-3">
        {testimonial.condition}
      </span>

      {/* Title */}
      <h3
        className={`font-bold text-neutral-800 mb-3 ${
          featured ? "text-xl" : "text-lg"
        }`}
      >
        {testimonial.title}
      </h3>

      {/* Content */}
      <p
        className={`text-neutral-600 leading-relaxed mb-5 ${
          featured ? "text-base" : "text-sm"
        }`}
      >
        {testimonial.content}
      </p>

      {/* Rating Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <svg
            key={i}
            className="w-4 h-4 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-3 pt-4 border-t border-amber-200/50">
        {/* Initial Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {testimonial.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <h4 className="font-semibold text-neutral-800 text-sm">
            {testimonial.name}
          </h4>
          <p className="text-xs text-neutral-500">{testimonial.location}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
            Patient Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
            What Our Patients Say
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Real stories from real patients who found healing through our
            personalized homoeopathic care
          </p>
        </motion.div>

        {/* Testimonials Grid - Using CSS columns for masonry effect */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          <TestimonialCard
            testimonial={testimonials[0]}
            className="break-inside-avoid"
            featured={true}
          />
          <TestimonialCard
            testimonial={testimonials[1]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[6]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[2]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[7]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[3]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[4]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[8]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[5]}
            className="break-inside-avoid"
          />
          <TestimonialCard
            testimonial={testimonials[9]}
            className="break-inside-avoid"
          />
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap justify-center items-center gap-8 px-8 py-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-neutral-700 font-medium">
                2500+ Patients Treated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-neutral-700 font-medium">
                4.4/5 Average Rating
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-neutral-700 font-medium">
                Worldwide Consultations
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
