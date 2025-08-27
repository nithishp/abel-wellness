
import About from "./components/About";
import AppointmentSection from "./components/AppointmentSection";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Testimonials from "./components/Testimonials";
export default function Home() {
  return (
    <div className="min-h-screen scroll-container p-4 pb-0 bg-[#f1f1f1] overflow-hidden flex flex-col justify-center items-center gap-10">
      <Hero/>
      <About/>
      <Services/>
      <Features/>
      <Testimonials/>
      <AppointmentSection/>
      <Footer/>
    </div>
  );
}
