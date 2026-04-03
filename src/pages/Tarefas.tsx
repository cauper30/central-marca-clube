import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useTaskStatuses } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List, BarChart3, Plus, Filter, Archive } from "lucide-react";
import KanbanView from "@/components/tasks/KanbanView";
import ListView from "@/components/tasks/ListView";
import ChartsView from "@/components/tasks/ChartsView";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import TaskFilters from "@/components/tasks/TaskFilters";
import { Task } from "@/hooks/useTasks";

export type ViewMode = "kanban" | "lista" | "graficos";

export interface TaskFilter {
  statusIds: string[];
  typeIds: string[];
  priorities: string[];
  assigneeIds: string[];
  tagIds: string[];
  dateFrom?: string;
  dateTo?: string;
}

const emptyFilter: TaskFilter = {
  statusIds: [],
  typeIds: [],
  priorities: [],
  assigneeIds: [],
  tagIds: [],
};

export default function Tarefas() {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const isGestor = profile?.role === "gestor";
  const defaultView: ViewMode = isGestor ? "lista" : "kanban";

  const [view, setView] = useState<ViewMode>(defaultView);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilter>(() => {
    const statusParam = searchParams.get("status");
    const assigneeParam = searchParams.get("assignee");
    return {
      ...emptyFilter,
      statusIds: statusParam ? [statusParam] : [],
      assigneeIds: assigneeParam ? [assigneeParam] : [],
    };
  });

  useEffect(() => {
    if (searchParams.get("status") || searchParams.get("assignee")) setShowFilters(true);
  }, [searchParams]);

  const { data: tasks = [], isLoading } = useTasks(showArchived);
  const { data: statuses = [] } = useTaskStatuses();

  const filteredTasks = tasks.filter((t) => {
    if (filters.statusIds.length && !filters.statusIds.includes(t.status_id)) return false;
    if (filters.typeIds.length && t.type_id && !filters.typeIds.includes(t.type_id)) return false;
    if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
    if (filters.assigneeIds.length && t.assigned_to && !filters.assigneeIds.includes(t.assigned_to)) return false;
    if (filters.tagIds.length) {
      const taskTagIds = t.task_tags?.map((tt) => tt.tag_id) || [];
      if (!filters.tagIds.some((id) => taskTagIds.includes(id))) return false;
    }
    if (filters.dateFrom && t.due_date && t.due_date < filters.dateFrom) return false;
    if (filters.dateTo && t.due_date && t.due_date > filters.dateTo) return false;
    return true;
  });

  const openDrawer = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as ViewMode)}
          className="rounded-full border border-border bg-card p-1"
        >
          <ToggleGroupItem value="kanban" className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="lista" className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <List className="mr-1.5 h-4 w-4" />
            Lista
          </ToggleGroupItem>
          <ToggleGroupItem value="graficos" className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Gráficos
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-1.5 h-4 w-4" />
            {showArchived ? "Ver Ativas" : "Ver Arquivo"}
          </Button>
          <Button
            variant={hasActiveFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1.5 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {Object.values(filters).flat().filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {isGestor ? "Nova Solicitação" : "Nova Tarefa"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(emptyFilter)}
        />
      )}

      {/* Views */}
      {view === "kanban" && (
        <KanbanView
          tasks={filteredTasks}
          statuses={statuses}
          loading={isLoading}
          onTaskClick={openDrawer}
          userId={user?.id}
        />
      )}
      {view === "lista" && (
        <ListView
          tasks={filteredTasks}
          loading={isLoading}
          onTaskClick={openDrawer}
        />
      )}
      {view === "graficos" && (
        <ChartsView tasks={filteredTasks} statuses={statuses} />
      )}

      {/* Drawer */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Create modal */}
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        isGestor={isGestor}
        userId={user?.id || ""}
        userArea={profile?.area || null}
      />
    </div>
  );
}
