import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AppointmentNotification {
  id: string;
  appointment_id: string;
  vet_name: string;
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "cancelled" | "completed";
  seen: boolean;
  updated_at: string;
}

const STORAGE_KEY = "haustier_notif_seen";

/** Read set of seen notification IDs from localStorage */
function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

/** Persist seen IDs */
function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

/**
 * Hook that returns appointment notifications for the current user.
 * A "notification" is any appointment whose status has moved away from "pending"
 * (i.e. confirmed, cancelled, completed) — the user needs to know about those.
 */
export function useNotifications() {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // Only show notifications for regular users (patients)
    if (!user || role !== "user") { setNotifications([]); return; }

    setLoading(true);
    const seenIds = getSeenIds();

    // Fetch appointments that are NOT pending (= status changed by vet)
    const { data } = await supabase
      .from("appointments")
      .select("id, vet_id, appointment_date, appointment_time, status, updated_at, veterinarians(name)")
      .eq("user_id", user.id)
      .neq("status", "pending")
      .order("updated_at", { ascending: false })
      .limit(20);

    const items: AppointmentNotification[] = (data ?? []).map((a: any) => ({
      id: `notif-${a.id}`,
      appointment_id: a.id,
      vet_name: a.veterinarians?.name ?? "Vétérinaire",
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      status: a.status,
      seen: seenIds.has(a.id),
      updated_at: a.updated_at,
    }));

    setNotifications(items);
    setLoading(false);
  }, [user, role]);

  // Poll every 30 seconds for new status changes
  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  /** Mark a single notification as seen */
  const markSeen = useCallback((appointmentId: string) => {
    const seenIds = getSeenIds();
    seenIds.add(appointmentId);
    saveSeenIds(seenIds);
    setNotifications(prev =>
      prev.map(n => n.appointment_id === appointmentId ? { ...n, seen: true } : n)
    );
  }, []);

  /** Mark all notifications as seen */
  const markAllSeen = useCallback(() => {
    const seenIds = getSeenIds();
    notifications.forEach(n => seenIds.add(n.appointment_id));
    saveSeenIds(seenIds);
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.seen).length;

  return { notifications, unreadCount, loading, markSeen, markAllSeen, refresh: load };
}
