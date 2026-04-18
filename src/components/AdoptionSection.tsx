import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import adoptKitten from "@/assets/adopt-kitten.png";
import adoptPuppy from "@/assets/adopt-puppy.png";
import adoptRabbit from "@/assets/adopt-rabbit.png";
import { Heart, MapPin, X, Shield, CheckCircle, LogIn, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { associations as staticAssociations } from "@/data/siteData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/context/FavoritesContext";
import FavHeart from "@/components/FavHeart";
import { useDynamicData, type AnimalEntry } from "@/hooks/useDynamicData";

const INITIAL_COUNT = 3;

const localImages: Record<string, string> = { luna: adoptKitten, max: adoptPuppy, flocon: adoptRabbit };
const getImage = (animal: AnimalEntry) => localImages[animal.id] || animal.image;
const getAssociation = (id: string) => staticAssociations.find(a => a.id === id);

const LoginPrompt = ({ action, onClose }: { action: string; onClose: () => void }) => {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Connexion requise</h3>
        <p className="text-muted-foreground mb-6">Vous devez être connecté pour {action}.</p>
        <div className="flex gap-3">
          <Link to="/auth" className="flex-1"><Button className="w-full font-bold">Se connecter</Button></Link>
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const AdoptionModal = ({
  animal, onClose, onViewAssoc,
}: {
  animal: AnimalEntry;
  onClose: () => void;
  onViewAssoc: (id: string) => void;
}) => {
  const assoc = getAssociation(animal.associationId);
  const { user, role } = useAuth();
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [rolePrompt, setRolePrompt] = useState(false);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptDone, setAdoptDone] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAdopt = async () => {
    if (!user) { setLoginPrompt(true); return; }
    if (role !== "user") { setRolePrompt(true); return; }
    setAdoptLoading(true);
    await supabase.from("adoption_requests").insert({
      user_id: user.id,
      animal_id: animal.id,
      message: `Demande d'adoption pour ${animal.name} (${animal.breed}, ${animal.age})`,
      status: "pending",
    }).select();
    setAdoptLoading(false);
    setAdoptDone(true);
    setTimeout(onClose, 2000);
  };

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative h-64 shrink-0">
            <img src={getImage(animal)} alt={animal.name} className="w-full h-full object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-foreground">{animal.name}</h3>
              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{animal.type}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              <span>{animal.breed}</span><span>•</span><span>{animal.age}</span><span>•</span>
              <span>{animal.gender}</span><span>•</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{animal.location}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {animal.vaccinated && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />Vacciné
                </span>
              )}
              {animal.sterilized && (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />Stérilisé
                </span>
              )}
              {animal.chipped && (
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />Pucé
                </span>
              )}
            </div>

            <p className="text-muted-foreground mb-4">{animal.description}</p>

            {assoc && (
              <button
                className="w-full flex items-center gap-2 p-3 bg-muted rounded-lg mb-5 text-sm hover:bg-muted/80 transition-colors text-left group"
                onClick={() => { onClose(); onViewAssoc(assoc.id); }}
              >
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground flex-1">
                  Proposé par <strong className="text-foreground">{assoc.name}</strong> — {assoc.city}
                </span>
                <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 font-bold btn-gradient btn-ripple"
                onClick={handleAdopt}
                disabled={adoptLoading || adoptDone}
              >
                <Heart className={`mr-2 h-4 w-4 ${adoptDone ? "fill-white" : ""}`} />
                {adoptDone ? "Demande envoyée !" : adoptLoading ? "Envoi..." : `Adopter ${animal.name}`}
              </Button>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </div>
          </div>
        </div>
      </div>

      {loginPrompt && (
        <LoginPrompt
          action="faire une demande d'adoption"
          onClose={() => setLoginPrompt(false)}
        />
      )}
      {rolePrompt && (
        <div className="modal-backdrop" onClick={() => setRolePrompt(false)} style={{ zIndex: 60 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Réservé aux utilisateurs</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Les demandes d'adoption sont réservées aux comptes utilisateur.
              Les comptes professionnels ne peuvent pas adopter via la plateforme.
            </p>
            <Button variant="outline" onClick={() => setRolePrompt(false)} className="w-full font-semibold">Fermer</Button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

const AdoptionSection = ({ onViewAssoc }: { onViewAssoc?: (id: string) => void }) => {
  const { user } = useAuth();
  const { favAnimals, toggleAnimal } = useFavorites();
  const { allAnimals } = useDynamicData();

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalEntry | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");

  const types = ["Tous", ...Array.from(new Set(allAnimals.map(a => a.type)))];

  const filtered = allAnimals.filter(a => {
    const q = search.toLowerCase();
    const assocName = (staticAssociations.find(as => as.id === a.associationId)?.name ?? "").toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.breed.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      assocName.includes(q);
    const matchType = filterType === "Tous" || a.type === filterType;
    return matchSearch && matchType;
  });

  const displayed = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);

  const handleFav = (animal: AnimalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setLoginPrompt(true); return; }
    toggleAnimal(animal.id, animal.name);
  };

  return (
    <>
      <section id="adoption" className="py-32 section-sage">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-sm font-bold text-primary uppercase tracking-widest mb-3 block">Adoption & bien-être</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
              Trouvez votre<br /><span className="text-primary">compagnon idéal</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Offrez une seconde chance à un animal. Des centaines de compagnons attendent une famille aimante.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par nom, race, ville, association..."
                value={search}
                onChange={e => { setSearch(e.target.value); setExpanded(true); }}
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => { setFilterType(type); setExpanded(true); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filterType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayed.map((animal) => {
              const assoc = getAssociation(animal.associationId);
              const isFav = favAnimals.includes(animal.id) && !!user;
              return (
                <div
                  key={animal.id}
                  className="card-hover card-shadow bg-white rounded-2xl overflow-hidden border border-border/30 group cursor-pointer"
                  onClick={() => setSelectedAnimal(animal)}
                >
                  <div className="relative h-72 overflow-hidden animal-img-overlay">
                    <img
                      src={getImage(animal)}
                      alt={animal.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2 z-10">
                      <span className="badge-adoption text-xs px-2.5 py-1 rounded-full">{animal.type}</span>
                      {animal.vaccinated && (
                        <span className="bg-white/85 backdrop-blur-sm text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />Vacciné
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <FavHeart isFav={isFav} onClick={(e) => handleFav(animal, e)} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white leading-tight">{animal.name}</h3>
                          <p className="text-white/80 text-sm mt-0.5">{animal.breed} · {animal.age}</p>
                        </div>
                        {assoc && (
                          <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1">
                            <Shield className="h-3 w-3 text-white/80 shrink-0" />
                            <span className="text-white/80 text-xs font-medium">{assoc.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <MapPin className="h-3.5 w-3.5" />{animal.location}
                    </div>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Voir le profil →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Aucun animal trouvé{search ? ` pour « ${search} »` : ""}.
            </p>
          )}

          {!expanded && filtered.length > INITIAL_COUNT && (
            <div className="text-center mt-12">
              <Button size="lg" className="font-bold px-8" onClick={() => setExpanded(true)}>
                Voir tous les animaux ({filtered.length})
              </Button>
            </div>
          )}
        </div>
      </section>

      {selectedAnimal && (
        <AdoptionModal
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          onViewAssoc={(id) => { setSelectedAnimal(null); onViewAssoc?.(id); }}
        />
      )}
      {loginPrompt && <LoginPrompt action="ajouter un favori" onClose={() => setLoginPrompt(false)} />}
    </>
  );
};

export default AdoptionSection;