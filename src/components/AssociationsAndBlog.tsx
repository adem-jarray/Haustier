import React, { useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import adoptKitten from "@/assets/adopt-kitten.png";
import adoptPuppy from "@/assets/adopt-puppy.png";
import adoptRabbit from "@/assets/adopt-rabbit.png";
import { Syringe, Users, Shield, ArrowRight, BookOpen, Calendar, X, Search, Phone, Mail, Globe, Heart, MapPin, CheckCircle, ArrowLeft, LogIn, Sparkles, AlertTriangle, Thermometer, Zap, Clock, ChevronRight } from "lucide-react";
import { StarRating } from "@/components/HeroAndFeatures";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { animals as allAnimals, blogPosts } from "@/data/siteData";
import { useAuth } from "@/hooks/useAuth";
import FavHeart from "@/components/FavHeart";
import PostsSection from "@/components/PostsSection";
import { useFavorites } from "@/context/FavoritesContext";
import { useDynamicData, type AnimalEntry, type AssocEntry } from "@/hooks/useDynamicData";

const localImages: Record<string, string> = { luna: adoptKitten, max: adoptPuppy, flocon: adoptRabbit };
const getImage = (animal: AnimalEntry) => localImages[animal.id] || animal.image;

const LoginPrompt = ({ action, onClose }: { action: string; onClose: () => void }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-large max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><LogIn className="h-8 w-8 text-primary" /></div>
      <h3 className="text-xl font-bold text-foreground mb-2">Connexion requise</h3>
      <p className="text-muted-foreground mb-6">Vous devez être connecté pour {action}.</p>
      <div className="flex gap-3">
        <Link to="/auth" className="flex-1"><Button className="w-full font-bold">Se connecter</Button></Link>
        <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
      </div>
    </div>
  </div>
);

// ─── ANIMAL MODAL ─────────────────────────────────────────────────────────────
const AnimalModal = ({ animal, onClose, onViewAssoc }: { animal: AnimalEntry; onClose: () => void; onViewAssoc?: (id: string) => void }) => {
  const assoc = associations.find(a => a.id === animal.associationId);
  const { user } = useAuth();
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptDone, setAdoptDone] = useState(false);

  const handleAdopt = async () => {
    if (!user) { setLoginPrompt(true); return; }
    setAdoptLoading(true);
    await supabase.from("adoption_requests").insert({
      user_id: user.id,
      animal_id: animal.id,
      message: `Demande d'adoption pour ${animal.name}`,
      status: "pending",
    });
    setAdoptLoading(false);
    setAdoptDone(true);
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-large max-w-md w-full overflow-hidden max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="relative h-56">
            <img src={getImage(animal)} alt={animal.name} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-foreground">{animal.name}</h3>
              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{animal.type}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>{animal.breed}</span><span>•</span><span>{animal.age}</span><span>•</span><span>{animal.gender}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {animal.vaccinated && <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle className="h-3 w-3" />Vacciné</span>}
              {animal.sterilized && <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full"><CheckCircle className="h-3 w-3" />Stérilisé</span>}
              {animal.chipped && <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full"><CheckCircle className="h-3 w-3" />Pucé</span>}
            </div>
            <p className="text-muted-foreground mb-4">{animal.description}</p>
            {assoc && onViewAssoc && (
              <button
                className="w-full flex items-center gap-2 p-3 bg-muted rounded-lg mb-4 text-sm hover:bg-muted/80 transition-colors text-left group"
                onClick={() => { onClose(); onViewAssoc(assoc.id); }}
              >
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground flex-1">Proposé par <strong className="text-foreground">{assoc.name}</strong> — {assoc.city}</span>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <div className="flex gap-3">
              <Button className="flex-1 font-bold btn-gradient btn-ripple" onClick={handleAdopt} disabled={adoptLoading || adoptDone}>
                <Heart className="mr-2 h-4 w-4" />
                {adoptDone ? "Demande envoyée !" : adoptLoading ? "Envoi..." : `Adopter ${animal.name}`}
              </Button>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </div>
          </div>
        </div>
      </div>
      {loginPrompt && <LoginPrompt action="faire une demande d'adoption" onClose={() => setLoginPrompt(false)} />}
    </>
  );
};

// ─── ASSOCIATION PROFILE ──────────────────────────────────────────────────────
const AssociationProfile = ({ assoc, onBack }: { assoc: AssocEntry; onBack: () => void }) => {
  const profileRef = React.useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = profileRef.current;
    if (el) { el.scrollTop = 0; }
  }, []); // run once on mount before paint
  const { user } = useAuth();
  const { favAssocs, toggleAssoc } = useFavorites();
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalEntry | null>(null);
  const assocAnimals = allAnimals.filter(a => assoc.animalIds.includes(a.id));
  const isFav = favAssocs.includes(assoc.id);

  const handleFav = () => {
    if (!user) { setLoginPrompt(true); return; }
    toggleAssoc(assoc.id, assoc.name);
  };

  return (
    <>
      <div ref={profileRef} className="fixed inset-0 z-50 bg-background overflow-y-auto">
        {/* Cover */}
        <div className="relative h-56 md:h-72">
          <img src={assoc.cover} alt={assoc.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold hover:bg-white transition-colors z-10">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <div className="absolute top-4 right-4 z-10">
            <FavHeart isFav={isFav && !!user} onClick={handleFav} />
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-16 relative z-10 pb-20">
          {/* Header — logo + name on white card, always readable */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <div className="w-28 h-28 rounded-2xl border-4 border-card overflow-hidden shadow-lg bg-card shrink-0">
              <img src={assoc.logo} alt={assoc.name} className="w-full h-full object-cover" />
            </div>
            {/* Name block always on a solid background */}
            <div className="bg-white rounded-2xl px-5 py-4 card-shadow border border-border/50 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{assoc.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1 text-sm"><MapPin className="h-4 w-4" />{assoc.city} · Fondée en {assoc.founded}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center bg-card rounded-xl px-4 py-3 shadow-sm border">
                <p className="text-2xl font-bold text-primary">{assoc.animals}</p>
                <p className="text-xs text-muted-foreground">Animaux</p>
              </div>
              <div className="text-center bg-card rounded-xl px-4 py-3 shadow-sm border">
                <p className="text-2xl font-bold text-secondary">{assoc.campaigns}</p>
                <p className="text-xs text-muted-foreground">Campagnes</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl p-6 border border-border/50 card-shadow">
                <h2 className="text-xl font-bold text-foreground mb-3">À propos</h2>
                <p className="text-muted-foreground leading-relaxed">{assoc.description}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-border/50 card-shadow">
                <h2 className="text-xl font-bold text-foreground mb-4">Campagnes en cours</h2>
                <ul className="space-y-3">
                  {assoc.campaigns_list.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Syringe className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="text-muted-foreground">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {assocAnimals.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-border/50 card-shadow">
                  <h2 className="text-xl font-bold text-foreground mb-4">Animaux à adopter</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assocAnimals.map(animal => (
                      <button key={animal.id}
                        className="rounded-xl border overflow-hidden flex hover:shadow-md transition-shadow text-left group cursor-pointer w-full"
                        onClick={() => setSelectedAnimal(animal)}>
                        <img src={getImage(animal)} alt={animal.name} className="w-24 h-24 object-cover shrink-0 group-hover:scale-105 transition-transform duration-300" />
                        <div className="p-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-foreground text-sm">{animal.name}</h4>
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{animal.type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{animal.breed} · {animal.age} · {animal.gender}</p>
                          <span className="text-xs text-primary font-semibold flex items-center gap-0.5 mt-2">
                            Voir le profil <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              <PostsSection
                authorId={(assoc as any).userId || assoc.id}
                authorType="assoc"
                authorName={assoc.name}
                canPost={true}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border/50 card-shadow">
                <h2 className="text-lg font-bold text-foreground mb-4">Contact</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4 text-primary shrink-0" />{assoc.phone}</li>
                  <li className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4 text-primary shrink-0" />{assoc.email}</li>
                  <li className="flex items-center gap-3 text-muted-foreground break-all"><Globe className="h-4 w-4 text-primary shrink-0" />
                    <a href={assoc.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{assoc.website.replace("https://", "")}</a>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <h2 className="text-lg font-bold text-foreground mb-2">Soutenir l'association</h2>
                <p className="text-sm text-muted-foreground mb-4">Votre aide permet de sauver des animaux et financer les soins vétérinaires.</p>
                <Button className="w-full font-bold" onClick={() => alert(`Merci pour votre soutien à ${assoc.name} ! La fonctionnalité de don arrive bientôt.`)}>
                  <Heart className="mr-2 h-4 w-4" /> Faire un don
                </Button>
                <Button variant="outline" className="w-full mt-3 font-bold" onClick={() => alert("Merci pour votre intérêt !")}>Devenir bénévole</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animal modal opened from within the profile — no association link needed */}
      {selectedAnimal && <AnimalModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />}
      {loginPrompt && <LoginPrompt action="ajouter un favori" onClose={() => setLoginPrompt(false)} />}
    </>
  );
};

// ─── ASSOCIATIONS SECTION ─────────────────────────────────────────────────────
const AssociationsSection = ({ openAssocId }: { openAssocId?: string | null }) => {
  const { user } = useAuth();
  const { favAssocs, toggleAssoc } = useFavorites();
  const { allAssocs: associations } = useDynamicData();
  const [selectedAssoc, setSelectedAssoc] = useState<AssocEntry | null>(null);
  const [search, setSearch] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(false);

  // Open association profile when triggered from animal modal
  useEffect(() => {
    if (openAssocId) {
      const found = associations.find(a => a.id === openAssocId);
      if (found) setSelectedAssoc(found);
    }
  }, [openAssocId, associations]);

  const filtered = associations.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleFav = (assoc: AssocEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setLoginPrompt(true); return; }
    toggleAssoc(assoc.id, assoc.name);
  };

  return (
    <>
      <section id="associations" className="py-32 section-sage">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="eyebrow block mb-4">Réseau associatif</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Associations<br /><span className="text-primary">partenaires</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les associations, leurs campagnes de vaccination et les animaux qu'elles protègent.
            </p>
          </div>
          <div className="max-w-md mx-auto mb-10 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher par nom ou ville..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((assoc) => (
              <div key={assoc.id} className="card-hover card-shadow bg-white rounded-2xl overflow-hidden border border-border/30 group relative">
                <div className="absolute top-3 right-3 z-20">
                  <FavHeart isFav={favAssocs.includes(assoc.id) && !!user} onClick={(e) => handleFav(assoc, e)} />
                </div>
                <button className="text-left w-full" onClick={() => setSelectedAssoc(assoc)}>
                  {/* Cover image with gradient overlay + floating logo */}
                  <div className="h-40 overflow-hidden relative img-zoom">
                    <img src={assoc.cover} alt={assoc.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{background:"linear-gradient(to top, hsl(158 42% 10% / 0.75) 0%, transparent 60%)"}} />
                    {/* Logo badge */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5 z-10">
                      <img src={assoc.logo} alt={assoc.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md" />
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{assoc.name}</h3>
                        <p className="text-white/75 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{assoc.city}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-3 rounded-xl" style={{background:"hsl(158 42% 95%)"}}>
                        <p className="text-xl font-bold text-primary">{assoc.animals}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" />Animaux</p>
                      </div>
                      <div className="text-center p-3 rounded-xl" style={{background:"hsl(36 82% 95%)"}}>
                        <p className="text-xl font-bold text-secondary">{assoc.campaigns}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Syringe className="h-3 w-3" />Campagnes</p>
                      </div>
                    </div>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Voir le profil <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-3 text-center text-muted-foreground py-12">Aucune association trouvée pour "{search}"</div>}
          </div>
        </div>
      </section>

      {selectedAssoc && <AssociationProfile assoc={selectedAssoc} onBack={() => setSelectedAssoc(null)} />}
      {loginPrompt && <LoginPrompt action="ajouter un favori" onClose={() => setLoginPrompt(false)} />}
    </>
  );
};

// ─── BLOG SECTION ─────────────────────────────────────────────────────────────
const BLOG_CATEGORIES = ["Tous", "Urgence", "Santé", "Conseils", "Nutrition", "Comportement", "Adoption", "Bien-être"];

// ─── Estimated reading time ───────────────────────────────────────────────────
const readTime = (content: string) => Math.max(1, Math.ceil(content.split(" ").length / 180));

// ─── Smart content renderer for modal ────────────────────────────────────────
const renderModalContent = (content: string) => {
  const phoneRe = /\b(\d{2}\s?\d{3}\s?\d{3}|\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|190|15|3115)\b/g;
  const warningRe = /(ne (jamais?|pas)|évitez?|jamais|attention|danger|interdit|n'essayez pas)/gi;
  const stepRe = /^(\d+[.)\-]\s|[A-ZÀÂÉÈÊÙÛÎ][A-ZÀÂÉÈÊÙÛÎa-zàâéèêùûî].*\s?:\s)/m;

  // Split on sentence-level delimiters keeping context
  const sentences = content.split(/(?<=\.\s)|(?<=\?\s)|(?<=!\s)|(?<=\n)/).filter(s => s.trim());

  const parts: React.ReactNode[] = [];

  sentences.forEach((sentence, i) => {
    const s = sentence.trim();
    if (!s) return;

    const isWarning = warningRe.test(s);
    const isStep = /^(AGISSEZ|URGENCE|À FAIRE|RÉFLEXES|PRÉCAUTIONS|PENDANT|APRÈS|À NE JAMAIS|NE JAMAIS|SIGNES)/i.test(s);
    const isCapHeader = /^[A-ZÀÂÉÈÊÙÛÎ\s]{5,}:/.test(s);

    if (isCapHeader || isStep) {
      parts.push(
        <div key={i} className="flex items-start gap-3 my-3 p-3 rounded-xl bg-primary/5 border-l-3 border-primary">
          <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-foreground leading-relaxed">{s}</p>
        </div>
      );
    } else if (isWarning) {
      parts.push(
        <div key={i} className="flex items-start gap-3 my-2.5 p-3 rounded-xl" style={{background:"hsl(4 75% 97%)", borderLeft:"3px solid hsl(4 75% 55%)"}}>
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 leading-relaxed">{renderPhones(s)}</p>
        </div>
      );
    } else {
      parts.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed my-1.5">{renderPhones(s)}</p>);
    }
  });

  return parts;
};

const renderPhones = (text: string): React.ReactNode => {
  const phonePattern = /(\b\d{2}\s?\d{3}\s?\d{3}\b|\b\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}[.\s]\d{2}\b|\b190\b|\b15\b|\b3115\b)/g;
  const parts = text.split(phonePattern);
  return (
    <>
      {parts.map((part, i) =>
        phonePattern.test(part)
          ? <a key={i} href={`tel:${part.replace(/\s/g,"")}`}
              className="inline-flex items-center gap-1 font-bold text-primary underline-offset-2 hover:underline"
              onClick={e => e.stopPropagation()}>
              <Phone className="h-3 w-3" />{part}
            </a>
          : part
      )}
    </>
  );
};

// ─── BLOG MODAL ───────────────────────────────────────────────────────────────
const BlogModal = ({ post, onClose }: { post: typeof blogPosts[0]; onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const isUrgence = post.category === "Urgence";
  const mins = readTime(post.content);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto animate-badge-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b sticky top-0 z-10 ${isUrgence ? "bg-red-50 border-red-200" : "bg-card border-border/50"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isUrgence ? "bg-red-600 text-white" : "text-primary bg-primary/10"}`}>
                  {isUrgence ? "🚨 " : ""}{post.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{mins} min de lecture</span>
              </div>
              <h3 className={`text-xl font-bold leading-snug ${isUrgence ? "text-red-900" : "text-foreground"}`} style={{fontFamily:"Fraunces, serif"}}>{post.title}</h3>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors shrink-0"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Urgence phone numbers bar */}
        {isUrgence && (
          <div className="mx-6 mt-5 p-4 rounded-xl" style={{background:"hsl(4 75% 97%)", border:"1px solid hsl(4 60% 88%)"}}>
            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Numéros d'urgence Tunisie</p>
            <div className="flex flex-wrap gap-2">
              {[
                {label:"SAMU humain", num:"190"},
                {label:"Pharmacovigilance", num:"71289714"},
                {label:"Protection civile", num:"198"},
              ].map(({label, num}) => (
                <a key={num} href={`tel:${num}`}
                  className="flex items-center gap-1.5 bg-white border border-red-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors">
                  <Phone className="h-3 w-3" />{label} · {num}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-1">
          {renderModalContent(post.content)}
        </div>

        <div className="px-6 pb-6">
          <div className="sep-gradient mb-5" />
          <Button variant="outline" onClick={onClose} className="font-bold w-full">Fermer l'article</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
// ─── SITUATIONS FRÉQUENTES shortcuts ─────────────────────────────────────────
const SITUATIONS = [
  { label: "Intoxication", icon: "☠️", search: "toxique" },
  { label: "Convulsions", icon: "⚡", search: "convulse" },
  { label: "Coup de chaleur", icon: "🌡️", search: "chaleur", highlight: true },
  { label: "Ne respire plus", icon: "💨", search: "respire" },
  { label: "Morsure", icon: "🦷", search: "mordu" },
  { label: "Accident", icon: "🚗", search: "voiture" },
];

// ─── BLOG SECTION ─────────────────────────────────────────────────────────────
const BlogSection = () => {
  const [selectedPost, setSelectedPost] = useState<typeof blogPosts[0] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const filtered = blogPosts.filter(p => {
    const matchesCat = category === "Tous" || p.category === category;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      <section id="blog" className="py-32 section-cream">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-10">
            <span className="eyebrow block mb-4">Ressources & conseils</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{fontFamily:"Fraunces, serif"}}>
              Blog & <span className="text-primary">Conseils vétérinaires</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Des articles rédigés par des vétérinaires pour prendre soin de vos animaux au quotidien.</p>
          </div>

          {/* ── URGENCE BANNIÈRE Tunisie ── */}
          {!emergencyDismissed && (
            <div className="max-w-3xl mx-auto mb-8 rounded-2xl overflow-hidden border border-red-200" style={{background:"hsl(4 75% 98%)"}}>
              <div className="flex items-center gap-3 px-5 py-3" style={{background:"hsl(4 75% 94%)", borderBottom:"1px solid hsl(4 60% 88%)"}}>
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-xs font-bold text-red-700 flex-1">NUMÉROS D'URGENCE — TUNISIE</p>
                <button onClick={() => setEmergencyDismissed(true)} className="w-6 h-6 rounded-full hover:bg-red-200 flex items-center justify-center transition-colors ml-auto">
                  <X className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { label: "SAMU humain (empoisonnements)", num: "190", icon: "🏥", note: "Si aucun vétérinaire disponible" },
                  { label: "Centre de pharmacovigilance", num: "71 289 714", icon: "💊", note: "Intoxications animales" },
                  { label: "Protection civile", num: "198", icon: "🚒", note: "Urgences générales" },
                  { label: "Cliniques vétérinaires 24h/24", num: "Voir carte", icon: "🏥", note: "Tunis, Sfax, Sousse", isMap: true },
                ].map(item => (
                  item.isMap
                    ? <div key={item.label} className="flex items-center gap-3 bg-white border border-red-100 rounded-xl p-3">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-red-800 truncate">{item.label}</p>
                          <p className="text-xs text-red-500">{item.note}</p>
                        </div>
                      </div>
                    : <a key={item.label} href={`tel:${item.num.replace(/\s/g,"")}`}
                        className="flex items-center gap-3 bg-white border border-red-100 rounded-xl p-3 hover:border-red-300 hover:bg-red-50 transition-colors group">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-red-800 truncate">{item.label}</p>
                          <p className="text-xs text-red-500">{item.note}</p>
                        </div>
                        <span className="text-base font-black text-red-700 shrink-0 group-hover:scale-105 transition-transform">{item.num}</span>
                      </a>
                ))}
              </div>
            </div>
          )}

          {/* ── SITUATIONS FRÉQUENTES ── */}
          <div className="max-w-3xl mx-auto mb-8">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">Situations fréquentes</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SITUATIONS.map(s => (
                <button key={s.label}
                  onClick={() => { setSearch(s.search); setCategory("Urgence"); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 card-hover
                    ${s.highlight
                      ? "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 shadow-sm"
                      : "border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                    }`}>
                  <span>{s.icon}</span>
                  {s.label}
                  {s.highlight && <Thermometer className="h-3.5 w-3.5 text-orange-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── SEARCH ── */}
          <div className="max-w-lg mx-auto mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un article, un conseil, un symptôme..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-border rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:border-primary/40 transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* ── CATEGORY PILLS ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {BLOG_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  category === cat
                    ? cat === "Urgence"
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-primary text-primary-foreground border-primary shadow-sm"
                    : cat === "Urgence"
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "bg-white border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}>
                {cat === "Urgence" ? "🚨 " + cat : cat}
              </button>
            ))}
          </div>

          {/* ── ARTICLE GRID ── */}
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Aucun article trouvé pour « {search} »</p>
              <button className="mt-3 text-sm text-primary font-semibold underline-offset-2 hover:underline" onClick={() => { setSearch(""); setCategory("Tous"); }}>
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(post => {
                const isUrgence = post.category === "Urgence";
                const mins = readTime(post.content);
                return (
                  <article key={post.id}
                    className={`card-hover card-shadow rounded-2xl overflow-hidden border group cursor-pointer transition-all duration-280 ${
                      isUrgence
                        ? "bg-red-50 border-red-200 hover:border-red-400"
                        : "bg-white border-border/35 hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedPost(post)}>
                    {/* Top accent bar — thicker for urgence */}
                    <div className={`${isUrgence ? "h-2 bg-gradient-to-r from-red-600 to-red-400" : "h-1 vet-accent-bar"}`} />

                    <div className="p-6">
                      {/* Category + meta row */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isUrgence
                            ? "bg-red-600 text-white"
                            : "text-primary bg-primary/8 border border-primary/15"
                        }`}>
                          {isUrgence && "🚨 "}{post.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />{mins} min
                          </span>
                        </div>
                      </div>

                      {/* Title — serif */}
                      <h3 className={`text-base font-bold mb-2.5 leading-snug transition-colors duration-200 ${
                        isUrgence
                          ? "text-red-900 group-hover:text-red-700"
                          : "text-foreground group-hover:text-primary"
                      }`} style={{fontFamily:"Fraunces, serif"}}>
                        {post.title}
                      </h3>

                      <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${isUrgence ? "text-red-800/70" : "text-muted-foreground"}`}>
                        {post.content.substring(0, 120)}…
                      </p>

                      {/* Footer row */}
                      <div className={`flex items-center justify-between pt-4 border-t ${isUrgence ? "border-red-200" : "border-border/40"}`}>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{post.date}
                        </span>
                        <span className={`text-xs font-semibold flex items-center gap-1 ${isUrgence ? "text-red-600" : "text-primary"}`}>
                          Lire <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            {filtered.length} article{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </div>
        </div>
      </section>
      {selectedPost && <BlogModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  );
};

export { AssociationsSection, BlogSection };
