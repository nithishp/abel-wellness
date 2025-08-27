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

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setAppointment((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date) => {
    setAppointment((prev) => ({ ...prev, schedule: date }));
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

  const onSubmit = async(e) => {
    e.preventDefault();

    if (
      !appointment.firstName ||
      !appointment.lastName ||
      !appointment.email ||
      !appointment.phoneNumber ||
      !appointment.age ||
      !appointment.schedule
    ) {
      toast.error("Error. Try again!", {
        description: "Please fill all the required fields",
        action: {
          label: "Close",
          onClick: () => console.log("Closed"),
        },
      });
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
      return;
    }
    console.log(appointment);
  const newAppointment = await createAppointment(appointment);
    console.log(newAppointment,'scheduled Appoinntment') 

    toast.success("Appointment Successfully Scheduled!", {
      description: newAppointment.schedule
        ? formatDate(newAppointment.schedule)
        : "No date selected",
      action: {
        label: "Close",
        onClick: () => console.log("Closed"),
      },
    });
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
    <div className="min-h-screen w-screen p-10 flex flex-col lg:flex-row justify-evenly items-center gap-10">
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
            <motion.input
              id="firstName"
              placeholder="First Name"
              type="text"
              aria-label="First Name"
              className="border-[1px] border-neutral-900 px-6 py-4 rounded-2xl"
              variants={inputAnimation}
              value={appointment.firstName}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />
            <motion.input
              id="lastName"
              placeholder="Last Name"
              type="text"
              aria-label="Last Name"
              className="border-[1px] border-neutral-900 px-6 py-4 rounded-2xl"
              variants={inputAnimation}
              value={appointment.lastName}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />
            <motion.input
              id="email"
              placeholder="E-mail"
              type="email"
              aria-label="Email"
              className="col-span-2 border-[1px] border-neutral-900 px-6 py-4 rounded-2xl"
              variants={inputAnimation}
              value={appointment.email}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />
            <motion.input
              id="phoneNumber"
              placeholder="Phone Number"
              type="tel"
              aria-label="Phone Number"
              className="border-[1px] border-neutral-900 px-6 py-4 rounded-2xl"
              variants={inputAnimation}
              value={appointment.phoneNumber}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />
            <motion.input
              id="age"
              placeholder="Age"
              type="number"
              aria-label="Age"
              className="border-[1px] border-neutral-900 px-6 py-4 rounded-2xl"
              variants={inputAnimation}
              value={appointment.age}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />

            <DatePicker
              selected={appointment.schedule}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy h:mm aa"
              showTimeSelect
              timeInputLabel="Time:"
              placeholderText="Select date and time"
              className="w-full px-4 py-3 text-neutral-900 rounded-2xl outline-none bg-white col-span-2 border-[1px] border-neutral-900 "
              calendarClassName="rounded-lg border-[1px] border-neutral-300 shadow-lg"
              wrapperClassName="col-span-2"
              minDate={new Date()}
              filterTime={filterTime} // Disable times before 9 AM and after 7 PM
            />

            <motion.textarea
              id="message"
              placeholder="Message (optional)"
              aria-label="Message (optional)"
              className="border-[1px] border-neutral-900 col-span-2 h-40 px-6 py-4 rounded-2xl resize-none"
              variants={inputAnimation}
              value={appointment.message}
              onChange={handleInputChange}
              viewport={{ once: true }}
            />
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
