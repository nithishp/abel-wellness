"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiTrash2,
  FiDatabase,
  FiMail,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiMessageCircle,
  FiSend,
} from "react-icons/fi";
import Footer from "../components/Footer";
import { toast } from "sonner";

export default function DataDeletionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) {
      toast.error("Please provide your email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/data-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "web-form" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setReferenceCode(data.confirmation_code);
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err.message || "Failed to submit request. Please email us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      icon: <FiMail className="w-6 h-6" />,
      title: "Step 1 — Submit a Request",
      content:
        "Fill in the form below or email us at abelwhcc@gmail.com with subject line 'Data Deletion Request'. Include the name, email address, and/or WhatsApp number linked to your account.",
    },
    {
      icon: <FiCheckCircle className="w-6 h-6" />,
      title: "Step 2 — Identity Verification",
      content:
        "We will verify your identity by sending a confirmation email to the address you provide. This step ensures no unauthorised deletion of your records.",
    },
    {
      icon: <FiClock className="w-6 h-6" />,
      title: "Step 3 — Processing (up to 30 days)",
      content:
        "Once verified, we will delete your personal data from our systems within 30 days. Where retention is legally required (e.g., medical records under Indian law), we will inform you of what cannot be deleted and the reason.",
    },
    {
      icon: <FiDatabase className="w-6 h-6" />,
      title: "Step 4 — Confirmation",
      content:
        "You will receive an email confirmation once the deletion is complete, along with details of any data that was retained for legal or regulatory reasons.",
    },
  ];

  const dataTypes = [
    {
      category: "Personal Information",
      items: [
        "Full name",
        "Email address",
        "Mobile / WhatsApp number",
        "Profile photo",
      ],
      deletable: true,
    },
    {
      category: "WhatsApp Conversations",
      items: [
        "Chatbot conversation history",
        "Message logs and timestamps",
        "Appointment booking data via WhatsApp",
        "Opt-in / opt-out status",
      ],
      deletable: true,
    },
    {
      category: "Appointment History",
      items: [
        "Past and upcoming appointments",
        "Doctor assignment records",
        "Appointment notes",
      ],
      deletable: true,
    },
    {
      category: "Medical Records",
      items: [
        "Consultation notes and prescriptions",
        "Medical history",
        "Investigation reports",
      ],
      deletable: false,
      note: "Medical records may be retained for up to 7 years as required under the Indian Medical Council Act and applicable health regulations.",
    },
    {
      category: "Billing & Payments",
      items: ["Invoice records", "Payment history", "GST transaction records"],
      deletable: false,
      note: "Financial records are retained for 8 years as required under the Income Tax Act, 1961 and GST regulations.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <FiTrash2 className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Deletion Request
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You have the right to request deletion of your personal data held by
            ABEL WELLNESS AND HOMOEOPATHIC CARE CENTRE (AWHCC). Use the form
            below or email us directly.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
            <FiMessageCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">
              This page also covers data collected via WhatsApp Business
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            How to Request Data Deletion
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="p-2 bg-red-50 rounded-lg text-red-600 h-fit flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What data we hold */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Data We Hold & Deletion Eligibility
          </h2>
          <div className="space-y-4">
            {dataTypes.map((type, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                  type.deletable ? "border-green-100" : "border-amber-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {type.category}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                      type.deletable
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {type.deletable ? "✓ Deletable" : "⚠ Legally Retained"}
                  </span>
                </div>
                <ul className="text-gray-600 space-y-1 pl-4">
                  {type.items.map((item, j) => (
                    <li key={j} className="list-disc list-inside text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
                {type.note && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <FiAlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700">{type.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Request Form */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Submit a Deletion Request
          </h2>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Request Received
              </h3>
              <p className="text-green-700 mb-4">
                We have received your data deletion request and will process it
                within 30 days. A confirmation will be sent to your email.
              </p>
              {referenceCode && (
                <div className="inline-block bg-white border border-green-200 rounded-lg px-6 py-3">
                  <p className="text-sm text-gray-500 mb-1">
                    Your reference code
                  </p>
                  <p className="text-lg font-mono font-bold text-gray-900">
                    {referenceCode}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Your full name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp / Mobile Number
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium border-r-0 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="98765 43210"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Include the number used when booking appointments via
                    WhatsApp
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Deletion (optional)
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    rows={3}
                    placeholder="Let us know why you'd like your data deleted..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400 transition-all resize-none"
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex gap-2">
                    <FiAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      <strong>Please note:</strong> Deletion is irreversible.
                      Medical and billing records required by law will be
                      retained but isolated from active use. Deleting your data
                      will also remove access to your patient portal.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Submit Deletion Request
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Contact alternative */}
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Prefer to email us directly? Send a request to{" "}
            <a
              href="mailto:abelwhcc@gmail.com?subject=Data%20Deletion%20Request"
              className="text-blue-600 hover:underline font-medium"
            >
              abelwhcc@gmail.com
            </a>{" "}
            with the subject <em>"Data Deletion Request"</em>. We respond within{" "}
            <strong>3 business days</strong> and complete deletions within{" "}
            <strong>30 days</strong>.
          </p>
          <p className="text-sm text-gray-500 text-center mt-3">
            Last updated: March 2026 | ABEL WELLNESS AND HOMOEOPATHIC CARE
            CENTRE (AWHCC)
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
