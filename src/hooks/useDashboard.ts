import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ─── VET PROFILE ───────────────────────────────────────────────────────────────
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

// ─── ASSOCIATION PROFILE ────────────────────────────────────────────────────────
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

// ─── ANIMALS ────────────────────────────────────────────────────────────────────
export function useAssocAnimals(assocId: string | null) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("association_id", assocId)
      .order("created_at", { ascending: false });
    if (error) console.error("useAssocAnimals load error:", error);
    setAnimals(data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const addAnimal = async (fields: Record<string, any>) => {
    if (!assocId) return "No assocId";
    // Clean up fields — remove empty strings, convert types
    const insertData: Record<string, any> = {
      association_id: assocId,
      name: fields.name,
      species: fields.species || "dog",
      status: fields.status || "available",
    };
    if (fields.breed) insertData.breed = fields.breed;
    if (fields.age_months !== null && fields.age_months !== undefined && fields.age_months !== "") {
      insertData.age_months = typeof fields.age_months === "string" ? parseInt(fields.age_months) : fields.age_months;
    }
    if (fields.gender) insertData.gender = fields.gender;
    if (fields.description) insertData.description = fields.description;
    if (fields.image_url) insertData.image_url = fields.image_url;
    if (fields.is_vaccinated !== undefined) insertData.is_vaccinated = !!fields.is_vaccinated;
    if (fields.is_sterilized !== undefined) insertData.is_sterilized = !!fields.is_sterilized;

    const { error } = await supabase.from("animals").insert(insertData);
    if (error) {
      console.error("addAnimal error:", error);
      return error;
    }
    await load();
    return null;
  };

  const updateAnimal = async (id: string, fields: Record<string, any>) => {
    const { error } = await supabase.from("animals").update(fields).eq("id", id);
    if (error) console.error("updateAnimal error:", error);
    if (!error) load();
    return error;
  };

  const removeAnimal = async (id: string) => {
    const { error } = await supabase.from("animals").delete().eq("id", id);
    if (error) console.error("removeAnimal error:", error);
    load();
  };

  return { animals, loading, addAnimal, updateAnimal, removeAnimal, refresh: load };
}

// ─── ADOPTION REQUESTS ──────────────────────────────────────────────────────────
export function useAdoptionRequests(assocId: string | null) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    // First get the animal IDs belonging to this association
    const { data: animalRows } = await supabase
      .from("animals")
      .select("id")
      .eq("association_id", assocId);
    const animalIds = (animalRows ?? []).map(a => a.id);
    if (animalIds.length === 0) { setRequests([]); setLoading(false); return; }

    // Fetch adoption requests for those animals
    const { data } = await supabase
      .from("adoption_requests")
      .select("*, animals(name, species)")
      .in("animal_id", animalIds)
      .order("created_at", { ascending: false });

    // Enrich with profile names (manual join since no FK to profiles)
    const enriched = await enrichWithProfiles(data ?? [], "user_id");
    setRequests(enriched);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("adoption_requests").update({ status }).eq("id", id);
    load();
  };

  return { requests, loading, updateStatus, refresh: load };
}

// ─── VET SLOTS ──────────────────────────────────────────────────────────────────
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

// ─── CAMPAIGNS ─────────────────────────────────────────────────────────────────
export function useCampaigns(assocId: string | null) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("association_id", assocId)
      .order("created_at", { ascending: false });
    if (error) console.error("useCampaigns load error:", error);
    setCampaigns(data ?? []);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const addCampaign = async (fields: Record<string, any>) => {
    if (!assocId) return "No assocId";
    const insertData: Record<string, any> = {
      association_id: assocId,
      title: fields.title,
      description: fields.description || "",
    };
    if (fields.location) insertData.location = fields.location;
    if (fields.event_date) insertData.event_date = fields.event_date;

    const { error } = await supabase.from("campaigns").insert(insertData);
    if (error) {
      console.error("addCampaign error:", error);
      return error;
    }
    await load();
    return null;
  };

  const removeCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) console.error("removeCampaign error:", error);
    load();
  };

  return { campaigns, loading, addCampaign, removeCampaign, refresh: load };
}

// ─── SUPPORT (Donations & Volunteers) ──────────────────────────────────────────
export function useSupport(assocId: string | null) {
  const [donations, setDonations] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assocId) return;
    setLoading(true);

    // Fetch donations and volunteer requests WITHOUT the problematic profiles join
    const [donRes, volRes] = await Promise.all([
      supabase
        .from("donations")
        .select("*")
        .eq("association_id", assocId)
        .order("created_at", { ascending: false }),
      supabase
        .from("volunteer_requests")
        .select("*")
        .eq("association_id", assocId)
        .order("created_at", { ascending: false }),
    ]);

    if (donRes.error) console.error("donations fetch error:", donRes.error);
    if (volRes.error) console.error("volunteer_requests fetch error:", volRes.error);

    // Manually enrich with profile names
    const enrichedDonations = await enrichWithProfiles(donRes.data ?? [], "user_id");
    const enrichedVolunteers = await enrichWithProfiles(volRes.data ?? [], "user_id");

    setDonations(enrichedDonations);
    setVolunteers(enrichedVolunteers);
    setLoading(false);
  }, [assocId]);

  useEffect(() => { load(); }, [load]);

  const updateVolunteerStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("volunteer_requests").update({ status }).eq("id", id);
    if (error) console.error("updateVolunteerStatus error:", error);
    load();
  };

  return { donations, volunteers, loading, updateVolunteerStatus, refresh: load };
}

// ─── HELPER: Manual profile enrichment ──────────────────────────────────────────
// Supabase can't auto-join tables without a direct FK to profiles.
// This helper fetches profile names for a set of user_ids and adds them.
async function enrichWithProfiles(rows: any[], userIdField: string): Promise<any[]> {
  if (rows.length === 0) return rows;

  const userIds = [...new Set(rows.map(r => r[userIdField]).filter(Boolean))];
  if (userIds.length === 0) return rows;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.full_name]));

  return rows.map(r => ({
    ...r,
    profiles: { full_name: profileMap.get(r[userIdField]) || "Utilisateur" }
  }));
}
