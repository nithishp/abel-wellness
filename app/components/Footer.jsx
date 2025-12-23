import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <footer className='w-screen h-auto bg-neutral-900 bg-[url("/service-bg.png")] bg-cover text-[#ededed]'>
      <div className="w-full flex flex-col lg:flex-row justify-between p-10">
        <div className="lg:max-w-[25vw]">
          <h1 className="text-4xl lg:text-5xl font-semibold text-wrap">
            AWHCC <span className="font-light">&reg;</span>
          </h1>
          <p className="text-sm mt-4">
            Take the First Step Towards Holistic Healing
          </p>
          <div className="mt-4 text-sm space-y-2">
            <p>📧 Email: abelwhcc@gmail.com</p>
            <p>📞 Phone/WhatsApp: +91 6380093009</p>
            <p>🌍 Website: awhcc.com</p>
            <p>📍 Location: Online consultations (available globally)</p>
          </div>
        </div>
        <div className="mt-6 lg:mt-0 flex flex-col justify-center items-start lg:items-center">
          <h2 className="font-semibold text-lg mb-3">Quick Links</h2>
          <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 text-sm">
            <p className="cursor-pointer hover:underline">Home</p>
            <p className="cursor-pointer hover:underline">About</p>
            <p className="cursor-pointer hover:underline">Services</p>
            <p className="cursor-pointer hover:underline">Blog</p>
            <p className="cursor-pointer hover:underline">Contact</p>
          </div>
        </div>
        <div className="mt-6 lg:mt-0 flex flex-col justify-center items-start lg:items-center">
          <h2 className="font-semibold text-lg mb-3">Follow Us</h2>
          <div className="flex flex-row gap-4 text-sm">
            <p className="cursor-pointer hover:underline">Instagram</p>
            <p className="cursor-pointer hover:underline">Facebook</p>
            <p className="cursor-pointer hover:underline">LinkedIn</p>
          </div>
          <div className="mt-4 text-xs text-neutral-400">
            <p className="cursor-pointer hover:underline">Privacy Policy</p>
            <p className="cursor-pointer hover:underline">Disclaimer</p>
            <p className="cursor-pointer hover:underline">Terms & Conditions</p>
          </div>
        </div>
        <div className="mt-6 lg:mt-0 flex flex-col justify-center items-center">
          <p className="text-xs">Developed by</p>
          <h1 className="font-sans font-extrabold text-3xl tracking-tight">
            techKraft
          </h1>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
