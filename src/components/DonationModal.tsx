import React, { useState, useEffect } from "react";
import { X, Heart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AssocEntry } from "@/hooks/useDynamicData";
import { useFavorites } from "@/context/FavoritesContext";

export function DonationModal({ assoc, onClose }: { assoc: AssocEntry; onClose: () => void }) {
  const { user } = useAuth();
  const { addToast } = useFavorites();
  const [amount, setAmount] = useState("20");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleDonate = async () => {
    if (!user) {
      addToast("Veuillez vous connecter pour faire un don.", "error");
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    setLoading(true);
    const { error } = await supabase.from("donations").insert({
      user_id: user.id,
      association_id: assoc.id,
      amount: val,
      status: "completed"
    });
    setLoading(false);

    if (error) {
      addToast("Erreur lors du don. Veuillez réessayer.", "error");
    } else {
      setDone(true);
      setTimeout(() => {
        addToast(`Merci pour votre don de ${val}€ à ${assoc.name} !`, "success");
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 relative text-center">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="h-4 w-4" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">Faire un don</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Soutenez les actions de <span className="font-bold text-foreground">{assoc.name}</span>. Votre don permet de sauver des vies.
          </p>

          {!done ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {["10", "20", "50"].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl border font-bold transition-colors ${
                      amount === val ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-border text-foreground hover:border-rose-300"
                    }`}
                  >
                    {val}€
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">€</span>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="pl-8 font-bold text-lg" 
                  placeholder="Montant libre"
                />
              </div>
              
              <Button 
                onClick={handleDonate} 
                disabled={loading || !amount || parseFloat(amount) <= 0} 
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-12 text-lg shadow-lg shadow-rose-200"
              >
                {loading ? "Traitement..." : "Valider mon don"}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
                <CreditCard className="h-3.5 w-3.5" /> Paiement sécurisé (Simulation)
              </p>
            </div>
          ) : (
            <div className="py-6 animate-reveal-up">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600 fill-green-600" />
              </div>
              <h4 className="text-xl font-bold text-green-700">Merci de tout cœur !</h4>
              <p className="text-sm text-green-600 mt-2">Votre don a bien été enregistré.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
