import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, ThumbsUp, Target, CalendarDays, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, subHours, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KPI {
  openTasks: number;
  completedThisMonth: number;
  pendingApprovals: number;
  onTimePercent: number;
}

interface AttentionItem {
  icon: React.ReactNode;
  text: string;
  link: string;
  type: 'overdue' | 'approval' | 'event';
}

interface DashboardEvent {
  id: string;
  name: string;
  event_date: string | null;
  status: string;
}

interface ActivityItem {
  id: string;
  action: string;
  created_at: string;
  details?: { title?: string } | null;
  profiles?: { full_name?: string | null } | null;
}

/* Animated counter hook */
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return value;
}

function KPIValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <span>{animated}{suffix}</span>;
}

const kpiIconConfigs = [
  { icon: CheckSquare, bg: '#EFF6FF', color: '#3B82F6', topBorder: '#3B82F6' },
  { icon: Target, bg: '#ECFDF5', color: '#10B981', topBorder: '#10B981' },
  { icon: ThumbsUp, bg: '#FFFBEB', color: '#F59E0B', topBorder: '#F59E0B' },
  { icon: Clock, bg: '#FEF2F2', color: '#EF4444', topBorder: '#EF4444' },
];

const attentionTypeConfig = {
  overdue: {
    bg: 'rgba(239, 68, 68, 0.05)',
    border: '#EF4444',
  },
  approval: {
    bg: 'rgba(245, 158, 11, 0.05)',
    border: '#F59E0B',
  },
  event: {
    bg: 'rgba(59, 130, 246, 0.05)',
    border: '#3B82F6',
  },
};

const eventStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planejamento: { label: 'Planejamento', color: '#1565C0', bg: '#EFF6FF' },
  confirmado: { label: 'Confirmado', color: '#2E7D32', bg: '#F0FDF4' },
  em_andamento: { label: 'Em andamento', color: '#F57F17', bg: '#FFFBEB' },
  concluido: { label: 'Concluído', color: '#4CAF50', bg: '#F0FDF4' },
  cancelado: { label: 'Cancelado', color: '#B71C1C', bg: '#FEF2F2' },
};

const avatarColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1',
];

function getAvatarColor(name: string): string {
  const code = name ? name.charCodeAt(0) % avatarColors.length : 0;
  return avatarColors[code];
}

const actionTranslations: Record<string, string> = {
  "Tarefa criada": "criou uma tarefa",
  "Solicitação criada": "criou uma solicitação",
  "Evento criado": "criou um evento",
  "Status alterado": "alterou o status",
  "Comentário adicionado": "comentou",
  "created": "criou",
  "moved": "moveu",
  "approved": "aprovou",
  "commented": "comentou",
  "updated": "atualizou",
  "deleted": "removeu",
  "archived": "arquivou",
  "rejected": "reprovou",
  "assigned": "atribuiu",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [statusData, setStatusData] = useState<{ id: string; name: string; count: number; color: string }[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [assigneeData, setAssigneeData] = useState<{ id: string; name: string; count: number }[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [totalAttention, setTotalAttention] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedStatusId, setCompletedStatusId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { data: statuses },
        { data: tasks },
        { data: approvals },
        { data: eventsData },
        { data: profiles },
        { data: activityData },
      ] = await Promise.all([
        supabase.from("task_statuses").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("tasks").select("id, title, status_id, assigned_to, due_date, is_archived, created_at, updated_at, event_id").eq("is_archived", false),
        supabase.from("approvals").select("id, status, requested_at, task_id").eq("status", "pendente"),
        supabase.from("events").select("*").eq("is_archived", false).order("event_date"),
        supabase.from("profiles").select("id, full_name, avatar_url"),
        supabase.from("activity_log").select("*, profiles:user_id(full_name, avatar_url)").order("created_at", { ascending: false }).limit(10),
      ]);

      const completedStatus = statuses?.find((s) => s.name.toLowerCase().includes("conclu"));
      setCompletedStatusId(completedStatus?.id || null);

      const now = new Date();
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const openTasks = tasks?.filter((t) => t.status_id !== completedStatus?.id).length || 0;
      const completedTasks = tasks?.filter((t) => t.status_id === completedStatus?.id) || [];
      const completedThisMonth = completedTasks.filter((t) => new Date(t.updated_at) >= monthStart).length;

      const tasksWithDue = completedTasks.filter((t) => t.due_date);
      const onTime = tasksWithDue.filter((t) => new Date(t.updated_at) <= new Date(t.due_date!)).length;
      const onTimePercent = tasksWithDue.length > 0 ? Math.round((onTime / tasksWithDue.length) * 100) : 100;

      setKpi({ openTasks, completedThisMonth, pendingApprovals: approvals?.length || 0, onTimePercent });

      // Build attention items
      const attention: AttentionItem[] = [];

      // Overdue tasks
      const overdue = tasks?.filter((t) =>
        t.due_date && t.due_date < today && t.status_id !== completedStatus?.id
      ) || [];
      overdue.forEach((t) => {
        attention.push({
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          text: `"${t.title}" está atrasada (prazo: ${format(new Date(t.due_date + "T12:00:00"), "dd/MM", { locale: ptBR })})`,
          link: `/tarefas?status=${t.status_id}`,
          type: 'overdue',
        });
      });

      // Pending approvals older than 48h
      const threshold48h = subHours(now, 48);
      approvals?.filter((a) => new Date(a.requested_at) < threshold48h).forEach((a) => {
        attention.push({
          icon: <Clock className="h-4 w-4 text-warning" />,
          text: `Aprovação pendente há mais de 48h`,
          link: `/tarefas`,
          type: 'approval',
        });
      });

      // Events in next 3 days with incomplete tasks
      const threeDaysFromNow = addDays(now, 3).toISOString().split("T")[0];
      const upcomingEvents = eventsData?.filter((e) =>
        e.event_date && e.event_date >= today && e.event_date <= threeDaysFromNow
      ) || [];
      upcomingEvents.forEach((ev) => {
        const eventTasks = tasks?.filter((t) => t.event_id === ev.id && t.status_id !== completedStatus?.id) || [];
        if (eventTasks.length > 0) {
          attention.push({
            icon: <CalendarDays className="h-4 w-4 text-info" />,
            text: `"${ev.name}" em ${format(new Date(ev.event_date + "T12:00:00"), "dd/MM", { locale: ptBR })} tem ${eventTasks.length} tarefa(s) pendente(s)`,
            link: `/eventos`,
            type: 'event',
          });
        }
      });

      setTotalAttention(attention.length);
      setAttentionItems(attention.slice(0, 5));

      if (statuses && tasks) {
        setStatusData(statuses.map((s) => ({
          id: s.id, name: s.name,
          count: tasks.filter((t) => t.status_id === s.id).length,
          color: s.color,
        })));
      }

      if (tasks && profiles) {
        const assigneeCounts: Record<string, number> = {};
        tasks.forEach((t) => {
          if (t.assigned_to) assigneeCounts[t.assigned_to] = (assigneeCounts[t.assigned_to] || 0) + 1;
        });
        setAssigneeData(
          Object.entries(assigneeCounts)
            .map(([id, count]) => ({ id, name: profiles.find((p) => p.id === id)?.full_name || "Sem nome", count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
        );
      }

      setEvents(eventsData?.filter((e) => e.event_date && e.event_date >= today).slice(0, 5) || []);
      setActivities(activityData || []);
      setLoading(false);
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: "Tarefas Abertas", value: kpi!.openTasks, sub: "em andamento", isPercent: false, onClick: () => navigate("/tarefas") },
    { label: "Concluídas no Mês", value: kpi!.completedThisMonth, sub: "este mês", isPercent: false, onClick: () => navigate(completedStatusId ? `/tarefas?status=${completedStatusId}` : "/tarefas") },
    { label: "Aprovações Pendentes", value: kpi!.pendingApprovals, sub: "aguardando decisão", isPercent: false, onClick: () => navigate("/tarefas") },
    { label: "Tarefas no Prazo", value: kpi!.onTimePercent, sub: "entregues no prazo", isPercent: true, onClick: () => navigate("/tarefas") },
  ];

  const maxStatusCount = Math.max(...statusData.map((d) => d.count), 1);
  const maxAssigneeCount = Math.max(...assigneeData.map((a) => a.count), 1);

  const translateAction = (action: string): string => {
    return actionTranslations[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k, i) => {
          const cfg = kpiIconConfigs[i];
          return (
            <Card
              key={k.label}
              className={`card-hover cursor-pointer animate-fade-in-up stagger-${i + 1} overflow-hidden`}
              style={{ padding: 0 }}
              onClick={k.onClick}
            >
              {/* Colored top accent bar */}
              <div className="h-1 w-full" style={{ background: cfg.topBorder }} />
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[13px] font-medium" style={{ color: '#64748B' }}>{k.label}</p>
                    <p className="text-[36px] font-bold leading-none" style={{ color: '#1A1A2E' }}>
                      <KPIValue value={k.value} suffix={k.isPercent ? "%" : ""} />
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: cfg.bg }}>
                    <cfg.icon className="h-5 w-5" style={{ color: cfg.color, strokeWidth: 1.8 }} />
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{k.sub}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Atenção Hoje */}
      <Card
        className="animate-fade-in-up stagger-5 overflow-hidden"
        style={{
          borderLeft: attentionItems.length > 0 ? '3px solid #F59E0B' : '3px solid #10B981',
          padding: '20px 24px',
        }}
      >
        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" style={{ color: '#10B981' }} />
            <span className="text-[13px] font-medium" style={{ color: '#10B981' }}>Tudo em dia! Nenhuma pendência crítica.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>
                Atenção Hoje
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-warning/15 text-warning text-xs px-2 py-0.5 font-bold">
                  {totalAttention}
                </span>
              </h3>
              {totalAttention > 5 && (
                <button
                  onClick={() => navigate("/tarefas")}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver todos <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {attentionItems.map((item, i) => {
                const typeCfg = attentionTypeConfig[item.type];
                return (
                  <button
                    key={i}
                    onClick={() => navigate(item.link)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:brightness-95"
                    style={{
                      background: typeCfg.bg,
                      borderLeft: `3px solid ${typeCfg.border}`,
                    }}
                  >
                    {item.icon}
                    <span className="text-[13px] truncate flex-1" style={{ color: '#334155' }}>{item.text}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tasks by status */}
        <Card className="animate-fade-in-up stagger-6">
          <CardHeader className="pb-3"><CardTitle>Tarefas por Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {statusData.map((s) => (
              <button
                key={s.id}
                className="w-full space-y-1 text-left rounded-xl p-2 transition-colors hover:bg-secondary/50"
                onClick={() => navigate(`/tarefas?status=${s.id}`)}
              >
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: '#334155' }}>{s.name}</span>
                  <span className="font-semibold" style={{ color: '#1A1A2E' }}>{s.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max((s.count / maxStatusCount) * 100, 4)}%`, backgroundColor: s.color }}
                  />
                </div>
              </button>
            ))}
            {statusData.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum status cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card className="animate-fade-in-up stagger-7">
          <CardHeader className="pb-3"><CardTitle>Próximos Eventos</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhum evento próximo</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((e) => {
                  const statusCfg = eventStatusConfig[e.status] || eventStatusConfig['planejamento'];
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer card-hover"
                      style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}
                      onClick={() => navigate("/eventos")}
                    >
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl" style={{ background: '#EFF6FF' }}>
                        <span className="text-xs font-semibold leading-none" style={{ color: '#3B82F6' }}>
                          {e.event_date ? format(new Date(e.event_date + "T12:00:00"), "dd", { locale: ptBR }) : "—"}
                        </span>
                        <span className="text-[10px] uppercase leading-none" style={{ color: '#3B82F6' }}>
                          {e.event_date ? format(new Date(e.event_date + "T12:00:00"), "MMM", { locale: ptBR }) : ""}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{e.name}</p>
                        {e.location && <p className="truncate text-xs text-muted-foreground">{e.location}</p>}
                      </div>
                      {e.status && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by assignee */}
        <Card className="animate-fade-in-up stagger-8">
          <CardHeader className="pb-3"><CardTitle>Tarefas por Responsável</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assigneeData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa atribuída</p>
            ) : (
              assigneeData.map((a) => (
                <button
                  key={a.id}
                  className="w-full space-y-1 text-left rounded-xl p-2 transition-colors hover:bg-secondary/50"
                  onClick={() => navigate(`/tarefas?assignee=${a.id}`)}
                >
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: '#334155' }}>{a.name}</span>
                    <span className="font-semibold" style={{ color: '#1A1A2E' }}>{a.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-info transition-all duration-500 ease-out" style={{ width: `${(a.count / maxAssigneeCount) * 100}%` }} />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="animate-fade-in-up stagger-8">
          <CardHeader className="pb-3"><CardTitle>Atividade Recente</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="divide-y divide-border/50">
                {activities.map((a: ActivityItem) => {
                  const name = a.profiles?.full_name || "Usuário";
                  const avatarColor = getAvatarColor(name);
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                        <AvatarFallback className="text-[10px] font-medium text-white" style={{ backgroundColor: avatarColor }}>
                          {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px]" style={{ color: '#334155' }}>
                          <span className="font-medium" style={{ color: '#1A1A2E' }}>{name}</span>{" "}
                          <span className="text-muted-foreground">{translateAction(a.action)}</span>
                          {a.details?.title && (
                            <span className="font-medium" style={{ color: '#1A1A2E' }}> "{a.details.title}"</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
