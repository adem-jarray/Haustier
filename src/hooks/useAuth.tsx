import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "veterinaire" | "association" | "admin";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: (onDone?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: "user",
  loading: true,
  signOut: async (_onDone?: () => void) => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (onDone?: () => void) => {
    await supabase.auth.signOut();
    if (onDone) onDone();
  };

  const role: UserRole = (session?.user?.user_metadata?.role as UserRole) ?? "user";

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);