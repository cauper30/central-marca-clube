import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";

function getRedirectPath(role: string) {
  if (["superadmin", "vice_superadmin", "presidente"].includes(role)) return "/dashboard";
  return "/tarefas";
}

export default function Login() {
  const { profile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile) {
    return <Navigate to={getRedirectPath(profile.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("E-mail ou senha inválidos. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #C62828 0%, #8B0000 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full opacity-5" style={{ background: 'rgba(255,255,255,0.5)' }} />

        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          {/* Logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg border border-white/20">
            <span className="text-white font-bold text-2xl tracking-wide">CM</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Central de<br />Marketing
            </h1>
            <p className="text-white/70 text-lg font-medium">Clube Pirassununga</p>
          </div>

          <div className="w-12 h-0.5 bg-white/30 rounded-full" />

          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Gerencie tarefas e eventos de marketing em um único lugar.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12" style={{ background: '#F8F9FC' }}>
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-bold text-xl shadow-sm">
              CM
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>Central de Marketing</h1>
              <p className="text-sm text-muted-foreground">Clube Pirassununga</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8 hidden md:block">
            <h2 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium" style={{ color: '#334155' }}>
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium" style={{ color: '#334155' }}>
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-[13px] text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-[14px] font-semibold btn-hover border-0 text-white"
              style={{
                background: 'linear-gradient(135deg, #C62828 0%, #8B0000 100%)',
                boxShadow: '0 4px 14px rgba(198, 40, 40, 0.35)',
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
