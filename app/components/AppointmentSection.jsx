"use client";

import { createAppointment } from "@/lib/actions/appointment.actions";
import { motion } from "framer-motion";
import Image from "next/image";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

const AppointmentSection = () => {
  const [appointment, setAppointment] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    message: "",
    age: "",
    schedule: null,
    clinics: "67221d55002eb88977cd",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (key !== "message" && key !== "clinics") {
        // message is optional
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
      const newAppointment = await createAppointment(appointment);
      console.log(newAppointment, "scheduled Appointment");

      toast.success("Appointment Successfully Scheduled!", {
        description: newAppointment.date
          ? formatDate(newAppointment.date)
          : "No date selected",
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
        message: "",
        schedule: null,
        clinics: "67221d55002eb88977cd",
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
    <div className="min-h-screen w-screen p-10 flex flex-col lg:flex-row justify-evenly items-center gap-10 text-[#ededed]">
      <div className="hidden lg:flex justify-center items-center">
        <motion.div
          className="overflow-hidden flex items-center w-full justify-center"
          initial={{ x: -500, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          <Image
            src="/appointment-image.png"
            width={500}
            height={500}
            alt="appointment image"
            className="h-[80vh] w-auto max-w-[30vw] object-left object-cover border-[1px] border-black rounded-3xl"
          />
        </motion.div>
      </div>
      <div>
        <h1 className="text-neutral-950 text-4xl font-medium mb-7">
          Book an Appointment
        </h1>
        <motion.form
          variants={formAnimation}
          initial="hidden"
          whileInView="visible"
          className="flex justify-center items-center w-full max-w-lg"
          viewport={{ once: true }}
          onSubmit={onSubmit}
        >
          <div className="grid grid-cols-2 row-auto items-start w-full text-neutral-900 gap-3 gap-y-6">
            <div className="flex flex-col">
              <motion.input
                id="firstName"
                placeholder="First Name"
                type="text"
                aria-label="First Name"
                className={`border-[1px] px-6 py-4 rounded-2xl ${
                  errors.firstName ? "border-red-500" : "border-neutral-900"
                }`}
                variants={inputAnimation}
                value={appointment.firstName}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
              {errors.firstName && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.firstName}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <motion.input
                id="lastName"
                placeholder="Last Name"
                type="text"
                aria-label="Last Name"
                className={`border-[1px] px-6 py-4 rounded-2xl ${
                  errors.lastName ? "border-red-500" : "border-neutral-900"
                }`}
                variants={inputAnimation}
                value={appointment.lastName}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
              {errors.lastName && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.lastName}
                </span>
              )}
            </div>
            <div className="flex flex-col col-span-2">
              <motion.input
                id="email"
                placeholder="E-mail"
                type="email"
                aria-label="Email"
                className={`border-[1px] px-6 py-4 rounded-2xl ${
                  errors.email ? "border-red-500" : "border-neutral-900"
                }`}
                variants={inputAnimation}
                value={appointment.email}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
              {errors.email && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.email}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <motion.input
                id="phoneNumber"
                placeholder="Phone Number"
                type="tel"
                aria-label="Phone Number"
                className={`border-[1px] px-6 py-4 rounded-2xl ${
                  errors.phoneNumber ? "border-red-500" : "border-neutral-900"
                }`}
                variants={inputAnimation}
                value={appointment.phoneNumber}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
              {errors.phoneNumber && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <motion.input
                id="age"
                placeholder="Age"
                type="number"
                aria-label="Age"
                className={`border-[1px] px-6 py-4 rounded-2xl ${
                  errors.age ? "border-red-500" : "border-neutral-900"
                }`}
                variants={inputAnimation}
                value={appointment.age}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
              {errors.age && (
                <span className="text-red-500 text-sm mt-1">{errors.age}</span>
              )}
            </div>

            <div className="col-span-2 flex flex-col">
              <DatePicker
                selected={appointment.schedule}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy h:mm aa"
                showTimeSelect
                timeInputLabel="Time:"
                placeholderText="Select date and time"
                className={`w-full px-4 py-3 text-neutral-900 rounded-2xl outline-none bg-white border-[1px] ${
                  errors.schedule ? "border-red-500" : "border-neutral-900"
                }`}
                calendarClassName="rounded-lg border-[1px] border-neutral-300 shadow-lg"
                minDate={new Date()}
                filterTime={filterTime}
              />
              {errors.schedule && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.schedule}
                </span>
              )}
            </div>

            <div className="col-span-2 flex flex-col">
              <motion.textarea
                id="message"
                placeholder="Message (optional)"
                aria-label="Message (optional)"
                className="border-[1px] border-neutral-900 h-40 px-6 py-4 rounded-2xl resize-none"
                variants={inputAnimation}
                value={appointment.message}
                onChange={handleInputChange}
                viewport={{ once: true }}
              />
            </div>
            <motion.button
              type="submit"
              className="col-span-2 mt-6 bg-neutral-900 text-white px-6 py-4 rounded-2xl hover:bg-neutral-800 transition duration-200"
              variants={inputAnimation}
            >
              Book Appointment
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AppointmentSection;
