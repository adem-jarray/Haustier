import { useEffect, useLayoutEffect } from "react";
import Background from "@/components/Background";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import { BlogSection } from "@/components/AssociationsAndBlog";
import Footer from "@/components/Footer";
import { BookOpen, Clock, Stethoscope, Sparkles } from "lucide-react";

const BlogPage = () => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  useEffect(() => {
    const t = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior }), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen page-enter">
      <Background />
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden" style={{
          background: "linear-gradient(145deg, hsl(270 38% 22%) 0%, hsl(270 32% 32%) 45%, hsl(36 65% 38%) 100%)"
        }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, hsl(270 50% 60%), transparent 65%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, hsl(36 82% 58%), transparent 65%)", transform: "translate(-20%, 30%)" }} />

          {/* Floating article preview card */}
          <div className="absolute top-24 right-8 hidden xl:block glass-card rounded-2xl p-4 animate-float" style={{maxWidth:"200px", animationDelay:"0.8s"}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">🚨 Urgence</span>
            </div>
            <p className="text-xs font-semibold text-white/90 leading-snug">Coup de chaleur : les bons réflexes immédiats</p>
            <p className="text-xs text-white/55 mt-1.5 flex items-center gap-1"><Clock className="h-3 w-3" />3 min de lecture</p>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-reveal-up" style={{animationDelay:"0.05s"}}>
                <BookOpen className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white/90">Rédigé par des vétérinaires</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-reveal-up" style={{animationDelay:"0.1s"}}>
                Blog &<br />
                <em className="not-italic text-transparent bg-clip-text" style={{backgroundImage:"linear-gradient(135deg, hsl(270 60% 80%), hsl(36 90% 70%))"}}>
                  Conseils vétérinaires
                </em>
              </h1>
              <p className="text-lg text-white/75 max-w-xl leading-relaxed mb-10 animate-reveal-up" style={{animationDelay:"0.2s"}}>
                Des guides pratiques, des urgences à connaître et des conseils quotidiens rédigés par nos vétérinaires partenaires — spécialement adaptés au contexte tunisien.
              </p>
              <div className="flex flex-wrap gap-3 animate-reveal-up" style={{animationDelay:"0.3s"}}>
                {[
                  { icon: BookOpen,    label: "Articles vétérinaires" },
                  { icon: Stethoscope, label: "Rédigés par des pros" },
                  { icon: Sparkles,    label: "Conseils pratiques" },
                  { icon: Clock,       label: "Lecture rapide" },
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
              <path d="M0,48 C180,8 540,72 900,24 C1080,8 1260,56 1440,36 L1440,72 L0,72 Z" fill="hsl(42, 55%, 96%)" />
            </svg>
          </div>
        </section>

        <BlogSection />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default BlogPage;
