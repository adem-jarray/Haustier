import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import Background from "@/components/Background";
import { Stethoscope, User, Shield, CheckCircle, AlertTriangle, MapPin, Phone, Mail, Globe, FileText } from "lucide-react";

type Role = "user" | "veterinaire" | "association";

const roles: { id: Role; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "user", label: "Utilisateur", desc: "Adoptez, consultez vétérinaires et articles", icon: User },
  { id: "veterinaire", label: "Vétérinaire", desc: "Gérez vos rendez-vous et votre profil pro", icon: Stethoscope },
  { id: "association", label: "Association", desc: "Publiez vos animaux et campagnes", icon: Shield },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  // ?tab=signup opens directly on registration form
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(false);

  // Pro fields
  const [specialty, setSpecialty] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [siret, setSiret] = useState("");
  const [description, setDescription] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
      else {
        // Redirect based on role stored in user metadata
        const userRole = data.user?.user_metadata?.role ?? "user";
        if (userRole === "admin") navigate("/dashboard/admin");
        else if (userRole === "veterinaire") navigate("/dashboard/vet");
        else if (userRole === "association") navigate("/dashboard/association");
        else navigate("/");
      }
    } else {
      const metadata: Record<string, string> = { full_name: fullName, role };
      if (role === "veterinaire") {
        Object.assign(metadata, { specialty, address, city, phone, license_number: licenseNumber, description, verified: "pending" });
      }
      if (role === "association") {
        Object.assign(metadata, { address, city, phone, website, siret, description, verified: "pending" });
      }

      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: metadata, emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Inscription réussie !",
          description: role !== "user"
            ? "Votre profil est maintenant visible dans la recherche Haustier !"
            : "Bienvenue sur Haustier !",
        });
        // Redirect based on selected role
        if (role === "veterinaire") navigate("/dashboard/vet");
        else if (role === "association") navigate("/dashboard/association");
        else navigate("/");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { toast({ title: "Entrez votre email", variant: "destructive" }); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else toast({ title: "Email envoyé", description: "Consultez votre boîte mail." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-12">
      <Background />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="Haustier" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold font-display text-foreground">Haustier</span>
          </a>
          <h1 className="text-3xl font-bold text-foreground">{isLogin ? "Connexion" : "Créer un compte"}</h1>
          <p className="text-muted-foreground mt-2">{isLogin ? "Connectez-vous à votre compte Haustier" : "Rejoignez la communauté Haustier"}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 card-shadow border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role picker */}
            {!isLogin && (
              <div>
                <Label className="mb-3 block font-semibold">Je suis…</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(r => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button key={r.id} type="button" onClick={() => setRole(r.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {active && <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />}
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-bold">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{roles.find(r => r.id === role)?.desc}</p>
              </div>
            )}

            {/* Verification warning for pro accounts */}
            {!isLogin && role !== "user" && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Vérification requise</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    {role === "veterinaire"
                      ? "Votre numéro d'ordre vétérinaire sera vérifié avant activation de votre profil professionnel (24-48h)."
                      : "Votre numéro SIRET sera vérifié avant activation de votre profil association (24-48h)."}
                  </p>
                </div>
              </div>
            )}

            {/* Name */}
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">{role === "veterinaire" ? "Nom complet (Dr.)" : role === "association" ? "Nom de l'association" : "Nom complet"}</Label>
                <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder={role === "veterinaire" ? "Dr. Marie Dupont" : role === "association" ? "SPA de ma ville" : "Votre nom complet"} required />
              </div>
            )}

            {/* Vet fields */}
            {!isLogin && role === "veterinaire" && (
              <>
                <div>
                  <Label><Stethoscope className="inline h-3.5 w-3.5 mr-1" />Spécialité</Label>
                  <select value={specialty} onChange={e => setSpecialty(e.target.value)} required
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary mt-1">
                    <option value="">Choisir une spécialité</option>
                    {["Médecine générale","Chirurgie","Dermatologie","Ophtalmologie","Cardiologie","Neurologie","Orthopédie","Médecine interne","Oncologie","Dentisterie vétérinaire","NAC"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label><MapPin className="inline h-3.5 w-3.5 mr-1" />Ville</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" required />
                  </div>
                  <div>
                    <Label><Phone className="inline h-3.5 w-3.5 mr-1" />Téléphone</Label>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01 23 45 67 89" required />
                  </div>
                </div>
                <div>
                  <Label><MapPin className="inline h-3.5 w-3.5 mr-1" />Adresse du cabinet</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="15 rue de la Paix, 75001 Paris" required />
                </div>
                <div>
                  <Label><FileText className="inline h-3.5 w-3.5 mr-1" />N° d'ordre vétérinaire <span className="text-destructive font-bold">*requis</span></Label>
                  <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="Ex: 75-12345" required />
                  <p className="text-xs text-muted-foreground mt-1">Votre numéro d'ordre national vétérinaire — requis pour la vérification</p>
                </div>
                <div>
                  <Label>Présentation (optionnel)</Label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez votre pratique, vos spécialités, vos équipements..." rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none mt-1" />
                </div>
              </>
            )}

            {/* Association fields */}
            {!isLogin && role === "association" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label><MapPin className="inline h-3.5 w-3.5 mr-1" />Ville</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" required />
                  </div>
                  <div>
                    <Label><Phone className="inline h-3.5 w-3.5 mr-1" />Téléphone</Label>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01 23 45 67 89" required />
                  </div>
                </div>
                <div>
                  <Label><MapPin className="inline h-3.5 w-3.5 mr-1" />Adresse</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="15 rue de la Paix, 75001 Paris" required />
                </div>
                <div>
                  <Label><Globe className="inline h-3.5 w-3.5 mr-1" />Site web (optionnel)</Label>
                  <Input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://monassociation.fr" />
                </div>
                <div>
                  <Label><FileText className="inline h-3.5 w-3.5 mr-1" />Numéro SIRET <span className="text-destructive font-bold">*requis</span></Label>
                  <Input value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00012" required />
                  <p className="text-xs text-muted-foreground mt-1">Requis pour la vérification de votre association</p>
                </div>
                <div>
                  <Label>Description de l'association</Label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez votre association, vos missions, vos actions..." rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none mt-1" required />
                </div>
              </>
            )}

            <div>
              <Label><Mail className="inline h-3.5 w-3.5 mr-1" />Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            {isLogin && (
              <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            )}

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground">
              {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <span className="text-primary font-semibold hover:underline">{isLogin ? "S'inscrire" : "Se connecter"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
