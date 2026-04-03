import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, User, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventWithDetails, useEventTasks } from "@/hooks/useEvents";
import { useCreateTask, useTaskStatuses } from "@/hooks/useTasks";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

interface Props {
  event: EventWithDetails | null;
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function EventDrawer({ event, open, onClose, userId }: Props) {
  const { data: tasks = [] } = useEventTasks(event?.id || null);
  const { data: statuses = [] } = useTaskStatuses();
  const createTask = useCreateTask();
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (!event) return null;

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !statuses.length) return;
    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        status_id: statuses[0].id,
        created_by: userId,
        event_id: event.id,
      });
      toast.success("Tarefa criada para o evento!");
      setNewTaskTitle("");
      setCreatingTask(false);
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] max-w-full p-0 sm:max-w-[420px]">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-5">
            <SheetHeader>
              <SheetTitle className="text-lg leading-tight pr-6">{event.name}</SheetTitle>
            </SheetHeader>

            <Badge className="bg-blue-100 text-blue-800" variant="secondary">
              {statusLabels[event.status] || event.status}
            </Badge>

            {event.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            )}

            <Separator />

            {/* Details */}
            <div className="space-y-3">
              {event.event_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.event_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    {event.event_end_date && event.event_end_date !== event.event_date && (
                      <> — {format(new Date(event.event_end_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</>
                    )}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.profiles && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{event.profiles.full_name}</span>
                </div>
              )}
            </div>

            {/* Linked tasks */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Tarefas Vinculadas ({tasks.length})</h4>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCreatingTask(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Nova Tarefa
                </Button>
              </div>

              {creatingTask && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border border-input px-2 py-1 text-sm"
                    placeholder="Título da tarefa"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={handleCreateTask} disabled={createTask.isPending}>
                    Criar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setCreatingTask(false)}>
                    ✕
                  </Button>
                </div>
              )}

              {tasks.length === 0 && !creatingTask ? (
                <p className="text-xs text-muted-foreground">Nenhuma tarefa vinculada</p>
              ) : (
                tasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded border border-border p-2">
                    <span className="text-sm">{t.title}</span>
                    {t.task_statuses && (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.task_statuses.color }} />
                        <span className="text-xs text-muted-foreground">{t.task_statuses.name}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
