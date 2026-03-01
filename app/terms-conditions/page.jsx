"use client";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiFileText,
  FiCalendar,
  FiActivity,
  FiCreditCard,
  FiMonitor,
  FiGlobe,
  FiAlertTriangle,
  FiRefreshCw,
  FiMessageCircle,
} from "react-icons/fi";
import Footer from "../components/Footer";

export default function TermsConditionsPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: "1. Appointments",
      content: [
        "• Consultations are strictly by prior appointment",
        "• Appointment confirmation is subject to availability and scheduling",
        "• Delays or missed appointments may require rescheduling",
      ],
    },
    {
      icon: <FiActivity className="w-6 h-6" />,
      title: "2. Medical Services",
      content: [
        "• Services are provided by qualified healthcare professionals",
        "• Treatment is individualised and based on clinical judgement",
        "• No guarantees of cure or specific outcomes are made",
      ],
    },
    {
      icon: <FiCreditCard className="w-6 h-6" />,
      title: "3. Payments",
      content: [
        "• Consultation fees must be paid as per clinic policy",
        "• Medicine costs are separate unless specified",
        "• Payments once made are subject to refund policy",
      ],
    },
    {
      icon: <FiMonitor className="w-6 h-6" />,
      title: "4. Online Consultations",
      content: [
        "• Patients are responsible for stable internet connectivity",
        "• Technical issues from the patient's side are not the clinic's liability",
        "• Online consultations are not for emergencies",
      ],
    },
    {
      icon: <FiGlobe className="w-6 h-6" />,
      title: "5. Use of Website",
      content: [
        "• Website content is for informational purposes only",
        "• Content does not substitute direct medical consultation",
        "• Unauthorized use, copying, or misuse of content is prohibited",
      ],
    },
    {
      icon: <FiAlertTriangle className="w-6 h-6" />,
      title: "6. Right to Refuse or Discontinue Services",
      content: [
        "AWHCC reserves the right to refuse or discontinue services in cases of:",
        "• Abusive behaviour",
        "• Non-compliance with medical advice",
        "• Misuse of services",
      ],
    },
    {
      icon: <FiRefreshCw className="w-6 h-6" />,
      title: "7. Modifications",
      content: [
        "AWHCC may update these Terms & Conditions at any time. Continued use implies acceptance of revised terms.",
      ],
    },
    {
      icon: <FiMessageCircle className="w-6 h-6" />,
      title: "8. WhatsApp Communications",
      content: [
        "By providing your WhatsApp-registered mobile number and booking an appointment, you expressly consent to receive WhatsApp messages from AWHCC via the Meta WhatsApp Business Cloud API. These messages may include:",
        "• Appointment confirmations, reminders (24 hours and 1 hour prior), and rescheduling notices",
        "• Prescription readiness and dispensing notifications",
        "• Follow-up reminders and general healthcare communications",
        "• Responses to messages you initiate with our WhatsApp chatbot",
        "Opt-Out: You may stop receiving WhatsApp messages at any time by sending the word STOP to our WhatsApp business number. You can restart notifications by sending START.",
        "Message Frequency: Message frequency varies based on your appointments and interactions. Standard messaging rates from your mobile carrier may apply.",
        "Third-Party Platform: WhatsApp messages are delivered through Meta Platforms, Inc. WhatsApp Business Cloud API. By opting in, you acknowledge that your phone number and message content are processed by Meta in accordance with Meta's Privacy Policy (https://www.facebook.com/privacy/policy/).",
        "You are not required to consent to WhatsApp communications as a condition of receiving medical services from AWHCC.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
            <FiFileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms and Conditions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These Terms and Conditions govern the use of services provided by
            ABEL WELLNESS AND HOMOEOPATHIC CARE CENTRE (AWHCC).
          </p>
          <p className="text-sm text-gray-500 mt-4">
            By booking an appointment or using our services, you agree to these
            terms. This includes consent to receive WhatsApp communications as
            described in Section 8.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h2>
              </div>
              <div className="text-gray-600 space-y-2 pl-12">
                {section.content.map((line, lineIndex) => (
                  <p
                    key={lineIndex}
                    className={line.startsWith("•") ? "ml-4" : ""}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Last updated: March 2026 | For questions about these terms, contact
            us at{" "}
            <a
              href="mailto:abelwhcc@gmail.com"
              className="text-blue-600 hover:underline"
            >
              abelwhcc@gmail.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
