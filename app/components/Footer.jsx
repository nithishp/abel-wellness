import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  const services = [
    {
      name: "Chronic Skin Conditions",
      href: "/services/chronic-skin-conditions",
    },
    {
      name: "Digestive & Metabolic",
      href: "/services/digestive-metabolic-disorders",
    },
    { name: "Women's Health", href: "/services/womens-health" },
    {
      name: "Joint & Musculoskeletal",
      href: "/services/joint-musculoskeletal",
    },
    { name: "Mental Health & Stress", href: "/services/mental-health-stress" },
    { name: "Preventive Care", href: "/services/lifestyle-preventive-care" },
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Services", href: "/#services" },
    { name: "Our Team", href: "/#doctors" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/#contact" },
  ];

  const policies = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Consent for Online Consultation", href: "/consent" },
  ];

  return (
    <footer className='w-screen h-auto bg-neutral-900 bg-[url("/service-bg.png")] bg-cover text-[#ededed]'>
      <div className="w-full flex flex-col lg:flex-row justify-between p-10 gap-10">
        {/* Brand Section */}
        <div className="lg:max-w-[25vw]">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/abel-wellness-main.webp"
              width={50}
              height={50}
              alt="AWHCC Logo"
              className="rounded-xl"
            />
            <h1 className="text-2xl lg:text-3xl font-semibold">
              AWHCC <span className="font-light">&reg;</span>
            </h1>
          </div>
          <p className="text-sm text-neutral-300 mb-4">
            ABEL Wellness & Homoeopathic Care Centre
          </p>
          <p className="text-sm text-neutral-400 mb-4">
            Individualised Homoeopathic Care for Chronic & Lifestyle Conditions
          </p>
          <div className="text-sm space-y-2 text-neutral-300">
            <p className="flex items-center gap-2">📧 abelwhcc@gmail.com</p>
            <p className="flex items-center gap-2">📞 +91 6380093009</p>
            <p className="flex items-center gap-2">🌍 awhcc.com</p>
            <p className="flex items-center gap-2 text-xs text-neutral-400">
              📍 Online & In-Clinic consultations available
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="mt-6 lg:mt-0">
          <h2 className="font-semibold text-lg mb-4 text-white">
            Our Services
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            {services.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className="text-neutral-300 hover:text-white hover:underline transition-colors"
              >
                {service.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 lg:mt-0">
          <h2 className="font-semibold text-lg mb-4 text-white">Quick Links</h2>
          <div className="flex flex-col gap-2 text-sm">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-neutral-300 hover:text-white hover:underline transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Policies & Social */}
        <div className="mt-6 lg:mt-0">
          <h2 className="font-semibold text-lg mb-4 text-white">Policies</h2>
          <div className="flex flex-col gap-2 text-sm mb-6">
            {policies.map((policy, index) => (
              <Link
                key={index}
                href={policy.href}
                className="text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                {policy.name}
              </Link>
            ))}
          </div>

          <h2 className="font-semibold text-lg mb-3 text-white">Follow Us</h2>
          <div className="flex flex-row gap-4 text-sm">
            <a
              href="https://www.instagram.com/abelwhcc?igsh=MTJiZHJkZzQ2eDE1eQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/share/16oNekfwaT/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.linkedin.com/company/awhcc-abel-wellness-and-homoeopathic-care-centre/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://youtube.com/@awhcc?si=U2j4nsgs99QTgn3F"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="mt-6 lg:mt-0 flex flex-col justify-center items-center lg:items-end">
          <p className="text-xs text-neutral-400">Developed by</p>
          <h1 className="font-sans font-extrabold text-3xl tracking-tight text-white">
            techKraft
          </h1>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-neutral-700 py-6 px-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400 text-center lg:text-left">
            © {new Date().getFullYear()} ABEL Wellness & Homoeopathic Care
            Centre. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500 text-center lg:text-right max-w-xl">
            Evidence-oriented • Ethical practice • Patient-centred care
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
