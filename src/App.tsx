import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import VeterinairesPage from "./pages/VeterinairesPage";
import AnimauxPage from "./pages/AnimauxPage";
import BlogPage from "./pages/BlogPage";
import DashboardVetPage from "./pages/DashboardVetPage";
import DashboardAssocPage from "./pages/DashboardAssocPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <PageTransition>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/veterinaires" element={<VeterinairesPage />} />
        <Route path="/animaux" element={<AnimauxPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/dashboard/vet" element={<DashboardVetPage />} />
        <Route path="/dashboard/association" element={<DashboardAssocPage />} />
        <Route path="/mes-rdv" element={<MyAppointmentsPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatedRoutes />
          </TooltipProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
