import { useEffect } from "react";
import Background from "@/components/Background";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import VetsSection from "@/components/VetsSection";
import Footer from "@/components/Footer";
import { Stethoscope, Star, Clock, MapPin } from "lucide-react";

const VeterinairesPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen page-enter">
      <Background />
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden" style={{
          background: "linear-gradient(145deg, hsl(158 48% 10%) 0%, hsl(158 42% 18%) 55%, hsl(36 60% 32%) 100%)"
        }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, hsl(158 42% 52%), transparent 65%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-6"
            style={{ background: "radial-gradient(circle, hsl(36 82% 58%), transparent 65%)", transform: "translate(-30%, 30%)" }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-reveal-up" style={{animationDelay:"0.05s"}}>
                <Stethoscope className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white/90">Professionnels certifiés</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-reveal-up" style={{animationDelay:"0.1s"}}>
                Vos vétérinaires<br />
                <em className="not-italic text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg, hsl(158 65% 72%), hsl(36 90% 70%))"}}>
                  de confiance
                </em>
              </h1>
              <p className="text-lg text-white/75 max-w-xl leading-relaxed mb-10 animate-reveal-up" style={{animationDelay:"0.2s"}}>
                Des centaines de praticiens vérifiés disponibles près de chez vous. Consultez les profils, lisez les avis et prenez rendez-vous en quelques clics.
              </p>
              {/* Quick pills */}
              <div className="flex flex-wrap gap-3 animate-reveal-up" style={{animationDelay:"0.3s"}}>
                {[
                  { icon: Stethoscope, label: "Praticiens certifiés" },
                  { icon: Clock, label: "Prise de RDV en ligne" },
                  { icon: MapPin, label: "Partout en Tunisie" },
                  { icon: Star, label: "Avis vérifiés" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                    <Icon className="h-4 w-4 text-white/80" />
                    <span className="text-sm font-medium text-white/90">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wave bottom */}
          <div className="absolute bottom-0 left-0 right-0 wave-divider">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" style={{height:"72px"}}>
              <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="hsl(42, 55%, 96%)" />
            </svg>
          </div>
        </section>

        <VetsSection />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default VeterinairesPage;
