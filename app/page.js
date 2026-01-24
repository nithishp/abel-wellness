import About from "./components/About";
import AppointmentSection from "./components/AppointmentSection";
import BlogPostCarousel from "./components/BlogPostCarousel";
import Doctors from "./components/Doctors";
import FAQ from "./components/FAQ";
import Features from "./components/Features";
import FirstConsultation from "./components/FirstConsultation";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
import Nav from "./components/CornerNav";

export default function Home() {
  return (
    <div className="min-h-screen scroll-container p-4 pb-0 bg-[#f1f1f1] overflow-hidden flex flex-col justify-center items-center gap-10 ">
      <Nav />
      <Hero />
      <About id="about" />
      <Services id="services" />
      <Features />
      <Doctors id="doctors" />
      <FirstConsultation />
      <Testimonials />
      <FAQ />
      <BlogPostCarousel />
      <AppointmentSection id="contact" />
      <Footer />
    </div>
  );
}
