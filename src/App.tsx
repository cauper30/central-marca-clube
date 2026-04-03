import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { modules, configSubModules } from "@/lib/moduleRegistry";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

const configModule = modules.find((m) => m.id === "config");
const topLevelModules = modules.filter((m) => m.id !== "config");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {topLevelModules.map((mod) => (
                  <Route
                    key={mod.id}
                    path={mod.path}
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <mod.component />
                      </Suspense>
                    }
                  />
                ))}
                {configModule && (
                  <Route
                    path={configModule.path}
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <configModule.component />
                      </Suspense>
                    }
                  >
                    {configSubModules.map((sub) => (
                      <Route
                        key={sub.id}
                        path={sub.path}
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <sub.component />
                          </Suspense>
                        }
                      />
                    ))}
                  </Route>
                )}
              </Route>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
