import { useState, useEffect } from "react";
import Background from "@/components/Background";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import AdoptionSection from "@/components/AdoptionSection";
import { AssociationsSection } from "@/components/AssociationsAndBlog";
import Footer from "@/components/Footer";
import { Heart, Users, Shield, Sparkles } from "lucide-react";

const AnimauxPage = () => {
  const [openAssocId, setOpenAssocId] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleViewAssoc = (id: string) => {
    setOpenAssocId(id);
    setTimeout(() => {
      const el = document.getElementById("associations");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setOpenAssocId(null), 1000);
    }, 100);
  };

  return (
    <div className="min-h-screen page-enter">
      <Background />
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden" style={{
          background: "linear-gradient(145deg, hsl(14 55% 28%) 0%, hsl(14 50% 38%) 40%, hsl(36 72% 42%) 100%)"
        }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, hsl(36 82% 70%), transparent 65%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, hsl(14 55% 62%), transparent 65%)", transform: "translate(-20%, 30%)" }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-reveal-up" style={{animationDelay:"0.05s"}}>
                <Heart className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white/90">Adoption & Associations</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-reveal-up" style={{animationDelay:"0.1s"}}>
                Trouvez votre<br />
                <em className="not-italic text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg, hsl(36 90% 75%), hsl(14 65% 72%))"}}>
                  compagnon idéal
                </em>
              </h1>
              <p className="text-lg text-white/75 max-w-xl leading-relaxed mb-10 animate-reveal-up" style={{animationDelay:"0.2s"}}>
                Des centaines d'animaux recherchent une famille aimante. Adoptez avec le soutien d'associations engagées et vérifiées.
              </p>
              <div className="flex flex-wrap gap-3 animate-reveal-up" style={{animationDelay:"0.3s"}}>
                {[
                  { icon: Heart, label: "Adoption responsable" },
                  { icon: Shield, label: "Associations vérifiées" },
                  { icon: Users, label: "Suivi post-adoption" },
                  { icon: Sparkles, label: "Animaux vaccinés & pucés" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                    <Icon className="h-4 w-4 text-white/80" />
                    <span className="text-sm font-medium text-white/90">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 wave-divider">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" style={{height:"72px"}}>
              <path d="M0,24 C360,72 720,0 1080,48 C1260,64 1380,12 1440,24 L1440,72 L0,72 Z" fill="hsl(42, 55%, 96%)" />
            </svg>
          </div>
        </section>

        <AdoptionSection onViewAssoc={handleViewAssoc} />
        <AssociationsSection openAssocId={openAssocId} />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default AnimauxPage;
