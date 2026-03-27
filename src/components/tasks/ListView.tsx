import { useState } from "react";
import { Task } from "@/hooks/useTasks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  media: "bg-blue-100 text-blue-800",
  baixa: "bg-gray-100 text-gray-600",
};

type SortKey = "title" | "priority" | "due_date" | "status" | "assignee" | "type";

const priorityOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };

interface Props {
  tasks: Task[];
  loading: boolean;
  onTaskClick: (task: Task) => void;
}

export default function ListView({ tasks, loading, onTaskClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "title": cmp = a.title.localeCompare(b.title); break;
      case "priority": cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9); break;
      case "due_date": cmp = (a.due_date || "9999").localeCompare(b.due_date || "9999"); break;
      case "status": cmp = (a.task_statuses?.name || "").localeCompare(b.task_statuses?.name || ""); break;
      case "assignee": cmp = (a.profiles?.full_name || "zzz").localeCompare(b.profiles?.full_name || "zzz"); break;
      case "type": cmp = (a.task_types?.name || "zzz").localeCompare(b.task_types?.name || "zzz"); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  if (loading) {
    return <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Tarefa" field="title" />
            <SortHeader label="Tipo" field="type" />
            <SortHeader label="Status" field="status" />
            <SortHeader label="Prioridade" field="priority" />
            <SortHeader label="Responsável" field="assignee" />
            <SortHeader label="Prazo" field="due_date" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskClick(task)}
              >
                <TableCell className="font-medium max-w-[300px] truncate">{task.title}</TableCell>
                <TableCell>
                  {task.task_types && (
                    <Badge variant="outline" className="text-[11px]" style={{ borderColor: task.task_types.color, color: task.task_types.color }}>
                      {task.task_types.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {task.task_statuses && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.task_statuses.color }} />
                      <span className="text-sm">{task.task_statuses.name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[11px] ${priorityColors[task.priority]}`} variant="secondary">
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.profiles ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {task.profiles.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.profiles.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date
                    ? format(new Date(task.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
