import { useMemo } from "react";
import { Task } from "@/hooks/useTasks";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  tasks: Task[];
  statuses: Tables<"task_statuses">[];
}

export default function ChartsView({ tasks, statuses }: Props) {
  const byStatus = useMemo(() =>
    statuses.map((s) => ({
      name: s.name,
      value: tasks.filter((t) => t.status_id === s.id).length,
      color: s.color,
    })),
  [tasks, statuses]);

  const byPriority = useMemo(() => {
    const ps = ["urgente", "alta", "media", "baixa"];
    const colors = ["#EF4444", "#F97316", "#F59E0B", "#94A3B8"];
    return ps.map((p, i) => ({
      name: p,
      value: tasks.filter((t) => t.priority === p).length,
      color: colors[i],
    }));
  }, [tasks]);

  const byAssignee = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    tasks.forEach((t) => {
      if (t.profiles) {
        if (!map[t.profiles.id]) map[t.profiles.id] = { name: t.profiles.full_name, count: 0 };
        map[t.profiles.id].count++;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [tasks]);

  const weeklyCompleted = useMemo(() => {
    const completedStatus = statuses.find((s) => s.name.toLowerCase().includes("conclu"));
    const completed = completedStatus ? tasks.filter((t) => t.status_id === completedStatus.id) : [];
    const now = new Date();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { locale: ptBR });
      const weekEnd = endOfWeek(subWeeks(now, 7 - i), { locale: ptBR });
      return {
        label: format(weekStart, "dd/MM", { locale: ptBR }),
        count: completed.filter((t) =>
          t.updated_at && isWithinInterval(new Date(t.updated_at), { start: weekStart, end: weekEnd })
        ).length,
      };
    });
    return weeks;
  }, [tasks, statuses]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="animate-fade-in-up stagger-1">
        <CardHeader className="pb-2"><CardTitle>Tarefas por Status</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader className="pb-2"><CardTitle>Tarefas por Prioridade</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byPriority}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tarefas" radius={[6, 6, 0, 0]} animationDuration={500}>
                {byPriority.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-3">
        <CardHeader className="pb-2"><CardTitle>Tarefas por Responsável</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byAssignee} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Tarefas" fill="#3B82F6" radius={[0, 6, 6, 0]} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-4">
        <CardHeader className="pb-2"><CardTitle>Concluídas por Semana</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyCompleted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Concluídas" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
