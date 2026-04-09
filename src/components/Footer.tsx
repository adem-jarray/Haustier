import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="relative overflow-hidden" style={{background:"hsl(158 42% 10%)"}}>
    <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{background:"radial-gradient(circle, hsl(158 40% 45%), transparent 70%)", transform:"translate(30%, -30%)"}} />
    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8" style={{background:"radial-gradient(circle, hsl(36 70% 55%), transparent 70%)", transform:"translate(-30%, 30%)"}} />

    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-5 group">
            <img src={logo} alt="Haustier" className="h-11 w-11 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold text-white tracking-tight" style={{fontFamily:"Fraunces, serif"}}>Haustier</span>
          </Link>
          <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs">
            La plateforme qui connecte les propriétaires d'animaux avec les meilleurs vétérinaires et associations en Tunisie.
          </p>
          <div className="space-y-2.5 text-sm text-white/45">
            <a href="mailto:contact@haustier.tn" className="flex items-center gap-2.5 hover:text-white/70 transition-colors">
              <Mail className="h-4 w-4 text-primary/70" />contact@haustier.tn
            </a>
            <a href="tel:+21671000000" className="flex items-center gap-2.5 hover:text-white/70 transition-colors">
              <Phone className="h-4 w-4 text-primary/70" />+216 71 000 000
            </a>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-primary/70" />Tunis, Tunisie
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Navigation</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="text-white/45 hover:text-primary transition-colors">Accueil</Link></li>
            <li><Link to="/veterinaires" className="text-white/45 hover:text-primary transition-colors">Vétérinaires</Link></li>
            <li><Link to="/animaux" className="text-white/45 hover:text-primary transition-colors">Animaux & Adoption</Link></li>
            <li><Link to="/animaux#associations" className="text-white/45 hover:text-primary transition-colors">Associations</Link></li>
            <li><Link to="/blog" className="text-white/45 hover:text-primary transition-colors">Blog & Conseils</Link></li>
          </ul>
        </div>

        {/* Contact pro */}
        <div>
          <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Professionnels</h4>
          <ul className="space-y-3 text-sm">
            <li><button onClick={() => alert("Espace vétérinaire bientôt disponible !")} className="text-white/45 hover:text-primary transition-colors text-left">Espace vétérinaire</button></li>
            <li><button onClick={() => alert("Espace association bientôt disponible !")} className="text-white/45 hover:text-primary transition-colors text-left">Espace association</button></li>
            <li><a href="mailto:contact@haustier.tn" className="text-white/45 hover:text-primary transition-colors">Nous contacter</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/30">© 2026 Haustier. Tous droits réservés.</p>
        <p className="text-xs text-white/30 flex items-center gap-1.5">
          Fait avec <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> pour vos animaux en Tunisie
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
