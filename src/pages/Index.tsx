import Background from "@/components/Background";
import { Navbar, HeroSection, FeaturesSection, HowItWorksSection, WhyUsSection, ToastContainer } from "@/components/HeroAndFeatures";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen page-enter">
    <Background />
    <Navbar />
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyUsSection />
    </main>
    <Footer />
    <ToastContainer />
  </div>
);

export default Index;
