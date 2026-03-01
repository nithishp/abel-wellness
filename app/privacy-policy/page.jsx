"use client";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiShield,
  FiLock,
  FiDatabase,
  FiUser,
  FiLink,
  FiRefreshCw,
  FiMessageCircle,
  FiBell,
} from "react-icons/fi";
import Footer from "../components/Footer";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <FiDatabase className="w-6 h-6" />,
      title: "1. Information Collected",
      content: [
        "We may collect:",
        "• Personal details (name, contact information including WhatsApp-registered mobile number)",
        "• Medical history and consultation details",
        "• Reports and prescriptions",
        "• Payment and appointment information",
        "• WhatsApp conversation data (messages exchanged with our chatbot, message timestamps, delivery status, and opt-in/opt-out status)",
      ],
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "2. Use of Information",
      content: [
        "Collected information is used for:",
        "• Providing medical care and follow-up",
        "• Appointment scheduling and communication",
        "• Sending WhatsApp notifications (appointment reminders, prescription alerts, follow-ups) where you have opted in",
        "• Legal and regulatory compliance",
      ],
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "3. Confidentiality",
      content: [
        "• Patient data is handled according to medical ethics",
        "• Information is not shared with third parties without consent, except where legally required",
      ],
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "4. Data Security",
      content: [
        "Reasonable administrative and technical measures are used to protect patient data. However, no digital system is completely risk-free.",
      ],
    },
    {
      icon: <FiUser className="w-6 h-6" />,
      title: "5. Patient Rights",
      content: [
        "Patients may:",
        "• Request access to their records",
        "• Request correction of inaccurate information",
        "• Withdraw consent for non-essential communication",
      ],
    },
    {
      icon: <FiLink className="w-6 h-6" />,
      title: "6. External Links",
      content: [
        "The website may contain links to external platforms. AWHCC is not responsible for their privacy practices.",
      ],
    },
    {
      icon: <FiRefreshCw className="w-6 h-6" />,
      title: "7. Policy Updates",
      content: [
        "This Privacy Policy may be updated periodically. Continued use of services indicates acceptance.",
      ],
    },
    {
      icon: <FiMessageCircle className="w-6 h-6" />,
      title: "8. WhatsApp & Meta Data Processing",
      content: [
        "AWHCC uses the Meta WhatsApp Business Cloud API to send appointment reminders, prescription notifications, and other healthcare communications to patients who have provided their WhatsApp-registered mobile number.",
        "Data shared with Meta/WhatsApp:",
        "• Your WhatsApp-registered phone number",
        "• Message content (appointment details, prescription status, reminders)",
        "• Message metadata (timestamps, delivery and read receipts)",
        "Meta Platforms, Inc. processes this data as a data sub-processor in accordance with their own Privacy Policy, available at: https://www.facebook.com/privacy/policy/. AWHCC does not control Meta's data processing practices.",
        "Data Retention: WhatsApp message logs are retained in our systems for up to 12 months for audit and compliance purposes, after which they are deleted.",
        "Opt-In: By providing your mobile number when booking an appointment, you consent to receive WhatsApp messages from AWHCC.",
        "Opt-Out: You may withdraw consent at any time by sending STOP to our WhatsApp business number, or by contacting us at abelwhcc@gmail.com. Opting out will not affect your ability to receive medical services.",
        "We do not sell or share your WhatsApp data with third parties other than Meta as the communication platform provider.",
      ],
    },
    {
      icon: <FiBell className="w-6 h-6" />,
      title: "9. Cookies & Analytics",
      content: [
        "Our website uses minimal analytics to improve user experience. No personally identifiable information is tracked across websites or shared with advertising platforms.",
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <FiShield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ABEL WELLNESS AND HOMOEOPATHIC CARE CENTRE (AWHCC) is committed to
            protecting patient privacy and confidentiality.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
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
            Last updated: March 2026 | For questions about this policy, contact
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
