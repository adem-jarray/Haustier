import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, ToastContainer } from "@/components/HeroAndFeatures";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { Calendar, Clock, ArrowLeft, CheckCircle, XCircle, Loader, Stethoscope } from "lucide-react";
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

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading } = useMyAppointments();

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
              <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"Fraunces,serif"}}>Mes rendez-vous</h1>
              <p className="text-sm text-muted-foreground">{appointments.length} rendez-vous au total</p>
            </div>
          </div>

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
