import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, ThumbsUp, Target, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KPI {
  openTasks: number;
  completedThisMonth: number;
  pendingApprovals: number;
  onTimePercent: number;
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [statusData, setStatusData] = useState<{ name: string; count: number; color: string }[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [assigneeData, setAssigneeData] = useState<{ name: string; count: number }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch statuses
      const { data: statuses } = await supabase.from("task_statuses").select("*").eq("is_active", true).order("sort_order");

      // Fetch tasks (non-archived)
      const { data: tasks } = await supabase.from("tasks").select("id, status_id, assigned_to, due_date, is_archived, created_at, updated_at").eq("is_archived", false);

      // Fetch approvals
      const { data: approvals } = await supabase.from("approvals").select("id, status").eq("status", "pendente");

      // Fetch events
      const { data: eventsData } = await supabase.from("events").select("*").eq("is_archived", false).gte("event_date", new Date().toISOString().split("T")[0]).order("event_date").limit(5);

      // Fetch profiles for assignee names
      const { data: profiles } = await supabase.from("profiles").select("id, full_name");

      // Fetch activity log
      const { data: activityData } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8);

      // Find "Concluído" or similar completed status
      const completedStatus = statuses?.find((s) => s.name.toLowerCase().includes("conclu"));

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const openTasks = tasks?.filter((t) => t.status_id !== completedStatus?.id).length || 0;
      const completedTasks = tasks?.filter((t) => t.status_id === completedStatus?.id) || [];
      const completedThisMonth = completedTasks.filter((t) => new Date(t.updated_at) >= monthStart).length;

      // On time %
      const tasksWithDue = completedTasks.filter((t) => t.due_date);
      const onTime = tasksWithDue.filter((t) => new Date(t.updated_at) <= new Date(t.due_date!)).length;
      const onTimePercent = tasksWithDue.length > 0 ? Math.round((onTime / tasksWithDue.length) * 100) : 100;

      setKpi({
        openTasks,
        completedThisMonth,
        pendingApprovals: approvals?.length || 0,
        onTimePercent,
      });

      // Status chart data
      if (statuses && tasks) {
        const statusCounts = statuses.map((s) => ({
          name: s.name,
          count: tasks.filter((t) => t.status_id === s.id).length,
          color: s.color,
        }));
        setStatusData(statusCounts);
      }

      // Assignee data
      if (tasks && profiles) {
        const assigneeCounts: Record<string, number> = {};
        tasks.forEach((t) => {
          if (t.assigned_to) {
            assigneeCounts[t.assigned_to] = (assigneeCounts[t.assigned_to] || 0) + 1;
          }
        });
        const mapped = Object.entries(assigneeCounts)
          .map(([id, count]) => ({
            name: profiles.find((p) => p.id === id)?.full_name || "Sem nome",
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setAssigneeData(mapped);
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

  const maxAssigneeCount = Math.max(...assigneeData.map((a) => a.count), 1);

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
        {/* Tasks by status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusData.map((s) => (
              <div key={s.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{s.name}</span>
                  <span className="font-medium text-foreground">{s.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max((s.count / Math.max(...statusData.map((d) => d.count), 1)) * 100, 4)}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
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
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-light text-primary">
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

        {/* Tasks by assignee */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarefas por Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assigneeData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa atribuída</p>
            ) : (
              assigneeData.map((a) => (
                <div key={a.name} className="space-y-1">
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
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        {a.action} <span className="text-muted-foreground">({a.entity_type})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
