import { useState } from "react";
import vetDoctor from "@/assets/vet-doctor.png";
import { Star, MapPin, Clock, X, Calendar, Phone, Search, ExternalLink, Heart, LogIn, Filter, Stethoscope, Award, Sparkles, Map } from "lucide-react";
import { StarRating } from "@/components/HeroAndFeatures";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/context/FavoritesContext";
import { VetProfile } from "@/components/HeroAndFeatures";
import FavHeart from "@/components/FavHeart";
import { useDynamicData, type VetEntry } from "@/hooks/useDynamicData";
import { VetMap } from "@/components/VetMap";
import { BookingModal } from "@/components/BookingModal";

const INITIAL_COUNT = 6;

const specialties = ["Tous", "Médecine générale", "Chirurgie", "Dermatologie", "Cardiologie", "Ophtalmologie", "Neurologie", "Orthopédie", "Médecine interne"];

const LoginPrompt = ({ action, onClose }: { action: string; onClose: () => void }) => {
  return (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-large max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <LogIn className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Connexion requise</h3>
      <p className="text-muted-foreground mb-6">Vous devez être connecté pour {action}.</p>
      <div className="flex gap-3">
        <Link to="/auth" className="flex-1"><Button className="w-full font-bold btn-gradient btn-ripple">Se connecter</Button></Link>
        <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
      </div>
    </div>
  </div>
  );
};

// ── Vet card with premium design ─────────────────────────────────────────────
const VetCard = ({
  vet, isFav, onView, onRDV, onFav
}: {
  vet: VetEntry;
  isFav: boolean;
  onView: () => void;
  onRDV: (e: React.MouseEvent) => void;
  onFav: (e: React.MouseEvent) => void;
}) => {
  const isTopRated = vet.rating >= 4.8;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.name + " vétérinaire " + vet.address)}`;

  return (
    <div
      className="card-hover card-shadow group bg-white rounded-2xl overflow-hidden border border-border/40 cursor-pointer"
      onClick={onView}
    >
      {/* Card top — colored band with avatar */}
      <div className="relative h-24 bg-gradient-to-br from-primary/12 via-primary/6 to-amber-50/40">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 70% 50%, hsl(163 40% 55% / 0.5), transparent 60%)"}} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge-available text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />Disponible
          </span>
          {isTopRated && (
            <span className="badge-top text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Award className="h-3 w-3" />Top noté
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <FavHeart isFav={isFav} onClick={onFav} />
        </div>

        {/* Avatar bottom-left */}
        <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-2xl bg-white shadow-soft border-2 border-white flex items-center justify-center">
          <Stethoscope className="h-7 w-7 text-primary" />
        </div>
      </div>

      <div className="pt-9 pb-5 px-5">
        <div className="mb-1">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 text-base leading-tight">
            {vet.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{vet.specialty}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            <span className="text-sm font-bold text-foreground">{vet.rating}</span>
            <span className="text-xs text-muted-foreground">({vet.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />{vet.location}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />{vet.hours.split(" ")[0]}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 btn-gradient btn-ripple font-semibold h-9 text-xs"
            onClick={onRDV}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" />Prendre RDV
          </Button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-border/60 hover:border-primary/40">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

const VetsSection = () => {
  const { user } = useAuth();
  const { favVets, toggleVet } = useFavorites();
  const { allVets } = useDynamicData();
  const [profileVet, setProfileVet] = useState<VetEntry | null>(null);
  const [bookingVet, setBookingVet] = useState<VetEntry | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("Tous");
  const [expanded, setExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const filtered = allVets.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      v.specialty.toLowerCase().includes(q) ||
      v.location.toLowerCase().includes(q);
    const matchSpec = specialtyFilter === "Tous" || v.specialty === specialtyFilter;
    return matchSearch && matchSpec;
  });

  const displayed = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);

  const handleRDV = (vet: VetEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setLoginPrompt("prendre un rendez-vous"); return; }
    setBookingVet(vet);
  };

  const handleFav = (vet: VetEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setLoginPrompt("ajouter un favori"); return; }
    toggleVet(vet.id, vet.name);
  };

  return (
    <>
      <section id="veterinaires" className="py-32 section-cream">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-16 items-start mb-14">
            <div className="lg:w-1/2">
              <span className="eyebrow block mb-4">Professionnels de santé</span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-5 tracking-tight leading-tight">
                Trouvez votre<br />
                <span className="text-primary">vétérinaire idéal</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Des centaines de praticiens vérifiés, disponibles près de chez vous. Prenez rendez-vous en quelques clics.
              </p>
            </div>

            <div className="lg:w-1/2 w-full space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nom, spécialité, ville..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-soft transition-shadow"
                />
              </div>

              {/* Specialty filter pills */}
              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, 6).map(spec => (
                  <button
                    key={spec}
                    onClick={() => setSpecialtyFilter(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      specialtyFilter === spec
                        ? "bg-primary text-white border-primary shadow-soft"
                        : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map toggle */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowMap(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                showMap
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-muted-foreground hover:border-primary/40 hover:text-primary card-shadow"
              }`}
            >
              <Map className="h-4 w-4" />
              {showMap ? "Masquer la carte" : "Voir sur la carte"}
            </button>
          </div>

          {/* Leaflet map */}
          {showMap && (
            <div className="mb-8 card-shadow rounded-2xl overflow-hidden border border-border/40">
              <VetMap
                vets={filtered.filter(v => v.lat && v.lng)}
                onSelectVet={vet => { setProfileVet(vet); setShowMap(false); }}
              />
            </div>
          )}

          {/* Vet grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(vet => (
              <VetCard
                key={vet.id}
                vet={vet}
                isFav={favVets.includes(String(vet.id)) && !!user}
                onView={() => setProfileVet(vet)}
                onRDV={e => handleRDV(vet, e)}
                onFav={e => handleFav(vet, e)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Stethoscope className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">Aucun vétérinaire trouvé pour « {search} »</p>
            </div>
          )}

          {!expanded && filtered.length > INITIAL_COUNT && (
            <div className="text-center mt-10">
              <Button size="lg" variant="outline" className="font-bold px-10 h-12 border-border hover:border-primary/40 hover:text-primary" onClick={() => setExpanded(true)}>
                Voir tous les vétérinaires ({filtered.length})
              </Button>
            </div>
          )}
        </div>
      </section>

      {profileVet && (
        <VetProfile
          vet={profileVet}
          onClose={() => setProfileVet(null)}
          onRDV={() => {
            if (!user) { setLoginPrompt("prendre un rendez-vous"); return; }
            setBookingVet(profileVet);
          }}
          vetDbId={(profileVet as any)?.dbId ?? null}
        />
      )}
      {bookingVet && <BookingModal vet={bookingVet} vetDbId={(bookingVet as any).dbId ?? null} onClose={() => setBookingVet(null)} />}
      {loginPrompt && <LoginPrompt action={loginPrompt} onClose={() => setLoginPrompt(null)} />}
    </>
  );
};

export default VetsSection;
