import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowLeft, CheckCircle, XCircle, Loader, Stethoscope, Heart, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:   <Clock className="h-3.5 w-3.5" />,
  confirmed: <CheckCircle className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
  completed: <CheckCircle className="h-3.5 w-3.5" />,
};
const STATUS_FR: Record<string, string> = {
  pending:"En attente de confirmation", confirmed:"Confirmé", cancelled:"Annulé", completed:"Terminé"
};

const ADOPT_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  approved:  "bg-green-100 text-green-700 border-green-200",
  rejected:  "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};
const ADOPT_STATUS_FR: Record<string, string> = {
  pending:"En attente", approved:"Approuvée", rejected:"Refusée", cancelled:"Annulée"
};

function useMyAdoptionRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("adoption_requests")
      .select("*, animals(name, species)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { requests, loading };
}

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"rdv" | "adoptions">("rdv");
  const { appointments, loading } = useMyAppointments();
  const { requests: adoptionRequests, loading: adoptLoading } = useMyAdoptionRequests();

  if (!user) { navigate("/auth"); return null; }

  const upcoming = appointments.filter(a =>
    a.status !== "cancelled" && new Date(a.appointment_date) >= new Date()
  );
  const past = appointments.filter(a =>
    a.status === "completed" || (a.status !== "cancelled" && new Date(a.appointment_date) < new Date())
  );
  const cancelled = appointments.filter(a => a.status === "cancelled");

  return (
    <div className="min-h-screen page-enter">
      <Navbar />
      <main className="pt-20 pb-16 section-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors card-shadow">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"Fraunces,serif"}}>Mon espace</h1>
              <p className="text-sm text-muted-foreground">Rendez-vous et demandes d'adoption</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 card-shadow mb-8">
            <button onClick={() => setTab("rdv")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all ${
                tab === "rdv" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Stethoscope className="h-4 w-4" />Mes rendez-vous
              {appointments.length > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{appointments.length}</span>}
            </button>
            <button onClick={() => setTab("adoptions")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all ${
                tab === "adoptions" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Heart className="h-4 w-4" />Mes adoptions
              {adoptionRequests.length > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{adoptionRequests.length}</span>}
            </button>
          </div>

          {/* RDV Tab */}
          {tab === "rdv" && (
            <>
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader className="h-8 w-8 animate-spin text-primary opacity-50" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 card-shadow border border-border/40 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="font-semibold text-foreground mb-1">Aucun rendez-vous</p>
                  <p className="text-sm text-muted-foreground mb-6">Vous n'avez pas encore pris de rendez-vous.</p>
                  <Button onClick={() => navigate("/veterinaires")} className="btn-gradient btn-ripple font-bold">
                    Trouver un vétérinaire
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcoming.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">À venir</h2>
                      <div className="space-y-3">
                        {upcoming.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                      </div>
                    </div>
                  )}
                  {past.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Passés</h2>
                      <div className="space-y-3">
                        {past.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                      </div>
                    </div>
                  )}
                  {cancelled.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Annulés</h2>
                      <div className="space-y-3">
                        {cancelled.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Adoptions Tab */}
          {tab === "adoptions" && (
            <>
              {adoptLoading ? (
                <div className="flex justify-center py-20">
                  <Loader className="h-8 w-8 animate-spin text-primary opacity-50" />
                </div>
              ) : adoptionRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 card-shadow border border-border/40 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="font-semibold text-foreground mb-1">Aucune demande d'adoption</p>
                  <p className="text-sm text-muted-foreground mb-6">Vous n'avez pas encore fait de demande d'adoption.</p>
                  <Button onClick={() => navigate("/animaux")} className="btn-gradient btn-ripple font-bold">
                    Parcourir les animaux
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {adoptionRequests.map(r => {
                    const colors = ADOPT_STATUS_COLORS[r.status] ?? ADOPT_STATUS_COLORS.pending;
                    const label = ADOPT_STATUS_FR[r.status] ?? r.status;
                    return (
                      <div key={r.id} className="bg-white rounded-2xl p-5 card-shadow border border-border/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                              <Heart className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {r.animals?.name || "Animal"}
                                {r.animals?.species && <span className="text-muted-foreground font-normal text-sm ml-1.5">({r.animals.species})</span>}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(r.created_at).toLocaleDateString("fr-FR", {
                                  day:"numeric", month:"long", year:"numeric"
                                })}
                              </p>
                              {r.message && (
                                <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg px-3 py-2 max-w-xs">
                                  {r.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${colors}`}>
                            {r.status === "approved" ? <CheckCircle className="h-3.5 w-3.5" /> :
                             r.status === "rejected" ? <XCircle className="h-3.5 w-3.5" /> :
                             <Clock className="h-3.5 w-3.5" />}
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

function AppointmentCard({ appointment: a }: { appointment: any }) {
  const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending;
  const icon = STATUS_ICONS[a.status];
  const label = STATUS_FR[a.status] ?? a.status;

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-border/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">{a.vet_name || "Vétérinaire"}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(a.appointment_date).toLocaleDateString("fr-FR", {
                weekday:"long", day:"numeric", month:"long", year:"numeric"
              })}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {a.appointment_time?.slice(0,5)}
            </p>
            {a.reason && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg px-3 py-2 max-w-xs">
                {a.reason}
              </p>
            )}
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${colors}`}>
          {icon}{label}
        </span>
      </div>
    </div>
  );
}
