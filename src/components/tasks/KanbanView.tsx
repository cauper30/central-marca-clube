import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useUpdateTaskStatus, Task } from "@/hooks/useTasks";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-50 text-red-600 border-red-200",
  alta: "bg-orange-50 text-orange-600 border-orange-200",
  media: "bg-amber-50 text-amber-600 border-amber-200",
  baixa: "bg-slate-50 text-slate-500 border-slate-200",
};

const priorityBorderColors: Record<string, string> = {
  urgente: '#EF4444',
  alta: '#F97316',
  media: '#F59E0B',
  baixa: '#94A3B8',
};

interface Props {
  tasks: Task[];
  statuses: Tables<"task_statuses">[];
  loading: boolean;
  onTaskClick: (task: Task) => void;
  userId?: string;
}

export default function KanbanView({ tasks, statuses, loading, onTaskClick, userId }: Props) {
  const updateStatus = useUpdateTaskStatus();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatusId = result.destination.droppableId;
    const taskId = result.draggableId;
    if (newStatusId === result.source.droppableId) return;
    updateStatus.mutate({ taskId, statusId: newStatusId, userId });
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 shrink-0">
            <Skeleton className="mb-3 h-8 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
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
              <div
                className="mb-3 flex items-center gap-2 rounded-xl bg-card px-3 py-2.5"
                style={{ borderColor: 'rgba(226, 232, 240, 0.6)', border: '1px solid rgba(226, 232, 240, 0.6)' }}
              >
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                <span className="text-[13px] font-semibold truncate" style={{ color: '#1A1A2E' }}>{status.name}</span>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium bg-secondary text-muted-foreground shrink-0">
                  {columnTasks.length}
                </span>
              </div>
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] space-y-2.5 rounded-xl p-1.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-info/5 border-2 border-dashed border-info/30 rounded-xl" : ""
                    }`}
                  >
                    {columnTasks.map((task, index) => {
                      const isOverdue = task.due_date && task.due_date < today;
                      const priorityBorder = priorityBorderColors[task.priority] || '#94A3B8';

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onTaskClick(task)}
                              className={`cursor-pointer rounded-2xl bg-card p-3.5 transition-all duration-200 card-hover ${
                                snapshot.isDragging ? "dragging-card" : ""
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                borderLeft: `3px solid ${priorityBorder}`,
                                border: snapshot.isDragging
                                  ? `1px solid rgba(226, 232, 240, 0.6)`
                                  : `1px solid rgba(226, 232, 240, 0.6)`,
                                borderLeftWidth: '3px',
                                borderLeftColor: priorityBorder,
                                boxShadow: snapshot.isDragging
                                  ? '0 12px 24px rgba(0, 0, 0, 0.15)'
                                  : '0 1px 3px rgba(0, 0, 0, 0.04)',
                              }}
                            >
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {task.task_types && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 rounded-md"
                                    style={{ borderColor: task.task_types.color, color: task.task_types.color }}
                                  >
                                    {task.task_types.name}
                                  </Badge>
                                )}
                                <Badge
                                  className={`text-[10px] px-1.5 py-0 rounded-md border ${priorityColors[task.priority]}`}
                                  variant="secondary"
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="mb-2.5 text-[13px] font-medium leading-tight" style={{ color: '#1A1A2E' }}>
                                {task.title}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                {task.profiles ? (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Avatar className="h-5 w-5 shrink-0">
                                      <AvatarFallback className="text-[9px] bg-secondary font-medium">
                                        {task.profiles.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
                                      {task.profiles.full_name.split(" ")[0]}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">Sem responsável</span>
                                )}
                                {task.due_date && (
                                  <div
                                    className="flex items-center gap-1 text-[11px] shrink-0"
                                    style={{ color: isOverdue ? '#EF4444' : '#94A3B8' }}
                                  >
                                    <CalendarDays className="h-3 w-3" />
                                    {format(new Date(task.due_date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                        <Inbox className="h-5 w-5 mb-1.5" />
                        <p className="text-[11px]">Nenhuma tarefa</p>
                      </div>
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
