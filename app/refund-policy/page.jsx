"use client";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiDollarSign,
  FiXCircle,
  FiCalendar,
  FiRotateCcw,
  FiMonitor,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import Footer from "../components/Footer";

export default function RefundPolicyPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <FiXCircle className="w-6 h-6" />,
      title: "1. Appointment Cancellation",
      content: [
        "• Cancellations should be informed in advance",
        "• Late cancellations or no-shows may not be eligible for refund",
      ],
    },
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: "2. Rescheduling",
      content: [
        "• Rescheduling is subject to availability",
        "• Requests should be made as early as possible",
      ],
    },
    {
      icon: <FiRotateCcw className="w-6 h-6" />,
      title: "3. Refund Policy",
      content: [
        "• Consultation fees are non-refundable once consultation is completed",
        "• If consultation cannot be provided due to clinic-related reasons, rescheduling or refund will be considered",
        "• Medicine charges are non-refundable once dispatched",
      ],
    },
    {
      icon: <FiMonitor className="w-6 h-6" />,
      title: "4. Online Consultation",
      content: [
        "• Technical issues from the patient's side do not qualify for refunds",
        "• Clinic-side technical failures will be reviewed case-by-case",
      ],
    },
    {
      icon: <FiAlertCircle className="w-6 h-6" />,
      title: "5. Exceptional Circumstances",
      content: [
        "Special situations may be reviewed at the discretion of clinic management.",
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <FiDollarSign className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Refund, Cancellation & Rescheduling Policy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AWHCC follows a transparent policy to ensure fairness to both
            patients and healthcare professionals.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
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

        {/* Final Note */}
        <div className="mt-12 p-6 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <FiInfo className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Final Note</h3>
              <p className="text-green-700">
                All policies are designed to ensure ethical medical practice,
                proper consultation time, and continuity of care.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Last updated: January 2026 | For questions about this policy,
            contact us at{" "}
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
