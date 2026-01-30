"use client";

import { createAppointment } from "@/lib/actions/appointment.actions";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import Link from "next/link";

const AppointmentSection = ({ id }) => {
  const [appointment, setAppointment] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    message: "",
    age: "",
    sex: "",
    schedule: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingPatientModal, setShowExistingPatientModal] =
    useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateAge = (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum > 0 && ageNum < 150;
  };

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        else if (value.trim().length < 2)
          error = "First name must be at least 2 characters";
        break;
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        else if (value.trim().length < 2)
          error = "Last name must be at least 2 characters";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!validateEmail(value))
          error = "Please enter a valid email address";
        break;
      case "phoneNumber":
        if (!value.trim()) error = "Phone number is required";
        else if (!validatePhone(value))
          error = "Please enter a valid phone number";
        break;
      case "age":
        if (!value.trim()) error = "Age is required";
        else if (!validateAge(value))
          error = "Please enter a valid age (1-149)";
        break;
      case "schedule":
        if (!value) error = "Please select an appointment date and time";
        else if (new Date(value) <= new Date())
          error = "Please select a future date and time";
        break;
    }

    return error;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setAppointment((prev) => ({ ...prev, [id]: value }));

    // Real-time validation
    const error = validateField(id, value);
    setErrors((prev) => ({ ...prev, [id]: error }));
  };

  const handleDateChange = (date) => {
    setAppointment((prev) => ({ ...prev, schedule: date }));

    // Real-time validation for date
    const error = validateField("schedule", date);
    setErrors((prev) => ({ ...prev, schedule: error }));
  };

  const formatDate = (date) => {
    const options = {
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(date).toLocaleString("en-US", options); // Use 'en-US' for AM/PM format
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors = {};
    Object.keys(appointment).forEach((key) => {
      if (key !== "message" && key !== "sex") {
        // message and sex are optional
        const error = validateField(key, appointment[key]);
        if (error) newErrors[key] = error;
      }
    });

    // Check if there are any errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors below", {
        description: "All required fields must be filled correctly",
        action: {
          label: "Close",
          onClick: () => console.log("Closed"),
        },
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Submitting appointment:", appointment);
      const result = await createAppointment(appointment);
      console.log(result, "scheduled Appointment");

      // Check if this is an existing patient
      if (result.isExistingPatient) {
        setShowExistingPatientModal(true);
      }

      setBookingSuccess(true);

      toast.success("Appointment Successfully Scheduled!", {
        description: result.date
          ? formatDate(result.date)
          : "We will contact you soon",
        action: {
          label: "Close",
          onClick: () => console.log("Closed"),
        },
      });

      // Reset form
      setAppointment({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        age: "",
        sex: "",
        message: "",
        schedule: null,
      });
      setErrors({});
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to schedule appointment", {
        description: error.message || "Please try again later",
        action: {
          label: "Close",
          onClick: () => console.log("Closed"),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formAnimation = {
    hidden: { opacity: 0, y: -500 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.2 },
    },
  };

  const inputAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const filterTime = (time) => {
    const hours = time.getHours();
    return hours >= 9 && hours <= 19; // 19 is 7 PM
  };

  return (
    <section
      id={id}
      className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 rounded-2xl"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Side - Info Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Get Started
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-6">
              Book Your <br />
              <span className="text-emerald-600">Consultation</span>
            </h2>
            <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
              Take the first step towards natural healing. Our experienced
              homoeopathic physicians will provide personalized care tailored to
              your health needs.
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800">
                    Flexible Scheduling
                  </h4>
                  <p className="text-neutral-600 text-sm">
                    Choose a time that works best for you, 9 AM - 7 PM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800">
                    Online & In-Person
                  </h4>
                  <p className="text-neutral-600 text-sm">
                    Consultations available via video call or at our clinic
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800">
                    Confidential & Secure
                  </h4>
                  <p className="text-neutral-600 text-sm">
                    Your health information is always protected
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
              <h4 className="font-semibold text-neutral-800 mb-4">
                Have Questions?
              </h4>
              <div className="space-y-3">
                <a
                  href="tel:+916380093009"
                  className="flex items-center gap-3 text-neutral-600 hover:text-emerald-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>+91 6380093009</span>
                </a>
                <a
                  href="mailto:contact@awhcc.com"
                  className="flex items-center gap-3 text-neutral-600 hover:text-emerald-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>contact@awhcc.com</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10 border border-neutral-100">
              <motion.form
                variants={formAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                onSubmit={onSubmit}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="firstName"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="firstName"
                      placeholder="John"
                      type="text"
                      aria-label="First Name"
                      className={`border px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        errors.firstName
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      variants={inputAnimation}
                      value={appointment.firstName}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                    {errors.firstName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.firstName}
                      </span>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="lastName"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="lastName"
                      placeholder="Doe"
                      type="text"
                      aria-label="Last Name"
                      className={`border px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        errors.lastName
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      variants={inputAnimation}
                      value={appointment.lastName}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                    {errors.lastName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.lastName}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:col-span-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="email"
                      placeholder="john@example.com"
                      type="email"
                      aria-label="Email"
                      className={`border px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        errors.email
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      variants={inputAnimation}
                      value={appointment.email}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                    {errors.email && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="phoneNumber"
                      placeholder="+91 98765 43210"
                      type="tel"
                      aria-label="Phone Number"
                      className={`border px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        errors.phoneNumber
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      variants={inputAnimation}
                      value={appointment.phoneNumber}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                    {errors.phoneNumber && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.phoneNumber}
                      </span>
                    )}
                  </div>

                  {/* Age */}
                  <div className="flex flex-col">
                    <label
                      htmlFor="age"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      Age <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      id="age"
                      placeholder="25"
                      type="number"
                      aria-label="Age"
                      className={`border px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        errors.age
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      variants={inputAnimation}
                      value={appointment.age}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                    {errors.age && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.age}
                      </span>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="sm:col-span-2 flex flex-col">
                    <label className="text-sm font-medium text-neutral-700 mb-2">
                      Preferred Date & Time{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={appointment.schedule}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy h:mm aa"
                      showTimeSelect
                      timeInputLabel="Time:"
                      placeholderText="Select date and time"
                      className={`w-full px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border ${
                        errors.schedule
                          ? "border-red-400 focus:ring-red-500"
                          : "border-neutral-200"
                      }`}
                      calendarClassName="rounded-xl border border-neutral-200 shadow-lg"
                      minDate={new Date()}
                      filterTime={filterTime}
                    />
                    {errors.schedule && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.schedule}
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <div className="sm:col-span-2 flex flex-col">
                    <label
                      htmlFor="message"
                      className="text-sm font-medium text-neutral-700 mb-2"
                    >
                      Message{" "}
                      <span className="text-neutral-400">(optional)</span>
                    </label>
                    <motion.textarea
                      id="message"
                      placeholder="Tell us about your health concerns..."
                      aria-label="Message"
                      className="border border-neutral-200 h-28 px-4 py-3 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                      variants={inputAnimation}
                      value={appointment.message}
                      onChange={handleInputChange}
                      viewport={{ once: true }}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:col-span-2 mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-medium shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    variants={inputAnimation}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Booking...
                      </>
                    ) : (
                      <>
                        Book Appointment
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Existing Patient Modal */}
      <AnimatePresence>
        {showExistingPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExistingPatientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  Welcome Back!
                </h3>
                <p className="text-neutral-600 mb-6">
                  Your appointment has been scheduled. Would you like to login
                  to view your appointment status and history?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/patient/login"
                    className="flex-1 bg-neutral-900 text-white px-6 py-3 rounded-xl hover:bg-neutral-800 transition duration-200 text-center"
                  >
                    Login to Dashboard
                  </Link>
                  <button
                    onClick={() => setShowExistingPatientModal(false)}
                    className="flex-1 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-xl hover:bg-neutral-50 transition duration-200"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal for New Patients */}
      <AnimatePresence>
        {bookingSuccess && !showExistingPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setBookingSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  Appointment Booked!
                </h3>
                <p className="text-neutral-600 mb-4">
                  An account has been created for you. You can login anytime
                  using your email to check your appointment status.
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  A confirmation email has been sent to your email address.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/patient/login"
                    className="flex-1 bg-neutral-900 text-white px-6 py-3 rounded-xl hover:bg-neutral-800 transition duration-200 text-center"
                  >
                    Login Now
                  </Link>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="flex-1 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-xl hover:bg-neutral-50 transition duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AppointmentSection;
