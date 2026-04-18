import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Get the vet DB record for the logged-in user
export function useMyVetProfile() {
  const { user } = useAuth();
  const [vet, setVet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("veterinarians")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setVet(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = async (fields: Record<string, any>) => {
    if (!vet) return;
    const { error } = await supabase
      .from("veterinarians")
      .update(fields)
      .eq("id", vet.id);
    if (!error) load();
    return error;
  };

  const create = async (fields: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase
      .from("veterinarians")
      .insert({ ...fields, user_id: user.id });
    if (!error) load();
    return error;
  };

  return { vet, loading, update, create, refresh: load };
}

// Get the association DB record for the logged-in user
export function useMyAssocProfile() {
  const { user } = useAuth();
  const [assoc, setAssoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("associations")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setAssoc(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = async (fields: Record<string, any>) => {
    if (!assoc) return;
    const { error } = await supabase
      .from("associations")
      .update(fields)
      .eq("id", assoc.id);
    if (!error) load();
    return error;
  };

  const create = async (fields: Record<string, any>) => {
    if (!user) return;
    const { error } = await supabase
      .from("associations")
      .insert({ ...fields, user_id: user.id });
    if (!error) load();
    return error;
  };

  return { assoc, loading, update, create, refresh: load };
}

// Animals for an association
export function useAssocAnimals(assocId: string | null) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const { data } = await supabase
      .from("animals")
      .select("*")
      .eq("association_id", assocId)
      .order("created_at", { ascending: false });
    setAnimals(data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const addAnimal = async (fields: Record<string, any>) => {
    const { error } = await supabase
      .from("animals")
      .insert({ ...fields, association_id: assocId });
    if (!error) load();
    return error;
  };

  const updateAnimal = async (id: string, fields: Record<string, any>) => {
    const { error } = await supabase.from("animals").update(fields).eq("id", id);
    if (!error) load();
    return error;
  };

  const removeAnimal = async (id: string) => {
    await supabase.from("animals").delete().eq("id", id);
    load();
  };

  return { animals, loading, addAnimal, updateAnimal, removeAnimal, refresh: load };
}

// Adoption requests for an association
export function useAdoptionRequests(assocId: string | null) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const { data } = await supabase
      .from("adoption_requests")
      .select("*, animals(name, species), profiles(full_name)")
      .eq("animals.association_id", assocId)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("adoption_requests").update({ status }).eq("id", id);
    load();
  };

  return { requests, loading, updateStatus, refresh: load };
}

// Availability slots for vet dashboard
export function useVetSlots(vetId: string | null) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!vetId) return;
    setLoading(true);
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("vet_id", vetId)
      .order("day_of_week")
      .order("start_time");
    setSlots(data ?? []);
    setLoading(false);
  }, [vetId]);

  useEffect(() => { load(); }, [load]);

  const addSlot = async (fields: { day_of_week: number; start_time: string; end_time: string }) => {
    const { error } = await supabase
      .from("availability_slots")
      .insert({ ...fields, vet_id: vetId, is_active: true });
    if (!error) load();
    return error;
  };

  const removeSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    load();
  };

  return { slots, loading, addSlot, removeSlot, refresh: load };
}

// ─── CAMPAIGNS ─────────────────────────────────────────────────────────────
export function useCampaigns(assocId: string | null) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("association_id", assocId)
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const addCampaign = async (fields: Record<string, any>) => {
    const { error } = await supabase
      .from("campaigns")
      .insert({ ...fields, association_id: assocId });
    if (!error) load();
    return error;
  };

  const removeCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    load();
  };

  return { campaigns, loading, addCampaign, removeCampaign, refresh: load };
}

// ─── SUPPORT (Donations & Volunteers) ─────────────────────────────────────────
export function useSupport(assocId: string | null) {
  const [donations, setDonations] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const [donRes, volRes] = await Promise.all([
      supabase.from("donations").select("*, profiles(full_name)").eq("association_id", assocId).order("created_at", { ascending: false }),
      supabase.from("volunteer_requests").select("*, profiles(full_name)").eq("association_id", assocId).order("created_at", { ascending: false })
    ]);
    setDonations(donRes.data ?? []);
    setVolunteers(volRes.data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const updateVolunteerStatus = async (id: string, status: string) => {
    await supabase.from("volunteer_requests").update({ status }).eq("id", id);
    load();
  };

  return { donations, volunteers, loading, updateVolunteerStatus, refresh: load };
}
