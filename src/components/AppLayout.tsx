import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getMenuItems, getPageTitle } from "@/lib/moduleRegistry";
import type { UserRole } from "@/lib/moduleRegistry";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  vice_superadmin: "Vice Super Admin",
  equipe_marketing: "Equipe Marketing",
  presidente: "Presidente",
  gestor: "Gestor",
};

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const visibleItems = profile ? getMenuItems(profile.role as UserRole) : [];

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

  const markAllAsRead = async () => {
    if (!profile || unreadCount === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const pageTitle = getPageTitle(location.pathname);

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
        <nav className="flex-1 px-3 py-5">
          <p className="nav-section-label mb-2">Menu</p>
          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm sidebar-item",
                    active
                      ? "font-semibold ring-1 ring-primary/15"
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
                  <item.icon className="h-4.5 w-4.5 shrink-0" style={{ strokeWidth: 1.8, height: '18px', width: '18px' }} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-[38px] w-[38px] ring-2 ring-border shrink-0">
              <AvatarFallback className="bg-primary-light text-primary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{profile?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile ? roleLabels[profile.role] : ""}</p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
                    <span className={cn(
                      "absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white leading-none pulse-dot"
                    )}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                {/* Notifications header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="text-sm font-semibold text-foreground">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={cn(
                          "flex flex-col items-start gap-0.5 cursor-pointer rounded-none px-4 py-3 border-b last:border-0",
                          !n.is_read && "bg-primary/5"
                        )}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex w-full items-center gap-2">
                          {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          <span className="text-sm font-medium flex-1">{n.title}</span>
                        </div>
                        {n.message && <span className="text-xs text-muted-foreground pl-3.5">{n.message}</span>}
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
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
