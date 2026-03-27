import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUpdateTaskStatus, Task } from "@/hooks/useTasks";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  media: "bg-blue-100 text-blue-800",
  baixa: "bg-gray-100 text-gray-600",
};

interface Props {
  tasks: Task[];
  statuses: Tables<"task_statuses">[];
  loading: boolean;
  onTaskClick: (task: Task) => void;
}

export default function KanbanView({ tasks, statuses, loading, onTaskClick }: Props) {
  const updateStatus = useUpdateTaskStatus();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatusId = result.destination.droppableId;
    const taskId = result.draggableId;
    if (newStatusId === result.source.droppableId) return;
    updateStatus.mutate({ taskId, statusId: newStatusId });
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 shrink-0">
            <Skeleton className="mb-3 h-8 rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.status_id === status.id);
          return (
            <div key={status.id} className="w-72 shrink-0">
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-sm font-semibold text-foreground">{status.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{columnTasks.length}</span>
              </div>
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] space-y-2 rounded-lg p-1.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-accent/50" : ""
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskClick(task)}
                            className={`cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {task.task_types && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ borderColor: task.task_types.color, color: task.task_types.color }}
                                >
                                  {task.task_types.name}
                                </Badge>
                              )}
                              <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`} variant="secondary">
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="mb-2 text-sm font-medium text-foreground leading-tight">{task.title}</p>
                            <div className="flex items-center justify-between">
                              {task.profiles ? (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px] bg-muted">
                                      {task.profiles.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {task.profiles.full_name.split(" ")[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Sem responsável</span>
                              )}
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarDays className="h-3 w-3" />
                                  {format(new Date(task.due_date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="py-8 text-center text-xs text-muted-foreground">Nenhuma tarefa</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
