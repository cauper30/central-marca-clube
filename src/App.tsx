import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PublicLinks from "@/pages/PublicLinks";
import Tarefas from "@/pages/Tarefas";
import Eventos from "@/pages/Eventos";
import Reclamacoes from "@/pages/Reclamacoes";
import Config from "@/pages/Config";
import ConfigUsuarios from "@/pages/config/ConfigUsuarios";
import ConfigTipos from "@/pages/config/ConfigTipos";
import ConfigStatus from "@/pages/config/ConfigStatus";
import ConfigCampos from "@/pages/config/ConfigCampos";
import ConfigLinktree from "@/pages/config/ConfigLinktree";
import ConfigGeral from "@/pages/config/ConfigGeral";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/links" element={<PublicLinks />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/linktree" element={<Navigate to="/config/linktree" replace />} />
              <Route path="/reclamacoes" element={<Reclamacoes />} />
              <Route path="/config" element={<Config />}>
                <Route path="usuarios" element={<ConfigUsuarios />} />
                <Route path="tipos" element={<ConfigTipos />} />
                <Route path="status" element={<ConfigStatus />} />
                <Route path="campos" element={<ConfigCampos />} />
                <Route path="linktree" element={<ConfigLinktree />} />
                <Route path="geral" element={<ConfigGeral />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
