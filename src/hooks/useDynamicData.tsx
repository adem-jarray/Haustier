/**
 * useDynamicData — fetches vets, associations and animals from Supabase
 * and merges with static seed data from siteData.ts
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { vets as staticVets, associations as staticAssociations, animals as staticAnimals } from "@/data/siteData";

export type VetEntry = typeof staticVets[0] & { dbId?: string; userId?: string };
export type AssocEntry = typeof staticAssociations[0] & { dbId?: string; userId?: string };
export type AnimalEntry = typeof staticAnimals[0];

export function useDynamicData() {
  const [dynamicVets, setDynamicVets]     = useState<VetEntry[]>([]);
  const [dynamicAssocs, setDynamicAssocs] = useState<AssocEntry[]>([]);
  const [dynamicAnimals, setDynamicAnimals] = useState<AnimalEntry[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const staticVetIds   = new Set(staticVets.map(v => String(v.id)));
        const staticAssocIds = new Set(staticAssociations.map(a => a.id));

        // ── Vets from DB ──────────────────────────────────────────────────
        const { data: dbVets } = await supabase
          .from("veterinarians")
          .select("id, user_id, name, specialty, city, phone, address, description, working_hours, rating, review_count, latitude, longitude")
          .order("created_at", { ascending: false });

        const newVets: VetEntry[] = (dbVets ?? [])
          .filter(v => !staticVetIds.has(v.name)) // don't duplicate static names
          .map(v => ({
            id: v.id,           // UUID used as key
            dbId: v.id,
            userId: v.user_id,
            name: v.name || "Vétérinaire",
            specialty: v.specialty || "Médecine générale",
            location: v.city || "",
            rating: v.rating ?? 5.0,
            reviews: v.review_count ?? 0,
            phone: v.phone || "",
            hours: v.working_hours || "Sur rendez-vous",
            address: v.address || v.city || "",
            lat: v.latitude ?? undefined,
            lng: v.longitude ?? undefined,
          }));

        // ── Associations from DB ──────────────────────────────────────────
        const { data: dbAssocs } = await supabase
          .from("associations")
          .select("id, user_id, name, city, phone, email, website, description, image_url")
          .order("created_at", { ascending: false });

        const newAssocs: AssocEntry[] = (dbAssocs ?? [])
          .filter(a => !staticAssocIds.has(a.id))
          .map(a => ({
            id: a.id,
            dbId: a.id,
            userId: a.user_id,
            name: a.name || "Association",
            city: a.city || "",
            animals: 0,
            campaigns: 0,
            phone: a.phone || "",
            email: a.email || "",
            website: a.website || "",
            founded: new Date().getFullYear(),
            cover: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
            logo: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=200&q=80",
            description: a.description || "",
            campaigns_list: [],
            animalIds: [],
          }));

        // ── Animals from DB ───────────────────────────────────────────────
        const { data: dbAnimals } = await supabase
          .from("animals")
          .select("id, name, species, breed, age_months, gender, description, image_url, status, is_vaccinated, is_sterilized, association_id")
          .eq("status", "available")
          .order("created_at", { ascending: false });

        const SPECIES_LABEL: Record<string, string> = {
          dog: "Chien", cat: "Chat", rabbit: "Lapin", bird: "Oiseau", other: "Animal"
        };

        const newAnimals: AnimalEntry[] = (dbAnimals ?? []).map(a => ({
          id: a.id,
          name: a.name,
          type: SPECIES_LABEL[a.species] ?? "Animal",
          breed: a.breed || "",
          age: a.age_months ? `${a.age_months} mois` : "Inconnu",
          gender: a.gender || "Inconnu",
          location: "",
          associationId: a.association_id,
          image: a.image_url || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&q=80",
          description: a.description || "",
          vaccinated: a.is_vaccinated ?? false,
          sterilized: a.is_sterilized ?? false,
          chipped: false,
        }));

        setDynamicVets(newVets);
        setDynamicAssocs(newAssocs);
        setDynamicAnimals(newAnimals);
      } catch (e) {
        console.error("useDynamicData error:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    allVets:    [...staticVets, ...dynamicVets],
    allAssocs:  [...staticAssociations, ...dynamicAssocs],
    allAnimals: [...staticAnimals, ...dynamicAnimals],
    loading,
  };
}
