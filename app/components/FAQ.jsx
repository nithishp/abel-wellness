"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question:
        "Is online consultation as effective as in-clinic consultation?",
      answer:
        "Online consultations are suitable for most chronic and follow-up cases. Case-taking, discussion, and treatment planning are done with the same clinical depth. However, conditions requiring physical examination or emergency care may need an in-clinic visit or referral.",
    },
    {
      question: "How long does the first consultation take?",
      answer:
        "The first consultation is usually longer than follow-ups, as it involves detailed case-taking. Adequate time is provided to understand your condition properly.",
    },
    {
      question: "What should I keep ready for the consultation?",
      answer:
        "Please keep: Previous medical records and investigation reports, old prescriptions and treatment details, and a list of current medications (if any). For online consultations, ensure a stable internet connection and a quiet environment.",
    },
    {
      question: "Will medicines be given in the first consultation itself?",
      answer:
        "If treatment is initiated, medicines are prescribed after the consultation and discussion of the treatment plan. For online consultations, medicines are dispatched after payment confirmation.",
    },
    {
      question: "How soon can I expect results?",
      answer:
        "Response varies based on the nature and duration of the condition, individual health status, and treatment consistency and follow-ups. Chronic conditions usually require time, and improvement is often gradual. No instant or guaranteed outcomes are promised.",
    },
    {
      question: "Do you treat all medical conditions?",
      answer:
        "AWHCC handles non-emergency, chronic, lifestyle-related, and functional health concerns. Acute emergencies, surgical conditions, or severe psychiatric cases are referred appropriately in the patient's best interest.",
    },
    {
      question: "Is follow-up necessary?",
      answer:
        "Yes. Follow-ups are a crucial part of homoeopathic care. They help assess response, modify treatment when required, and ensure safe progress.",
    },
    {
      question: "Are consultations and records kept confidential?",
      answer:
        "Yes. All consultations, medical information, and records are handled with strict confidentiality and professional ethics.",
    },
    {
      question: "Can I consult directly without reports?",
      answer:
        "Yes. Reports are helpful but not mandatory for the first consultation. If required, the doctor may advise appropriate investigations later.",
    },
    {
      question:
        "How do I contact the clinic if I have doubts after consultation?",
      answer:
        "You can contact our care team for guidance related to appointments, follow-ups, and medicine dispatch queries. Medical advice is provided only through scheduled consultations.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen min-w-screen py-16 bg-transparent">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              FAQs
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl lg:text-5xl font-bold text-neutral-950 mb-4"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-600 text-base lg:text-lg"
          >
            Find answers to common questions about our services and
            consultations.
          </motion.p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors duration-200"
              >
                <span className="text-neutral-900 font-medium text-base lg:text-lg pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown
                    className={`w-5 h-5 ${openIndex === index ? "text-emerald-600" : "text-neutral-400"}`}
                  />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="border-t border-neutral-100 pt-4">
                        <p className="text-neutral-600 text-sm lg:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center bg-emerald-50 rounded-2xl p-8"
        >
          <h3 className="text-neutral-900 font-semibold text-lg mb-2">
            Still have questions?
          </h3>
          <p className="text-neutral-600 text-sm mb-4">
            Our care team is here to help you with any queries.
          </p>
          <button
            onClick={() => {
              window.open("tel:+916380093009", "_self");
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium text-sm transition-colors duration-300"
          >
            Contact Care Team
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
