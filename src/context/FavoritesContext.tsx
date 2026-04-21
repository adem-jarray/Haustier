import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ToastMsg { id: number; message: string; }

interface FavoritesContextType {
  favAnimals: string[];
  favVets:    string[];   // stored as string (covers both numeric ids and UUIDs)
  favAssocs:  string[];
  toggleAnimal: (id: string, name: string) => void;
  toggleVet:    (id: string | number, name: string) => void;
  toggleAssoc:  (id: string, name: string) => void;
  addToast: (message: string, type?: string) => void;
  toasts: ToastMsg[];
  heartPulse: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favAnimals: [], favVets: [], favAssocs: [],
  toggleAnimal: () => {}, toggleVet: () => {}, toggleAssoc: () => {},
  addToast: () => {},
  toasts: [], heartPulse: false,
});

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favAnimals, setFavAnimals] = useState<string[]>([]);
  const [favVets,    setFavVets]    = useState<string[]>([]);
  const [favAssocs,  setFavAssocs]  = useState<string[]>([]);
  const [toasts,     setToasts]     = useState<ToastMsg[]>([]);
  const [heartPulse, setHeartPulse] = useState(false);

  // Load favorites from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setFavAnimals([]); setFavVets([]); setFavAssocs([]);
      return;
    }
    supabase
      .from("favorites")
      .select("target_type, target_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        // Table may not exist yet (migration pending) — fail silently
        if (error || !data) return;
        setFavAnimals(data.filter(f => f.target_type === "animal").map(f => f.target_id));
        setFavVets(   data.filter(f => f.target_type === "vet").map(f => f.target_id));
        setFavAssocs( data.filter(f => f.target_type === "assoc").map(f => f.target_id));
      });
  }, [user]);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setHeartPulse(true);
    setTimeout(() => setHeartPulse(false), 800);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const persist = useCallback(async (type: string, targetId: string, adding: boolean) => {
    if (!user) return;
    try {
      if (adding) {
        await supabase.from("favorites").insert({ user_id: user.id, target_type: type, target_id: targetId });
      } else {
        await supabase.from("favorites").delete()
          .eq("user_id", user.id).eq("target_type", type).eq("target_id", targetId);
      }
    } catch {
      // Table not yet created — ignore silently
    }
  }, [user]);

  const toggleAnimal = useCallback((id: string, name: string) => {
    setFavAnimals(prev => {
      const adding = !prev.includes(id);
      if (adding) addToast(`${name} ajouté(e) aux favoris ❤️`);
      persist("animal", id, adding);
      return adding ? [...prev, id] : prev.filter(x => x !== id);
    });
  }, [addToast, persist]);

  const toggleVet = useCallback((id: string | number, name: string) => {
    const sid = String(id);
    setFavVets(prev => {
      const adding = !prev.includes(sid);
      if (adding) addToast(`${name} ajouté(e) aux favoris ❤️`);
      persist("vet", sid, adding);
      return adding ? [...prev, sid] : prev.filter(x => x !== sid);
    });
  }, [addToast, persist]);

  const toggleAssoc = useCallback((id: string, name: string) => {
    setFavAssocs(prev => {
      const adding = !prev.includes(id);
      if (adding) addToast(`${name} ajouté(e) aux favoris ❤️`);
      persist("assoc", id, adding);
      return adding ? [...prev, id] : prev.filter(x => x !== id);
    });
  }, [addToast, persist]);

  return (
    <FavoritesContext.Provider value={{
      favAnimals, favVets, favAssocs,
      toggleAnimal, toggleVet, toggleAssoc,
      addToast,
      toasts, heartPulse,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
