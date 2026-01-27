import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TripTypeGrid from "@/components/TripTypeGrid";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import ShasaFAB from "@/components/ShasaFAB";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <TripTypeGrid />
      <Features />
      <Testimonials />
      <Newsletter />
      <Footer />
      <ShasaFAB />
    </main>
  );
};

export default Index;
