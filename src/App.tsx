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
import PlaceholderPage from "@/pages/PlaceholderPage";
import Tarefas from "@/pages/Tarefas";
import Eventos from "@/pages/Eventos";
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
              <Route path="/linktree" element={<PlaceholderPage title="Gerenciar Linktree" phase="Em construção" />} />
              <Route path="/reclamacoes" element={<PlaceholderPage title="Reclamações" phase="Em construção" />} />
              <Route path="/config" element={<PlaceholderPage title="Configurações" phase="Em construção" />} />
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
