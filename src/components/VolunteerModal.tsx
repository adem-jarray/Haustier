import React, { useState, useEffect } from "react";
import { X, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AssocEntry } from "@/hooks/useDynamicData";
import { useFavorites } from "@/context/FavoritesContext";

export function VolunteerModal({ assoc, onClose }: { assoc: AssocEntry; onClose: () => void }) {
  const { user } = useAuth();
  const { addToast } = useFavorites();
  const [message, setMessage] = useState("");
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

  const handleApply = async () => {
    if (!user) {
      addToast("Veuillez vous connecter pour postuler.", "error");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.from("volunteer_requests").insert({
      user_id: user.id,
      association_id: assoc.id,
      message,
      status: "pending"
    });
    setLoading(false);

    if (error) {
      addToast("Erreur lors de la candidature. Veuillez réessayer.", "error");
    } else {
      setDone(true);
      setTimeout(() => {
        addToast(`Votre candidature a été envoyée à ${assoc.name} !`, "success");
        onClose();
      }, 2500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 relative text-center">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="h-4 w-4" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <HandHeart className="h-8 w-8 text-blue-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">Devenir bénévole</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Proposez votre aide à <span className="font-bold text-foreground">{assoc.name}</span>. Parlez-nous de vos disponibilités et de ce que vous aimeriez faire.
          </p>

          {!done ? (
            <div className="space-y-4 text-left">
              <Textarea 
                placeholder="Ex: Je suis disponible les week-ends pour promener les chiens..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
              
              <Button 
                onClick={handleApply} 
                disabled={loading || !message.trim()} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
              >
                {loading ? "Envoi..." : "Envoyer ma candidature"}
              </Button>
            </div>
          ) : (
            <div className="py-6 animate-reveal-up">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <HandHeart className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-green-700">Candidature envoyée !</h4>
              <p className="text-sm text-green-600 mt-2">L'association vous recontactera très vite.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
