import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMyVetProfile, useVetSlots } from "@/hooks/useDashboard";
import { useVetAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { User, Calendar, Clock, FileText, Plus, Trash2, CheckCircle, XCircle, ArrowLeft, Save, Stethoscope } from "lucide-react";
import PostsSection from "@/components/PostsSection";

const DAYS_FR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};
const STATUS_FR: Record<string, string> = {
  pending:"En attente", confirmed:"Confirmé", cancelled:"Annulé", completed:"Terminé"
};

export default function DashboardVetPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile"|"slots"|"appointments"|"posts">("profile");

  const { vet, loading: vetLoading, update, create } = useMyVetProfile();
  const { slots, addSlot, removeSlot } = useVetSlots(vet?.id ?? null);
  const { appointments, updateStatus } = useVetAppointments(vet?.id ?? null);

  // Profile form state
  const [form, setForm] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  // New slot form
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });

  if (!user) { navigate("/auth"); return null; }
  if (vetLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  const profileData = vet ?? {};
  const getField = (k: string) => form[k] ?? profileData[k] ?? "";

  const handleSave = async () => {
    setSaving(true);
    const err = vet
      ? await update(form)
      : await create({ ...form, name: getField("name") });
    setSaving(false);
    if (!err) { setSaveOk(true); setTimeout(() => setSaveOk(false), 2000); setForm({}); }
  };

  const tabs = [
    { id: "profile",      label: "Mon profil",   icon: User },
    { id: "slots",        label: "Mes créneaux", icon: Clock },
    { id: "appointments", label: "Rendez-vous",  icon: Calendar },
    { id: "posts",        label: "Publications",  icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen page-enter">
      <Navbar />
      <main className="pt-20 pb-16 section-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate("/veterinaires")} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors card-shadow">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"Fraunces,serif"}}>
                Espace vétérinaire
              </h1>
              <p className="text-muted-foreground text-sm">Gérez votre profil et vos disponibilités</p>
            </div>
          </div>

          {/* Tabs */}
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

          {/* Profile tab */}
          {tab === "profile" && (
            <div className="bg-white rounded-2xl p-7 card-shadow border border-border/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Informations du cabinet</h2>
                  <p className="text-xs text-muted-foreground">Ces informations seront visibles par les patients</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key:"name", label:"Nom complet", placeholder:"Dr. Prénom Nom" },
                  { key:"specialty", label:"Spécialité", placeholder:"Médecine générale" },
                  { key:"phone", label:"Téléphone", placeholder:"+216 XX XXX XXX" },
                  { key:"email", label:"Email professionnel", placeholder:"contact@cabinet.tn" },
                  { key:"city", label:"Ville", placeholder:"Tunis" },
                  { key:"working_hours", label:"Horaires", placeholder:"Lun-Ven 9h-18h" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
                    <input
                      type="text" placeholder={placeholder}
                      value={getField(key)}
                      onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Adresse complète</label>
                  <input type="text" placeholder="15 Rue de la République, 1000 Tunis"
                    value={getField("address")}
                    onChange={e => setForm(f => ({...f, address: e.target.value}))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Description / À propos</label>
                  <textarea rows={3} placeholder="Décrivez votre pratique, vos spécialisations..."
                    value={getField("description")}
                    onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="mt-6 btn-gradient btn-ripple font-bold h-11 px-8">
                {saving ? "Sauvegarde..." : saveOk ? <><CheckCircle className="h-4 w-4 mr-2" />Sauvegardé !</> : <><Save className="h-4 w-4 mr-2" />Sauvegarder</>}
              </Button>
            </div>
          )}

          {/* Slots tab */}
          {tab === "slots" && (
            <div className="space-y-5">
              {/* Add slot */}
              <div className="bg-white rounded-2xl p-6 card-shadow border border-border/40">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />Ajouter un créneau
                </h2>
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Jour</label>
                    <select value={newSlot.day_of_week} onChange={e => setNewSlot(s=>({...s,day_of_week:+e.target.value}))}
                      className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {DAYS_FR.map((d,i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Début</label>
                    <input type="time" value={newSlot.start_time} onChange={e => setNewSlot(s=>({...s,start_time:e.target.value}))}
                      className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Fin</label>
                    <input type="time" value={newSlot.end_time} onChange={e => setNewSlot(s=>({...s,end_time:e.target.value}))}
                      className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <Button onClick={() => addSlot(newSlot)} className="btn-gradient btn-ripple font-bold h-10 px-5">
                    <Plus className="h-4 w-4 mr-1" />Ajouter
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Les créneaux de 30 minutes seront générés automatiquement entre le début et la fin.</p>
              </div>

              {/* Slots list grouped by day */}
              <div className="bg-white rounded-2xl p-6 card-shadow border border-border/40">
                <h2 className="font-bold text-foreground mb-4">Créneaux actifs</h2>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun créneau défini. Ajoutez vos disponibilités.</p>
                ) : (
                  <div className="space-y-3">
                    {slots.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground w-24">{DAYS_FR[s.day_of_week]}</span>
                          <span className="text-sm text-muted-foreground">{s.start_time.slice(0,5)} → {s.end_time.slice(0,5)}</span>
                        </div>
                        <button onClick={() => removeSlot(s.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posts tab */}
          {tab === "posts" && user && (
            <PostsSection
              authorId={user.id}
              authorType="vet"
              authorName={vet?.name || user.user_metadata?.full_name || "Vétérinaire"}
              canPost={true}
            />
          )}

          {/* Appointments tab */}
          {tab === "appointments" && (
            <div className="bg-white rounded-2xl p-6 card-shadow border border-border/40">
              <h2 className="font-bold text-foreground mb-5">Demandes de rendez-vous</h2>
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map(a => (
                    <div key={a.id} className="p-4 border border-border/50 rounded-2xl">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-bold text-foreground text-sm">{a.patient_name || "Patient"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.appointment_date).toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long"})} à {a.appointment_time?.slice(0,5)}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[a.status]}`}>
                          {STATUS_FR[a.status]}
                        </span>
                      </div>
                      {a.reason && <p className="text-xs text-muted-foreground mb-3 bg-muted/40 rounded-lg px-3 py-2">{a.reason}</p>}
                      {a.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="btn-gradient btn-ripple font-semibold flex-1 h-9"
                            onClick={() => updateStatus(a.id, "confirmed")}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Confirmer
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-9 text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                            onClick={() => updateStatus(a.id, "cancelled")}>
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
