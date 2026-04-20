import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BookedSlot {
  booked_date: string;
  booked_time: string;
}

export interface Appointment {
  id: string;
  vet_id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  // joined
  patient_name?: string;
  vet_name?: string;
}

// Get weekly availability for a vet
export function useVetAvailability(vetDbId: string | null) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!vetDbId) return;
    setLoading(true);
    const [slotsRes, bookedRes] = await Promise.all([
      supabase.from("availability_slots").select("*").eq("vet_id", vetDbId).eq("is_active", true),
      supabase.from("booked_slots").select("booked_date, booked_time").eq("vet_id", vetDbId),
    ]);
    setSlots(slotsRes.data ?? []);
    setBookedSlots(bookedRes.data ?? []);
    setLoading(false);
  }, [vetDbId]);

  useEffect(() => { load(); }, [load]);

  return { slots, bookedSlots, loading, refresh: load };
}

// Get times available for a specific date
export function getAvailableTimesForDate(
  date: Date,
  slots: Slot[],
  bookedSlots: BookedSlot[]
): string[] {
  const dow = date.getDay(); // 0=Sun
  const dateStr = date.toISOString().split("T")[0];
  const bookedTimes = new Set(
    bookedSlots.filter(b => b.booked_date === dateStr).map(b => b.booked_time.slice(0, 5))
  );

  const daySlots = slots.filter(s => s.day_of_week === dow);
  const times: string[] = [];

  for (const slot of daySlots) {
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + 30 <= end) {
      const h = String(Math.floor(cur / 60)).padStart(2, "0");
      const m = String(cur % 60).padStart(2, "0");
      const t = `${h}:${m}`;
      if (!bookedTimes.has(t)) times.push(t);
      cur += 30;
    }
  }
  return times;
}

// Book an appointment
export async function bookAppointment(params: {
  vetDbId: string;
  date: string;
  time: string;
  reason: string;
  userId: string;
  patientName?: string;
  patientEmail?: string;
}): Promise<{ error: string | null }> {
  const { vetDbId, date, time, reason, userId, patientName, patientEmail } = params;

  // ─── Step 1: Claim the slot FIRST ──────────────────────────────────
  // The booked_slots table has UNIQUE(vet_id, booked_date, booked_time),
  // so if another user already booked this exact slot, the INSERT fails
  // immediately — preventing any double-booking race condition.
  const { data: slotData, error: slotErr } = await supabase
    .from("booked_slots")
    .insert({
      vet_id: vetDbId,
      booked_date: date,
      booked_time: time,
      // appointment_id will be updated after we create the appointment
    })
    .select()
    .single();

  if (slotErr) {
    // Duplicate key = someone else already booked this slot
    if (slotErr.message.includes("duplicate") || slotErr.message.includes("unique") || slotErr.code === "23505") {
      return { error: "Ce créneau vient d'être réservé par un autre patient. Veuillez choisir un autre horaire." };
    }
    return { error: slotErr.message };
  }

  // ─── Step 2: Create the appointment ────────────────────────────────
  // Try inserting with patient_name & patient_email first.
  // If those columns don't exist yet, fall back to inserting without them.
  let appt: any;
  let apptErr: any;

  const fullPayload: Record<string, unknown> = {
    vet_id: vetDbId,
    user_id: userId,
    appointment_date: date,
    appointment_time: time,
    reason,
    status: "pending",
    patient_name: patientName ?? null,
    patient_email: patientEmail ?? null,
  };

  const result1 = await supabase
    .from("appointments")
    .insert(fullPayload)
    .select()
    .single();

  if (result1.error && result1.error.message.includes("schema cache")) {
    const fallbackPayload: Record<string, unknown> = {
      vet_id: vetDbId,
      user_id: userId,
      appointment_date: date,
      appointment_time: time,
      reason,
      status: "pending",
    };
    const result2 = await supabase
      .from("appointments")
      .insert(fallbackPayload)
      .select()
      .single();
    appt = result2.data;
    apptErr = result2.error;
  } else {
    appt = result1.data;
    apptErr = result1.error;
  }

  if (apptErr) {
    // Rollback: remove the claimed slot since appointment creation failed
    await supabase.from("booked_slots").delete().eq("id", slotData.id);
    return { error: apptErr.message };
  }

  // ─── Step 3: Link the appointment to the booked slot ───────────────
  await supabase
    .from("booked_slots")
    .update({ appointment_id: appt.id })
    .eq("id", slotData.id);

  return { error: null };
}

// Patient: get own appointments
export function useMyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, veterinarians(name)")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: true });
    setAppointments(
      (data ?? []).map((a: any) => ({ ...a, vet_name: a.veterinarians?.name }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  return { appointments, loading, refresh: load };
}

// Vet dashboard: get appointments for vet
export function useVetAppointments(vetDbId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!vetDbId) return;
    setLoading(true);
    // Try to join profiles; fall back gracefully if the table/column doesn't exist
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("vet_id", vetDbId)
      .order("appointment_date", { ascending: true });
    setAppointments(
      (data ?? []).map((a: any) => ({
        ...a,
        patient_name: a.patient_name ?? a.patient_email ?? "Patient",
      }))
    );
    setLoading(false);
  }, [vetDbId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    load();
  };

  return { appointments, loading, refresh: load, updateStatus };
}
