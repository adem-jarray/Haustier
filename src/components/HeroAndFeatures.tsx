import React, { useState, useEffect, useLayoutEffect } from "react";
import { Heart, Search, Stethoscope, Users, BookOpen, Phone, Syringe, LogOut, User, Star, MapPin, ChevronDown, X, Clock, ExternalLink, ArrowLeft, Calendar, Sparkles, Shield, LayoutDashboard, CalendarCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroPets from "@/assets/hero-pets.png";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/context/FavoritesContext";
import { animals, vets, associations } from "@/data/siteData";
import type { VetEntry, AnimalEntry, AssocEntry } from "@/hooks/useDynamicData";
import FavHeart from "@/components/FavHeart";
import PostsSection from "@/components/PostsSection";

export const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

// ─── STAR RATING VISUAL ────────────────────────────────────────────────────────
export const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} transition-transform ${i < Math.round(rating) ? "star-filled fill-current" : "star-empty"}`}
        />
      ))}
    </div>
  );
};

// ─── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────
export const ToastContainer = () => {
  const { toasts } = useFavorites();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="toast-animate bg-foreground text-background text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2">
          <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
          {t.message}
        </div>
      ))}
    </div>
  );
};

// ─── VET PROFILE PAGE ─────────────────────────────────────────────────────────
export const VetProfile = ({ vet, onClose, onRDV }: { vet: VetEntry; onClose: () => void; onRDV?: () => void }) => {
  const profileRef = React.useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = profileRef.current;
    if (el) { el.scrollTop = 0; }
  }, []); // empty deps = run once synchronously on mount, before paint
  const { user } = useAuth();
  const { favVets, toggleVet } = useFavorites();
  const isFav = favVets.includes(String(vet.id)) && !!user;

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    toggleVet(vet.id, vet.name);
  };

  return (
    <div ref={profileRef} className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Hero banner — richer gradient */}
      <div className="relative h-64 overflow-hidden" style={{
        background: "linear-gradient(145deg, hsl(158 48% 12%), hsl(158 42% 20%), hsl(36 70% 38%))"
      }}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-0 w-96 h-32 opacity-5 bg-white" style={{ borderRadius: "0 100% 0 0" }} />
        <div className="absolute inset-0 flex items-center justify-end pr-16 opacity-8">
          <Stethoscope className="h-56 w-56 text-white opacity-10" />
        </div>
        <button onClick={onClose} className="absolute top-5 left-5 flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-all z-10">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="absolute top-5 right-5 z-10">
          <FavHeart isFav={isFav} onClick={handleFav} />
        </div>
        {/* Accent bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 vet-accent-bar" />
      </div>

      <div className="container mx-auto px-4 -mt-14 relative z-10 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-10">
          <div className="w-28 h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-xl shrink-0">
            <Stethoscope className="h-14 w-14 text-primary" />
          </div>
          <div className="bg-white rounded-2xl px-6 py-5 card-shadow border border-border/40 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{vet.name}</h1>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5" />{vet.specialty}
                  <span className="text-border">·</span>
                  <MapPin className="h-3.5 w-3.5" />{vet.location}
                </p>
              </div>
              {vet.rating >= 4.8 && (
                <span className="badge-top text-xs px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Top
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <StarRating rating={vet.rating} />
              <span className="text-sm font-bold text-foreground">{vet.rating}</span>
              <span className="text-sm text-muted-foreground">({vet.reviews} avis)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-7 border border-border/40 card-shadow">
              <h2 className="text-xl font-bold text-foreground mb-4">À propos</h2>
              <div className="sep-gradient mb-4" />
              <p className="text-muted-foreground leading-relaxed">
                {vet.name} est un(e) vétérinaire spécialisé(e) en <strong className="text-foreground">{vet.specialty}</strong>, exerçant à {vet.location}. Avec {vet.reviews} avis et une note de {vet.rating}/5, ce praticien est reconnu pour la qualité de ses soins et son écoute attentive.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-border/40 card-shadow">
              <h2 className="text-xl font-bold text-foreground mb-4">Horaires d'ouverture</h2>
              <div className="sep-gradient mb-4" />
              <div className="flex items-center gap-3 bg-accent/40 rounded-xl p-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">{vet.hours}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-border/40 card-shadow">
              <h2 className="text-xl font-bold text-foreground mb-4">Adresse</h2>
              <div className="sep-gradient mb-4" />
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground leading-relaxed">{vet.address}</span>
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.name + " vétérinaire " + vet.address)}`}
                target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-semibold hover:border-primary/40 hover:text-primary transition-colors">
                  <MapPin className="h-4 w-4 mr-2" />Voir sur Google Maps<ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </a>
            </div>

            <PostsSection authorId={(vet as any).userId || String(vet.id)} authorType="vet" authorName={vet.name} canPost={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-border/40 card-shadow">
              <h2 className="text-lg font-bold text-foreground mb-4">Contact & RDV</h2>
              <div className="sep-gradient mb-4" />
              <div className="flex items-center gap-3 text-sm mb-5 p-3 bg-accent/30 rounded-xl">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{vet.phone}</span>
              </div>
              <Button className="w-full font-bold btn-gradient btn-ripple h-12" onClick={onRDV}>
                <Calendar className="mr-2 h-4 w-4" />Prendre rendez-vous
              </Button>
            </div>

            {/* Rating card */}
            <div className="rounded-2xl p-6 border border-secondary/20 card-shadow text-center relative overflow-hidden"
              style={{ background: "linear-gradient(145deg, hsl(36 82% 96%), hsl(36 60% 99%))" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                style={{ background: "hsl(36 82% 58%)", transform: "translate(30%, -30%)" }} />
              <div className="flex justify-center mb-2">
                <StarRating rating={vet.rating} size="md" />
              </div>
              <p className="text-4xl font-bold text-foreground mt-2">{vet.rating}<span className="text-lg text-muted-foreground font-normal">/5</span></p>
              <p className="text-sm text-muted-foreground mt-1">Basé sur {vet.reviews} avis</p>
            </div>

            {/* Trust badge */}
            <div className="bg-white rounded-2xl p-5 border border-border/40 card-shadow flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Vétérinaire certifié</p>
                <p className="text-xs text-muted-foreground">Membre de l'Ordre National</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── FAVORITES PANEL ─────────────────────────────────────────────────────────
const FavoritesPanel = ({ onClose }: { onClose: () => void }) => {
  const { favAnimals, favVets, favAssocs } = useFavorites();
  const [tab, setTab] = useState<"animals" | "vets" | "assocs">("animals");
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalEntry | null>(null);
  const [selectedVet, setSelectedVet] = useState<VetEntry | null>(null);
  const [selectedAssoc, setSelectedAssoc] = useState<AssocEntry | null>(null);

  const myAnimals = animals.filter(a => favAnimals.includes(a.id));
  const myVets = vets.filter(v => favVets.includes(String(v.id)));
  const myAssocs = associations.filter(a => favAssocs.includes(a.id));
  const total = favAnimals.length + favVets.length + favAssocs.length;

  const tabs = [["animals", "Animaux", favAnimals.length], ["vets", "Vétérinaires", favVets.length], ["assocs", "Associations", favAssocs.length]] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-card h-full shadow-2xl border-l border-border/60 overflow-y-auto animate-slide-right" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Mes favoris</h2>
            <p className="text-sm text-muted-foreground">{total} élément{total > 1 ? "s" : ""} sauvegardé{total > 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border/50">
          {tabs.map(([id, label, count]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 ${tab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
              {count > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-2.5">
          {tab === "animals" && (myAnimals.length === 0
            ? <p className="text-center text-muted-foreground py-16 text-sm">Aucun animal en favori.<br />Cliquez sur ❤️ pour en ajouter.</p>
            : myAnimals.map(a => (
              <button key={a.id} onClick={() => setSelectedAnimal(a)}
                className="flex gap-3 p-3.5 bg-muted/40 rounded-2xl items-center w-full hover:bg-accent/50 transition-colors text-left group card-hover">
                <div className="img-zoom rounded-xl w-14 h-14 shrink-0">
                  <img src={a.image} alt={a.name} className="w-14 h-14 rounded-xl object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.breed} · {a.age}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </button>
            ))
          )}
          {tab === "vets" && (myVets.length === 0
            ? <p className="text-center text-muted-foreground py-16 text-sm">Aucun vétérinaire en favori.</p>
            : myVets.map(v => (
              <button key={v.id} onClick={() => setSelectedVet(v)}
                className="flex gap-3 p-3.5 bg-muted/40 rounded-2xl items-center w-full hover:bg-accent/50 transition-colors text-left group card-hover">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.specialty} · {v.location}</p>
                  <div className="mt-1"><StarRating rating={v.rating} /></div>
                </div>
                <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </button>
            ))
          )}
          {tab === "assocs" && (myAssocs.length === 0
            ? <p className="text-center text-muted-foreground py-16 text-sm">Aucune association en favori.</p>
            : myAssocs.map(a => (
              <button key={a.id} onClick={() => setSelectedAssoc(a)}
                className="flex gap-3 p-3.5 bg-muted/40 rounded-2xl items-center w-full hover:bg-accent/50 transition-colors text-left group card-hover">
                <div className="img-zoom rounded-xl w-14 h-14 shrink-0">
                  <img src={a.logo} alt={a.name} className="w-14 h-14 rounded-xl object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.city} · {a.animals} animaux</p>
                </div>
                <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>

      {selectedAnimal && (
        <div className="modal-backdrop" onClick={() => setSelectedAnimal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[85vh] overflow-y-auto animate-badge-pop" onClick={e => e.stopPropagation()}>
            <div className="relative h-60 img-zoom animal-img-overlay">
              <img src={selectedAnimal.image} alt={selectedAnimal.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedAnimal(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-4 z-10">
                <h3 className="text-2xl font-bold text-white">{selectedAnimal.name}</h3>
                <span className="text-sm font-semibold text-white/90">{selectedAnimal.breed} · {selectedAnimal.age}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-adoption text-xs px-3 py-1 rounded-full">{selectedAnimal.type}</span>
              </div>
              <p className="text-muted-foreground mb-5 leading-relaxed">{selectedAnimal.description}</p>
              <Button className="w-full font-bold btn-gradient btn-ripple h-12" onClick={() => alert(`Demande d'adoption pour ${selectedAnimal.name} envoyée !`)}>
                <Heart className="mr-2 h-4 w-4" />Adopter {selectedAnimal.name}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedVet && (
        <div className="modal-backdrop" onClick={() => setSelectedVet(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-badge-pop" onClick={e => e.stopPropagation()}>
            <div className="relative p-8 text-center overflow-hidden" style={{ background: "linear-gradient(145deg, hsl(158 42% 14%), hsl(158 38% 22%))" }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white opacity-5" />
              <div className="w-18 h-18 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 w-16 h-16">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{selectedVet.name}</h2>
              <p className="text-white/70 text-sm">{selectedVet.specialty}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <StarRating rating={selectedVet.rating} />
                <span className="font-bold text-white">{selectedVet.rating}</span>
                <span className="text-white/60 text-sm">({selectedVet.reviews} avis)</span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                { icon: MapPin, label: selectedVet.location, sub: selectedVet.address },
                { icon: Clock, label: selectedVet.hours },
                { icon: Phone, label: selectedVet.phone },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
                  </div>
                </div>
              ))}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVet.name + " " + selectedVet.address)}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full font-semibold mt-1 hover:border-primary/40"><MapPin className="h-4 w-4 mr-2" />Voir sur Google Maps<ExternalLink className="h-3 w-3 ml-2" /></Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {selectedAssoc && (
        <div className="modal-backdrop" onClick={() => setSelectedAssoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-badge-pop" onClick={e => e.stopPropagation()}>
            <div className="relative h-44 img-zoom animal-img-overlay">
              <img src={selectedAssoc.cover} alt={selectedAssoc.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedAssoc(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={selectedAssoc.logo} alt={selectedAssoc.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedAssoc.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedAssoc.city}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{selectedAssoc.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="text-center p-3 rounded-xl" style={{ background: "hsl(158 42% 95%)" }}>
                  <p className="text-2xl font-bold text-primary">{selectedAssoc.animals}</p>
                  <p className="text-xs text-muted-foreground">Animaux</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: "hsl(36 82% 95%)" }}>
                  <p className="text-2xl font-bold text-secondary">{selectedAssoc.campaigns}</p>
                  <p className="text-xs text-muted-foreground">Campagnes</p>
                </div>
              </div>
              <Button className="w-full font-bold btn-gradient btn-ripple h-12" onClick={() => alert(`Contactez ${selectedAssoc.name} au ${selectedAssoc.phone}`)}>
                <Phone className="mr-2 h-4 w-4" />Contacter l'association
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── USER MENU ────────────────────────────────────────────────────────────────
const UserMenu = ({ onShowFavorites }: { onShowFavorites: () => void }) => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.user_metadata?.role || "user";
  const roleLabel = role === "veterinaire" ? "Vétérinaire" : role === "association" ? "Association" : "Utilisateur";
  const roleBg = role === "veterinaire" ? "bg-blue-100 text-blue-700" : role === "association" ? "badge-available" : "bg-primary/10 text-primary";

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-border rounded-full pl-2 pr-3 py-1.5 hover:shadow-md transition-shadow hover:border-primary/30">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground hidden sm:block max-w-[120px] truncate">
          {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-64 bg-white border border-border/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border/50" style={{ background: "linear-gradient(145deg, hsl(158 42% 96%), hsl(36 82% 97%))" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{user?.user_metadata?.full_name || "Mon compte"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <span className={`inline-block mt-2.5 text-xs font-bold px-2.5 py-1 rounded-full ${roleBg}`}>{roleLabel}</span>
            </div>
            <div className="p-2">
              <Link to="/mes-rendez-vous" onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-left">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Mes rendez-vous</span>
              </Link>
              <button onClick={() => { setOpen(false); onShowFavorites(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-left">
                <Heart className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-semibold text-foreground">Mes favoris</span>
              </button>
              {role === "user" && (
                <Link to="/mes-rdv" onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-left">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Mes rendez-vous</span>
                </Link>
              )}
              {(role === "veterinaire" || role === "association") && (
                <Link
                  to={role === "veterinaire" ? "/dashboard/vet" : "/dashboard/association"}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-left"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Mon espace pro</span>
                </Link>
              )}
              <div className="h-px bg-border/60 my-1.5" />
              <button onClick={() => { signOut(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left">
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-semibold">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user } = useAuth();
  const { heartPulse } = useFavorites();
  const [showFavorites, setShowFavorites] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isHome = location.pathname === "/";

  const navItems = [
    { label: "Vétérinaires", path: "/veterinaires", scrollId: "veterinaires" },
    { label: "Animaux & Adoption", path: "/animaux", scrollId: "adoption" },
    { label: "Blog & Conseils", path: "/blog", scrollId: "blog" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    navigate(item.path);
  };

  const isActive = (path: string) => location.pathname === path;

  const navBg = isHome && !scrolled
    ? "border-transparent bg-transparent"
    : "border-border/50 bg-background/95 backdrop-blur-2xl navbar-scrolled";

  const textColor = (path: string) => isActive(path)
    ? "text-primary"
    : isHome && !scrolled
      ? "text-white/85 hover:text-white"
      : "text-muted-foreground hover:text-primary";

  const logoColor = isHome && !scrolled ? "text-white" : "text-foreground";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${navBg}`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img src={logo} alt="Haustier" className="h-11 w-11 object-contain group-hover:scale-110 transition-transform duration-300" />
            <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${logoColor}`} style={{ fontFamily: "Fraunces, serif" }}>
              Haustier
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={`nav-link relative px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg hover:bg-white/8 ${
                  isActive(item.path) ? "active" : ""
                } ${textColor(item.path)}`}
              >
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{background:"linear-gradient(90deg, hsl(158 42% 30%), hsl(36 82% 58%))"}} />
                )}
              </button>
            ))}
            {user && (
              <button
                onClick={() => setShowFavorites(true)}
                className={`nav-link px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-lg hover:bg-white/8 flex items-center gap-1.5 ${
                  isHome && !scrolled ? "text-white/85 hover:text-white" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 transition-all duration-300 ${heartPulse ? "scale-150 fill-rose-500 text-rose-500" : ""}`} />
                Favoris
              </button>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <UserMenu onShowFavorites={() => setShowFavorites(true)} />
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className={`font-semibold transition-all ${
                    isHome && !scrolled
                      ? "border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50"
                      : "border-border hover:border-primary/40 hover:text-primary"
                  }`}>
                    Se connecter
                  </Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button size="sm" className="btn-gradient btn-ripple font-semibold px-5 h-9">S'inscrire</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden flex flex-col gap-1.5 p-2 rounded-lg transition-colors ${isHome && !scrolled ? "hover:bg-white/10" : "hover:bg-muted"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span className={`block h-0.5 w-5 rounded-full transition-all duration-200 ${
              mobileOpen ? "rotate-45 translate-y-2" : ""
            } ${isHome && !scrolled ? "bg-white" : "bg-foreground"}`} />
            <span className={`block h-0.5 w-5 rounded-full transition-all duration-200 ${
              mobileOpen ? "opacity-0" : ""
            } ${isHome && !scrolled ? "bg-white" : "bg-foreground"}`} />
            <span className={`block h-0.5 w-5 rounded-full transition-all duration-200 ${
              mobileOpen ? "-rotate-45 -translate-y-2" : ""
            } ${isHome && !scrolled ? "bg-white" : "bg-foreground"}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/97 backdrop-blur-2xl animate-reveal-fade">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => { setShowFavorites(true); setMobileOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" /> Favoris
                </button>
              )}
              <div className="pt-3 flex gap-2 border-t border-border/40">
                {user ? (
                  <UserMenu onShowFavorites={() => { setShowFavorites(true); setMobileOpen(false); }} />
                ) : (
                  <>
                    <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full font-semibold">Se connecter</Button>
                    </Link>
                    <Link to="/auth?tab=signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button size="sm" className="w-full btn-gradient btn-ripple font-semibold">S'inscrire</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      {showFavorites && <FavoritesPanel onClose={() => setShowFavorites(false)} />}
    </>
  );
};

// ─── HERO ─────────────────────────────────────────────────────────────────────
const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
    {/* Background */}
    <div className="absolute inset-0">
      <img src={heroPets} alt="Animaux heureux" className="w-full h-full object-cover object-center" />
      <div className="absolute inset-0 hero-gradient" />
      {/* Extra warm vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 130% 80% at 15% 65%, transparent 25%, hsl(158 48% 6% / 0.5) 100%)"
      }} />
    </div>



    {/* Floating vet card — glassmorphism */}
    <div className="absolute bottom-32 right-8 hidden xl:block glass-card rounded-2xl px-5 py-4 animate-float" style={{ animationDelay: "1.2s", maxWidth: "220px" }}>
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/25 flex items-center justify-center">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Dr. Martin</p>
          <p className="text-xs text-white/60">Médecine générale</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
        <span className="text-xs text-white/80 ml-1">4.9</span>
      </div>
    </div>

    <div className="container mx-auto px-4 relative z-10 py-28">
      <div className="max-w-3xl">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/22 rounded-full px-4 py-2 mb-9 animate-reveal-up" style={{ animationDelay: "0.1s" }}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-white/90">La plateforme n°1 pour le bien-être animal</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.04] mb-7 animate-reveal-up" style={{ animationDelay: "0.2s" }}>
          Vos compagnons
          <br />
          <em className="not-italic text-transparent bg-clip-text" style={{
            backgroundImage: "linear-gradient(135deg, hsl(158 65% 72%) 0%, hsl(36 90% 70%) 100%)"
          }}>
            méritent le meilleur
          </em>
        </h1>

        <p className="text-lg md:text-xl text-white/78 mb-11 leading-relaxed max-w-xl font-medium animate-reveal-up" style={{ animationDelay: "0.3s" }}>
          Trouvez des vétérinaires de confiance, adoptez un animal et rejoignez des associations engagées pour le bien-être animal.
        </p>

        <div className="flex flex-wrap gap-4 animate-reveal-up" style={{ animationDelay: "0.4s" }}>
          <Link to="/veterinaires">
            <Button size="lg"
              className="btn-gradient btn-ripple text-base font-bold px-8 h-14 rounded-xl shadow-xl">
              <Search className="mr-2 h-5 w-5" />Trouver un vétérinaire
            </Button>
          </Link>
          <Link to="/animaux">
            <Button size="lg" variant="outline"
              className="text-base font-bold px-8 h-14 rounded-xl bg-white/10 border-white/28 text-white hover:bg-white/18 hover:text-white hover:border-white/45 backdrop-blur-sm">
              <Heart className="mr-2 h-5 w-5" />Adopter un animal
            </Button>
          </Link>
        </div>


      </div>
    </div>

    {/* Wave bottom */}
    <div className="absolute bottom-0 left-0 right-0 wave-divider">
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" style={{ height: "96px" }}>
        <path d="M0,48 C180,96 360,0 540,48 C720,96 900,16 1080,52 C1200,76 1320,20 1440,48 L1440,96 L0,96 Z" fill="hsl(42, 55%, 96%)" />
      </svg>
    </div>
  </section>
);

// ─── FEATURES ─────────────────────────────────────────────────────────────────
const featureItems = [
  { icon: Stethoscope, title: "Vétérinaires experts", desc: "Consultez des profils détaillés, lisez les avis et prenez rendez-vous en quelques clics.", path: "/veterinaires", accent: "hsl(158 42% 88%)", iconBg: "hsl(158 42% 14%)" },
  { icon: Heart, title: "Adoption responsable", desc: "Des centaines d'animaux à adopter, avec le soutien d'associations sérieuses.", path: "/animaux", accent: "hsl(4 65% 92%)", iconBg: "hsl(4 55% 35%)" },
  { icon: Users, title: "Associations locales", desc: "Rejoignez et soutenez les associations de protection animale près de chez vous.", path: "/animaux", accent: "hsl(36 82% 92%)", iconBg: "hsl(36 70% 38%)" },
  { icon: Syringe, title: "Campagnes de vaccination", desc: "Restez informé des campagnes organisées et participez pour protéger votre animal.", path: "/animaux", accent: "hsl(214 70% 92%)", iconBg: "hsl(214 55% 32%)" },
  { icon: BookOpen, title: "Conseils & Blog", desc: "Accédez à des centaines d'articles vétérinaires et de conseils pratiques au quotidien.", path: "/blog", accent: "hsl(270 50% 92%)", iconBg: "hsl(270 40% 35%)" },
  { icon: Phone, title: "Rendez-vous en ligne", desc: "Réservez en temps réel, recevez des rappels et gérez vos consultations facilement.", path: "/veterinaires", accent: "hsl(180 50% 90%)", iconBg: "hsl(180 42% 28%)" },
];

const FeaturesSection = () => {
  const navigate = useNavigate();
  return (
  <section className="py-32 section-cream">
    <div className="container mx-auto px-4">
      <div className="text-center mb-20">
        <span className="eyebrow block mb-4">Nos services</span>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
          Tout pour vos animaux,<br />
          <span className="text-primary">en un seul endroit</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Haustier réunit tous les services essentiels pour le bien-être de vos compagnons.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureItems.map((f, i) => (
          <button key={f.title}
            className="card-hover card-shadow group text-left w-full bg-white rounded-2xl p-7 border border-border/40 cursor-pointer relative overflow-hidden"
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={() => navigate(f.path)}>
            {/* Warm corner accent */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-300"
              style={{ background: f.accent }} />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                style={{ background: f.iconBg }}>
                <f.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2.5 group-hover:text-primary transition-colors duration-200">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1">
              Découvrir <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
  );
};

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
const steps = [
  { icon: Search, title: "Recherchez", desc: "Utilisez notre moteur de recherche pour trouver un vétérinaire, une association ou un animal à adopter près de chez vous." },
  { icon: Star, title: "Comparez & choisissez", desc: "Consultez les profils détaillés, les avis vérifiés et les disponibilités pour faire le meilleur choix pour votre animal." },
  { icon: Heart, title: "Agissez", desc: "Prenez rendez-vous en ligne, envoyez une demande d'adoption ou rejoignez une association en quelques secondes." },
];

export const HowItWorksSection = () => (
  <section className="py-32 section-parchment">
    <div className="container mx-auto px-4">
      <div className="text-center mb-20">
        <span className="eyebrow block mb-4">Simple & rapide</span>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">Comment ça marche ?</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">En 3 étapes simples, accédez aux meilleurs services pour vos animaux.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5"
          style={{ background: "linear-gradient(90deg, hsl(158 42% 22% / 0.15), hsl(36 82% 58% / 0.4), hsl(158 42% 22% / 0.15))" }} />

        {steps.map((step, i) => (
          <div key={step.title} className="relative text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white card-shadow mb-6 animate-pulse-ring border border-primary/10">
              <step.icon className="h-8 w-8 text-primary" />
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{ background: "linear-gradient(135deg, hsl(158 42% 22%), hsl(36 82% 58%))" }}>
                {i + 1}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm max-w-xs mx-auto">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── WHY CHOOSE US ────────────────────────────────────────────────────────────
const whyItems = [
  { icon: "🏆", title: "Vétérinaires certifiés", desc: "Tous nos vétérinaires sont vérifiés et membres de l'Ordre National des Vétérinaires." },
  { icon: "⚡", title: "Réponse rapide", desc: "Prise de rendez-vous confirmée en moins de 2 heures, 7j/7." },
  { icon: "🤝", title: "Réseau de confiance", desc: "Plus de 85 associations partenaires engagées pour le bien-être animal." },
  { icon: "💚", title: "100% gratuit", desc: "L'accès aux services de base est entièrement gratuit pour les propriétaires." },
];

export const WhyUsSection = () => (
  <section className="py-32 section-cream">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="eyebrow block mb-4">Pourquoi nous choisir</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            La référence du<br />
            <span className="text-primary">bien-être animal</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Haustier est la plateforme dédiée au bien-être animal en Tunisie — vétérinaires, adoption et associations réunis en un seul endroit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whyItems.map((item, i) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-white border border-border/40 card-shadow card-hover" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <h4 className="font-bold text-foreground text-sm mb-1.5">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "500+", label: "Vétérinaires partenaires", style: { background: "linear-gradient(145deg, hsl(158 42% 20%), hsl(158 46% 28%))" }, text: "text-white" },
              { value: "4.9/5", label: "Note moyenne vérifiée", style: { background: "linear-gradient(145deg, hsl(36 82% 55%), hsl(32 75% 46%))" }, text: "text-white" },
              { value: "85+", label: "Associations partenaires", style: { background: "hsl(0 0% 100%)", border: "1px solid hsl(158 18% 83%)" }, text: "text-foreground" },
              { value: "100%", label: "Praticiens certifiés", style: { background: "hsl(42 55% 97%)", border: "1px solid hsl(38 30% 84%)" }, text: "text-foreground" },
            ].map((stat, i) => (
              <div key={stat.label} className="rounded-2xl p-7 card-shadow card-hover" style={{ ...stat.style, animationDelay: `${i * 0.1}s` }}>
                <p className={`text-3xl font-bold ${stat.text} mb-1`}>{stat.value}</p>
                <p className={`text-sm font-medium ${stat.text} opacity-70`}>{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="absolute -z-10 -bottom-12 -right-12 w-72 h-72 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, hsl(36 82% 72%), hsl(158 42% 72%))" }} />
        </div>
      </div>
    </div>
  </section>
);

export { Navbar, HeroSection, FeaturesSection };
