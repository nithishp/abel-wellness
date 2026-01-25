"use client";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMonitor,
  FiUser,
  FiFileText,
  FiAlertTriangle,
  FiPackage,
  FiLock,
  FiCheck,
} from "react-icons/fi";
import Footer from "../components/Footer";

export default function ConsentPage() {
  const router = useRouter();

  const sections = [
    {
      icon: <FiMonitor className="w-6 h-6" />,
      title: "1. Nature of Online Consultation",
      content: [
        "Online consultations are conducted through audio/video or digital communication platforms. They involve medical history taking, discussion, and professional opinion based on the information shared by the patient.",
        "",
        "The patient understands that:",
        "• Physical examination may be limited or not possible",
        "• Clinical decisions are based on history, symptoms, and available reports",
      ],
    },
    {
      icon: <FiUser className="w-6 h-6" />,
      title: "2. Voluntary Participation",
      content: [
        "The patient chooses online consultation voluntarily and understands that:",
        "• An in-clinic consultation may be advised when required",
        "• Online consultation is not suitable for medical emergencies",
      ],
    },
    {
      icon: <FiFileText className="w-6 h-6" />,
      title: "3. Accuracy of Information",
      content: [
        "The patient confirms that:",
        "• All information shared is true and complete to the best of their knowledge",
        "• Any omission, incorrect, or misleading information may affect medical advice and outcomes",
      ],
    },
    {
      icon: <FiAlertTriangle className="w-6 h-6" />,
      title: "4. Scope & Limitations",
      content: [
        "• Medical advice is individualised, not guaranteed",
        "• Outcomes vary between individuals",
        "• Online consultation does not replace emergency medical care",
        "",
        "In emergencies, the patient agrees to seek immediate hospital care.",
      ],
    },
    {
      icon: <FiPackage className="w-6 h-6" />,
      title: "5. Medicines & Dispatch",
      content: [
        "• Medicines are prescribed only after consultation",
        "• For online consultations, medicines are dispatched after payment confirmation",
        "• Medicines once dispatched are non-returnable",
      ],
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "6. Confidentiality",
      content: [
        "All patient information is treated as confidential and handled according to medical ethics and applicable laws. The patient understands that digital communication carries inherent risks despite reasonable security measures.",
      ],
    },
    {
      icon: <FiCheckCircle className="w-6 h-6" />,
      title: "7. Consent Declaration",
      content: [
        "By proceeding with booking and attending the consultation, the patient confirms informed consent to the above terms. This consent is valid without physical or digital signature.",
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <FiCheckCircle className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Consent for Online Consultation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            By booking and attending an online consultation with ABEL WELLNESS
            AND HOMOEOPATHIC CARE CENTRE (AWHCC), the patient agrees to the
            terms outlined below.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
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
                    className={
                      line.startsWith("•") ? "ml-4" : line === "" ? "h-2" : ""
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Agreement Box */}
        <div className="mt-12 p-6 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-start gap-3">
            <FiCheck className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-800 mb-2">
                Your Agreement
              </h3>
              <p className="text-purple-700">
                By proceeding to book an online consultation, you acknowledge
                that you have read, understood, and agree to these terms and
                conditions for online consultation services.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Last updated: January 2026 | For questions about this consent,
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
