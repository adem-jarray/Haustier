import { useState, useMemo } from "react";
import { X, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useVetAvailability, getAvailableTimesForDate, bookAppointment } from "@/hooks/useAppointments";
import type { VetEntry } from "@/hooks/useDynamicData";
import { Link } from "react-router-dom";

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

interface Props {
  vet: VetEntry;
  vetDbId: string | null;   // UUID from veterinarians table (null = static vet, no DB record)
  onClose: () => void;
}

export function BookingModal({ vet, vetDbId, onClose }: Props) {
  const { user, role } = useAuth();
  const { slots, bookedSlots, loading } = useVetAvailability(vetDbId);

  const [step, setStep] = useState<"date" | "time" | "reason" | "done">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar navigation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Days in month grid
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth]);

  // Available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate || !vetDbId) return [];
    return getAvailableTimesForDate(selectedDate, slots, bookedSlots);
  }, [selectedDate, slots, bookedSlots, vetDbId]);

  const isDayAvailable = (d: Date) => {
    if (d < today) return false;
    if (!vetDbId) return false; // static vet — no slots
    const dow = d.getDay();
    return slots.some(s => s.day_of_week === dow && s.is_active);
  };

  const handleBook = async () => {
    if (!user || !selectedDate || !selectedTime || !vetDbId) return;
    setSubmitting(true);
    setError(null);
    const dateStr = selectedDate.toISOString().split("T")[0];
    const { error: err } = await bookAppointment({
      vetDbId,
      date: dateStr,
      time: selectedTime,
      reason,
      userId: user.id,
    });
    setSubmitting(false);
    if (err) { setError(err); return; }
    setStep("done");
  };

  // Not logged in
  if (!user) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center card-shadow animate-badge-pop" onClick={e => e.stopPropagation()}>
        <Calendar className="h-12 w-12 text-primary mx-auto mb-4 opacity-70" />
        <h3 className="text-xl font-bold text-foreground mb-2">Connexion requise</h3>
        <p className="text-muted-foreground text-sm mb-6">Vous devez être connecté pour prendre rendez-vous.</p>
        <div className="flex gap-3">
          <Link to="/auth" className="flex-1"><Button className="w-full btn-gradient btn-ripple font-bold">Se connecter</Button></Link>
          <Button variant="outline" onClick={onClose} className="flex-1">Fermer</Button>
        </div>
      </div>
    </div>
  );

  // Professional accounts cannot book — only patient (user) accounts can
  if (role !== "user") return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center card-shadow animate-badge-pop" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Réservé aux patients</h3>
        <p className="text-muted-foreground text-sm mb-6">
          La prise de rendez-vous est réservée aux comptes patients (utilisateur).
          Les comptes {role === "veterinaire" ? "vétérinaire" : "association"} ne peuvent pas prendre de rendez-vous.
        </p>
        <Button variant="outline" onClick={onClose} className="w-full font-semibold">Fermer</Button>
      </div>
    </div>
  );

  // No DB record (static vet) — phone fallback
  if (!vetDbId || (!loading && slots.length === 0)) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full card-shadow animate-badge-pop" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
        <div className="text-center mb-6">
          <Phone className="h-10 w-10 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold text-foreground">{vet.name}</h3>
          <p className="text-muted-foreground text-sm">{vet.specialty}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-2 text-center">Ce vétérinaire n'a pas encore activé la prise de RDV en ligne.</p>
        <p className="text-sm text-muted-foreground text-center mb-5">Appelez directement :</p>
        <a href={`tel:${vet.phone}`} className="block">
          <Button className="w-full btn-gradient btn-ripple font-bold h-12 text-base">
            <Phone className="mr-2 h-5 w-5" />{vet.phone}
          </Button>
        </a>
        <p className="text-xs text-muted-foreground text-center mt-4">{vet.hours}</p>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md card-shadow animate-badge-pop overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between" style={{background:"linear-gradient(135deg,hsl(158 42% 14%),hsl(158 38% 22%))"}}>
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Rendez-vous avec</p>
            <h3 className="text-lg font-bold text-white">{vet.name}</h3>
            <p className="text-white/70 text-sm">{vet.specialty}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {(["date","time","reason"] as const).map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${
              step === "done" || ["date","time","reason"].indexOf(step) >= i
                ? "bg-primary"
                : "bg-muted"
            }`} />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Date picker */}
          {step === "date" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-foreground">Choisir une date</h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1,1))} className="w-8 h-8 rounded-lg border hover:bg-muted flex items-center justify-center">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold min-w-[120px] text-center">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1,1))} className="w-8 h-8 rounded-lg border hover:bg-muted flex items-center justify-center">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const avail = isDayAvailable(d);
                  const isSel = selectedDate?.toDateString() === d.toDateString();
                  return (
                    <button key={i} disabled={!avail}
                      onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                      className={`h-9 w-full rounded-lg text-sm font-medium transition-all ${
                        isSel ? "bg-primary text-white shadow-md" :
                        avail ? "hover:bg-primary/10 text-foreground" :
                        "text-muted-foreground/40 cursor-not-allowed"
                      }`}>
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              <Button className="w-full mt-5 btn-gradient btn-ripple font-bold h-11" disabled={!selectedDate}
                onClick={() => setStep("time")}>
                Continuer
              </Button>
            </div>
          )}

          {/* Step 2: Time picker */}
          {step === "time" && selectedDate && (
            <div>
              <button onClick={() => setStep("date")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                {selectedDate.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
              </button>
              <h4 className="font-bold text-foreground mb-4">Choisir un créneau</h4>
              {availableTimes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun créneau disponible ce jour.</p>
                  <button onClick={() => setStep("date")} className="text-primary text-sm font-semibold mt-2 hover:underline">
                    Choisir une autre date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableTimes.map(t => (
                    <button key={t} onClick={() => setSelectedTime(t)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        selectedTime === t
                          ? "bg-primary text-white border-primary shadow-md"
                          : "border-border hover:border-primary/40 hover:text-primary text-foreground"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {selectedTime && (
                <Button className="w-full mt-5 btn-gradient btn-ripple font-bold h-11" onClick={() => setStep("reason")}>
                  Continuer
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Reason */}
          {step === "reason" && (
            <div>
              <button onClick={() => setStep("time")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                {selectedDate?.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })} à {selectedTime}
              </button>
              <h4 className="font-bold text-foreground mb-1">Motif de consultation</h4>
              <p className="text-xs text-muted-foreground mb-4">Optionnel — aide le vétérinaire à préparer la consultation.</p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="Décrivez brièvement la raison de votre visite..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              <Button
                className="w-full mt-4 btn-gradient btn-ripple font-bold h-12"
                onClick={handleBook}
                disabled={submitting}
              >
                {submitting ? "Envoi en cours..." : "Confirmer le rendez-vous"}
              </Button>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Demande envoyée !</h4>
              <p className="text-muted-foreground text-sm mb-1">
                {selectedDate?.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })} à {selectedTime}
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                {vet.name} recevra votre demande et vous confirmera le rendez-vous.
              </p>
              <Button onClick={onClose} className="btn-gradient btn-ripple font-bold w-full h-11">Fermer</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
