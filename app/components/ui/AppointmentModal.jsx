"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { FiX, FiCalendar, FiClock, FiMessageCircle } from "react-icons/fi";

const AppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: null,
    time: "",
    reasonForVisit: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "date":
        if (!value) {
          error = "Please select an appointment date";
        } else if (new Date(value) <= new Date()) {
          error = "Please select a future date";
        }
        break;
      case "time":
        if (!value.trim()) {
          error = "Please select an appointment time";
        }
        break;
      case "reasonForVisit":
        if (!value.trim()) {
          error = "Please provide a reason for your visit";
        } else if (value.trim().length < 10) {
          error = "Please provide more details (at least 10 characters)";
        }
        break;
    }

    return error;
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")}`;
        const displayStr = new Date(
          `2000-01-01T${timeStr}:00`,
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
        slots.push({ value: timeStr, display: displayStr });
      }
    }
    return slots;
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentData = {
        date: formData.date.toISOString().split("T")[0],
        time: formData.time,
        reasonForVisit: formData.reasonForVisit,
      };

      const response = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Appointment booked successfully!");
        setFormData({
          date: null,
          time: "",
          reasonForVisit: "",
        });
        setErrors({});
        onSuccess?.(result);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Book New Appointment
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FiCalendar className="w-4 h-4 inline mr-2" />
                  Appointment Date
                </label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => handleInputChange("date", date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select appointment date"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  minDate={new Date()}
                  calendarClassName="shadow-lg border rounded-lg"
                />
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FiClock className="w-4 h-4 inline mr-2" />
                  Appointment Time
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.time ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                >
                  <option value="">Select appointment time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.display}
                    </option>
                  ))}
                </select>
                {errors.time && (
                  <p className="text-sm text-red-600">{errors.time}</p>
                )}
              </div>

              {/* Reason for Visit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FiMessageCircle className="w-4 h-4 inline mr-2" />
                  Reason for Visit
                </label>
                <textarea
                  value={formData.reasonForVisit}
                  onChange={(e) =>
                    handleInputChange("reasonForVisit", e.target.value)
                  }
                  rows={4}
                  placeholder="Please describe the reason for your appointment..."
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.reasonForVisit ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none`}
                />
                {errors.reasonForVisit && (
                  <p className="text-sm text-red-600">
                    {errors.reasonForVisit}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentModal;
