import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssocProfile, useAssocAnimals, useAdoptionRequests } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { User, Heart, Save, Plus, Trash2, CheckCircle, XCircle, ArrowLeft, Shield, FileText } from "lucide-react";
import PostsSection from "@/components/PostsSection";

const ADOPTION_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled:"bg-gray-100 text-gray-600",
};
const ADOPTION_STATUS_FR: Record<string, string> = {
  pending:"En attente", approved:"Approuvée", rejected:"Refusée", cancelled:"Annulée"
};

export default function DashboardAssocPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile"|"animals"|"adoptions">("profile");

  const { assoc, loading, update, create } = useMyAssocProfile();
  const { animals, addAnimal, updateAnimal, removeAnimal } = useAssocAnimals(assoc?.id ?? null);
  const { requests, updateStatus } = useAdoptionRequests(assoc?.id ?? null);

  const [form, setForm] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  // New animal form
  const [newAnimal, setNewAnimal] = useState({
    name:"", species:"dog", breed:"", age_months:"", gender:"Mâle",
    description:"", is_vaccinated:false, is_sterilized:false, status:"available"
  });
  const [addingAnimal, setAddingAnimal] = useState(false);
  const [showAnimalForm, setShowAnimalForm] = useState(false);

  if (!user) { navigate("/auth"); return null; }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const profileData = assoc ?? {};
  const getField = (k: string) => form[k] ?? profileData[k] ?? "";

  const handleSave = async () => {
    setSaving(true);
    const err = assoc ? await update(form) : await create({ ...form, name: getField("name") });
    setSaving(false);
    if (!err) { setSaveOk(true); setTimeout(() => setSaveOk(false), 2000); setForm({}); }
  };

  const handleAddAnimal = async () => {
    if (!newAnimal.name) return;
    setAddingAnimal(true);
    await addAnimal({
      ...newAnimal,
      age_months: newAnimal.age_months ? parseInt(newAnimal.age_months) : null,
    });
    setAddingAnimal(false);
    setShowAnimalForm(false);
    setNewAnimal({ name:"", species:"dog", breed:"", age_months:"", gender:"Mâle", description:"", is_vaccinated:false, is_sterilized:false, status:"available" });
  };

  const tabs = [
    { id:"profile",   label:"Mon profil",   icon:User },
    { id:"animals",   label:"Mes animaux",  icon:Heart },
    { id:"adoptions", label:"Adoptions",    icon:CheckCircle },
    { id:"posts",     label:"Publications", icon:FileText },
  ] as const;

  return (
    <div className="min-h-screen page-enter">
      <Navbar />
      <main className="pt-20 pb-16 section-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate("/animaux")} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors card-shadow">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"Fraunces,serif"}}>Espace association</h1>
              <p className="text-muted-foreground text-sm">Gérez votre profil et vos animaux</p>
            </div>
          </div>

          <div className="flex gap-1 bg-white rounded-2xl p-1.5 card-shadow mb-8 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center ${
                  tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>

          {/* Profile */}
          {tab === "profile" && (
            <div className="bg-white rounded-2xl p-7 card-shadow border border-border/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Informations de l'association</h2>
                  <p className="text-xs text-muted-foreground">Visibles par les adoptants potentiels</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key:"name",        label:"Nom de l'association",  placeholder:"Mon Association" },
                  { key:"city",        label:"Ville",                  placeholder:"Tunis" },
                  { key:"phone",       label:"Téléphone",              placeholder:"+216 XX XXX XXX" },
                  { key:"email",       label:"Email",                  placeholder:"contact@asso.tn" },
                  { key:"website",     label:"Site web",               placeholder:"https://asso.tn" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
                    <input type="text" placeholder={placeholder} value={getField(key)}
                      onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
                  <textarea rows={3} placeholder="Présentez votre association, vos missions..."
                    value={getField("description")}
                    onChange={e => setForm(f=>({...f,description:e.target.value}))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="mt-6 btn-gradient btn-ripple font-bold h-11 px-8">
                {saving ? "Sauvegarde..." : saveOk ? <><CheckCircle className="h-4 w-4 mr-2" />Sauvegardé !</> : <><Save className="h-4 w-4 mr-2" />Sauvegarder</>}
              </Button>
            </div>
          )}

          {/* Animals */}
          {tab === "animals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">Animaux ({animals.length})</h2>
                <Button onClick={() => setShowAnimalForm(v=>!v)} className="btn-gradient btn-ripple font-semibold h-9">
                  <Plus className="h-4 w-4 mr-1.5" />Ajouter un animal
                </Button>
              </div>

              {showAnimalForm && (
                <div className="bg-white rounded-2xl p-6 card-shadow border border-primary/20">
                  <h3 className="font-bold text-foreground mb-4">Nouvel animal</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key:"name",    label:"Nom",     placeholder:"Luna" },
                      { key:"breed",   label:"Race",    placeholder:"Européen" },
                    ].map(({key,label,placeholder}) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
                        <input type="text" placeholder={placeholder}
                          value={(newAnimal as any)[key]}
                          onChange={e => setNewAnimal(a=>({...a,[key]:e.target.value}))}
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Espèce</label>
                      <select value={newAnimal.species} onChange={e=>setNewAnimal(a=>({...a,species:e.target.value}))}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="dog">Chien</option>
                        <option value="cat">Chat</option>
                        <option value="rabbit">Lapin</option>
                        <option value="bird">Oiseau</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Genre</label>
                      <select value={newAnimal.gender} onChange={e=>setNewAnimal(a=>({...a,gender:e.target.value}))}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option>Mâle</option><option>Femelle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Âge (mois)</label>
                      <input type="number" placeholder="6"
                        value={newAnimal.age_months}
                        onChange={e=>setNewAnimal(a=>({...a,age_months:e.target.value}))}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                      <textarea rows={2} placeholder="Décrivez l'animal..."
                        value={newAnimal.description}
                        onChange={e=>setNewAnimal(a=>({...a,description:e.target.value}))}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-2 flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={newAnimal.is_vaccinated}
                          onChange={e=>setNewAnimal(a=>({...a,is_vaccinated:e.target.checked}))}
                          className="w-4 h-4 rounded accent-primary" />
                        Vacciné
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={newAnimal.is_sterilized}
                          onChange={e=>setNewAnimal(a=>({...a,is_sterilized:e.target.checked}))}
                          className="w-4 h-4 rounded accent-primary" />
                        Stérilisé
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleAddAnimal} disabled={addingAnimal || !newAnimal.name} className="btn-gradient btn-ripple font-bold h-10 flex-1">
                      {addingAnimal ? "Ajout..." : "Ajouter"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAnimalForm(false)} className="h-10">Annuler</Button>
                  </div>
                </div>
              )}

              {animals.length === 0 && !showAnimalForm && (
                <div className="bg-white rounded-2xl p-10 card-shadow border border-border/40 text-center">
                  <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground text-sm">Aucun animal enregistré.</p>
                </div>
              )}

              {animals.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-5 card-shadow border border-border/40 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-2xl">
                    {a.species === "cat" ? "🐱" : a.species === "rabbit" ? "🐰" : a.species === "bird" ? "🐦" : "🐶"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.breed} · {a.age_months ? `${a.age_months} mois` : ""} · {a.gender}</p>
                    <div className="flex gap-2 mt-1">
                      <select value={a.status} onChange={e => updateAnimal(a.id, {status: e.target.value})}
                        className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
                        <option value="available">Disponible</option>
                        <option value="reserved">Réservé</option>
                        <option value="adopted">Adopté</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeAnimal(a.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {tab === "posts" && user && (
            <PostsSection
              authorId={user.id}
              authorType="assoc"
              authorName={assoc?.name || user.user_metadata?.full_name || "Association"}
              canPost={true}
            />
          )}

          {/* Adoptions */}
          {tab === "adoptions" && (
            <div className="bg-white rounded-2xl p-6 card-shadow border border-border/40">
              <h2 className="font-bold text-foreground mb-5">Demandes d'adoption</h2>
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(r => (
                    <div key={r.id} className="p-4 border border-border/50 rounded-2xl">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-bold text-foreground text-sm">{r.profiles?.full_name || "Adoptant"}</p>
                          <p className="text-xs text-muted-foreground">Pour : {r.animals?.name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ADOPTION_STATUS_COLORS[r.status]}`}>
                          {ADOPTION_STATUS_FR[r.status]}
                        </span>
                      </div>
                      {r.message && <p className="text-xs bg-muted/40 rounded-lg px-3 py-2 mb-3">{r.message}</p>}
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="btn-gradient btn-ripple font-semibold flex-1 h-9"
                            onClick={() => updateStatus(r.id, "approved")}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approuver
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                            onClick={() => updateStatus(r.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
