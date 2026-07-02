import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedAccountProvider } from "@/contexts/SelectedAccountContext";
import { Layout } from "@/components/Layout";
import { PrivateRoute } from "@/components/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Funnel from "./pages/Funnel";
import Creatives from "./pages/Creatives";
import Campaigns from "./pages/Campaigns";
import Financial from "./pages/Financial";
import Integrations from "./pages/Integrations";
import SettingsPage from "./pages/SettingsPage";
import FunnelBuilder from "./pages/FunnelBuilder";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Wrapper com padding para páginas normais
function PaddedPages() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
      <Outlet />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SelectedAccountProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                {/* Funil personalizado: sem padding, ocupa 100% */}
                <Route path="/funil-personalizado" element={<FunnelBuilder />} />
                {/* Demais páginas: com padding */}
                <Route element={<PaddedPages />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/funil" element={<Funnel />} />
                  <Route path="/criativos" element={<Creatives />} />
                  <Route path="/campanhas" element={<Campaigns />} />
                  <Route path="/financeiro" element={<Financial />} />
                  <Route path="/integracoes" element={<Integrations />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SelectedAccountProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
