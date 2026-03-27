import { EventWithDetails } from "@/hooks/useEvents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  planejamento: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

interface Props {
  events: EventWithDetails[];
  loading: boolean;
  onEventClick: (event: EventWithDetails) => void;
}

export default function EventListView({ events, loading, onEventClick }: Props) {
  if (loading) {
    return <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tarefas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum evento cadastrado
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEventClick(event)}
              >
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>
                  {event.event_date
                    ? format(new Date(event.event_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                  {event.event_end_date && event.event_end_date !== event.event_date && (
                    <> — {format(new Date(event.event_end_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</>
                  )}
                </TableCell>
                <TableCell>{event.location || "—"}</TableCell>
                <TableCell>
                  <Badge className={`text-[11px] ${statusColors[event.status] || "bg-gray-100 text-gray-700"}`} variant="secondary">
                    {statusLabels[event.status] || event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium">{event.taskCount || 0}</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
