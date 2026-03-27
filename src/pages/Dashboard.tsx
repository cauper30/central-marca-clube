import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, ThumbsUp, Target, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KPI {
  openTasks: number;
  completedThisMonth: number;
  pendingApprovals: number;
  onTimePercent: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [statusData, setStatusData] = useState<{ id: string; name: string; count: number; color: string }[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [assigneeData, setAssigneeData] = useState<{ id: string; name: string; count: number }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        supabase.from("tasks").select("id, status_id, assigned_to, due_date, is_archived, created_at, updated_at").eq("is_archived", false),
        supabase.from("approvals").select("id, status").eq("status", "pendente"),
        supabase.from("events").select("*").eq("is_archived", false).gte("event_date", new Date().toISOString().split("T")[0]).order("event_date").limit(5),
        supabase.from("profiles").select("id, full_name, avatar_url"),
        supabase.from("activity_log").select("*, profiles:user_id(full_name, avatar_url)").order("created_at", { ascending: false }).limit(10),
      ]);

      const completedStatus = statuses?.find((s) => s.name.toLowerCase().includes("conclu"));

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const openTasks = tasks?.filter((t) => t.status_id !== completedStatus?.id).length || 0;
      const completedTasks = tasks?.filter((t) => t.status_id === completedStatus?.id) || [];
      const completedThisMonth = completedTasks.filter((t) => new Date(t.updated_at) >= monthStart).length;

      const tasksWithDue = completedTasks.filter((t) => t.due_date);
      const onTime = tasksWithDue.filter((t) => new Date(t.updated_at) <= new Date(t.due_date!)).length;
      const onTimePercent = tasksWithDue.length > 0 ? Math.round((onTime / tasksWithDue.length) * 100) : 100;

      setKpi({
        openTasks,
        completedThisMonth,
        pendingApprovals: approvals?.length || 0,
        onTimePercent,
      });

      if (statuses && tasks) {
        setStatusData(statuses.map((s) => ({
          id: s.id,
          name: s.name,
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
            .map(([id, count]) => ({
              id,
              name: profiles.find((p) => p.id === id)?.full_name || "Sem nome",
              count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
        );
      }

      setEvents(eventsData || []);
      setActivities(activityData || []);
      setLoading(false);
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: "Tarefas Abertas", value: kpi!.openTasks, icon: CheckSquare, color: "border-l-info", sub: "em andamento" },
    { label: "Concluídas no Mês", value: kpi!.completedThisMonth, icon: Target, color: "border-l-success", sub: "este mês" },
    { label: "Aprovações Pendentes", value: kpi!.pendingApprovals, icon: ThumbsUp, color: "border-l-warning", sub: "aguardando decisão" },
    { label: "Tarefas no Prazo", value: `${kpi!.onTimePercent}%`, icon: Clock, color: "border-l-primary", sub: "entregues dentro do prazo" },
  ];

  const maxStatusCount = Math.max(...statusData.map((d) => d.count), 1);
  const maxAssigneeCount = Math.max(...assigneeData.map((a) => a.count), 1);

  const handleStatusClick = (statusId: string) => {
    navigate(`/tarefas?status=${statusId}`);
  };

  const handleAssigneeClick = (assigneeId: string) => {
    navigate(`/tarefas?assignee=${assigneeId}`);
  };

  const actionLabels: Record<string, string> = {
    "Tarefa criada": "criou uma tarefa",
    "Solicitação criada": "criou uma solicitação",
    "Evento criado": "criou um evento",
    "Status alterado": "alterou o status",
    "Comentário adicionado": "comentou",
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className={`border-l-4 ${k.color}`}>
            <CardContent className="flex items-start gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <k.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
                <p className="text-sm font-medium text-foreground">{k.label}</p>
                <p className="text-xs text-muted-foreground">{k.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tasks by status - interactive */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusData.map((s) => (
              <button
                key={s.id}
                className="w-full space-y-1 text-left rounded-md p-1 transition-colors hover:bg-muted/50"
                onClick={() => handleStatusClick(s.id)}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{s.name}</span>
                  <span className="font-medium text-foreground">{s.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max((s.count / maxStatusCount) * 100, 4)}%`,
                      backgroundColor: s.color,
                    }}
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="mb-2 h-8 w-8" />
                <p className="text-sm">Nenhum evento próximo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate("/eventos")}
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <span className="text-xs font-medium leading-none">
                        {e.event_date ? format(new Date(e.event_date + "T12:00:00"), "dd", { locale: ptBR }) : "—"}
                      </span>
                      <span className="text-[10px] uppercase leading-none">
                        {e.event_date ? format(new Date(e.event_date + "T12:00:00"), "MMM", { locale: ptBR }) : ""}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.name}</p>
                      {e.location && <p className="truncate text-xs text-muted-foreground">{e.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by assignee - interactive */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarefas por Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assigneeData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa atribuída</p>
            ) : (
              assigneeData.map((a) => (
                <button
                  key={a.id}
                  className="w-full space-y-1 text-left rounded-md p-1 transition-colors hover:bg-muted/50"
                  onClick={() => handleAssigneeClick(a.id)}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{a.name}</span>
                    <span className="font-medium text-foreground">{a.count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(a.count / maxAssigneeCount) * 100}%` }}
                    />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity - enriched */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {a.profiles?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{a.profiles?.full_name || "Usuário"}</span>{" "}
                        <span className="text-muted-foreground">
                          {actionLabels[a.action] || a.action}
                        </span>
                        {a.details?.title && (
                          <span className="font-medium"> "{a.details.title}"</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
