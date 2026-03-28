import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutGrid, CheckSquare, Calendar, Link as LinkIcon,
  MessageCircle, Settings, Bell, Menu, X, LogOut, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid, roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"] },
  { label: "Tarefas", path: "/tarefas", icon: CheckSquare, roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"] },
  { label: "Eventos & Campanhas", path: "/eventos", icon: Calendar, roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"] },
  { label: "Linktree", path: "/linktree", icon: LinkIcon, roles: ["superadmin", "vice_superadmin", "equipe_marketing"] },
  { label: "Reclamações", path: "/reclamacoes", icon: MessageCircle, roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente"] },
  { label: "Configurações", path: "/config", icon: Settings, roles: ["superadmin", "vice_superadmin"] },
];

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  vice_superadmin: "Vice Super Admin",
  equipe_marketing: "Equipe Marketing",
  presidente: "Presidente",
  gestor: "Gestor",
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tarefas": "Tarefas",
  "/eventos": "Eventos & Campanhas",
  "/linktree": "Linktree",
  "/reclamacoes": "Reclamações & Sugestões",
  "/config": "Configurações",
  "/config/usuarios": "Usuários",
  "/config/tipos": "Tipos de Tarefa",
  "/config/status": "Status de Tarefas",
  "/config/campos": "Campos Personalizados",
  "/config/linktree": "Linktree",
  "/config/geral": "Configurações Gerais",
};

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const visibleItems = menuItems.filter((item) =>
    profile ? item.roles.includes(profile.role) : false
  );

  useEffect(() => {
    if (!profile) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as any, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-sidebar-border sidebar-gradient transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm">
            CM
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Central de Marketing</p>
            <p className="text-xs text-muted-foreground">Clube Pirassununga</p>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          {visibleItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm sidebar-item",
                  active
                    ? "font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={active ? {
                  background: 'rgba(198, 40, 40, 0.08)',
                  color: '#C62828',
                } : undefined}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(100, 116, 139, 0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-sm bg-primary" />
                )}
                <item.icon className="h-5 w-5" style={{ strokeWidth: 1.8 }} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-[38px] w-[38px] ring-2 ring-border">
              <AvatarFallback className="bg-primary-light text-primary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{profile?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile ? roleLabels[profile.role] : ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-7 glass-header" style={{ borderColor: 'rgba(226, 232, 240, 0.5)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <h1 className="text-[22px] font-bold" style={{ color: '#1A1A2E' }}>{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary">
                  <Bell className="h-5 w-5 text-muted-foreground" style={{ strokeWidth: 1.8 }} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn("flex flex-col items-start gap-0.5 cursor-pointer rounded-lg", !n.is_read && "bg-primary-light")}
                      onClick={() => markAsRead(n.id)}
                    >
                      <span className="text-sm font-medium">{n.title}</span>
                      {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-[34px] w-[34px] transition-all hover:ring-2 hover:ring-border">
                    <AvatarFallback className="bg-primary-light text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive" onClick={signOut}>
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 md:p-7 animate-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
