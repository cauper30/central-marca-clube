import { TaskFilter } from "@/pages/Tarefas";
import { useTaskStatuses, useTaskTypes, useProfiles, useTags } from "@/hooks/useTasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  filters: TaskFilter;
  onChange: (f: TaskFilter) => void;
  onClear: () => void;
}

const priorities = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export default function TaskFilters({ filters, onChange, onClear }: Props) {
  const { data: statuses = [] } = useTaskStatuses();
  const { data: types = [] } = useTaskTypes();
  const { data: profiles = [] } = useProfiles();
  const { data: tags = [] } = useTags();

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Filtros</span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-3 w-3" /> Limpar
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <div className="flex flex-wrap gap-1">
            {statuses.map((s) => (
              <Badge
                key={s.id}
                variant={filters.statusIds.includes(s.id) ? "default" : "outline"}
                className="cursor-pointer text-[11px]"
                onClick={() => onChange({ ...filters, statusIds: toggleArr(filters.statusIds, s.id) })}
              >
                {s.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Prioridade</label>
          <div className="flex flex-wrap gap-1">
            {priorities.map((p) => (
              <Badge
                key={p.value}
                variant={filters.priorities.includes(p.value) ? "default" : "outline"}
                className="cursor-pointer text-[11px]"
                onClick={() => onChange({ ...filters, priorities: toggleArr(filters.priorities, p.value) })}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <Badge
                key={t.id}
                variant={filters.typeIds.includes(t.id) ? "default" : "outline"}
                className="cursor-pointer text-[11px]"
                onClick={() => onChange({ ...filters, typeIds: toggleArr(filters.typeIds, t.id) })}
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground">Responsável</label>
          <Select
            value={filters.assigneeIds[0] || "all"}
            onValueChange={(v) => onChange({ ...filters, assigneeIds: v === "all" ? [] : [v] })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Prazo de</label>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={filters.dateFrom || ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">até</label>
          <Input
            type="date"
            className="h-8 text-xs w-36"
            value={filters.dateTo || ""}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tags</label>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge
                  key={t.id}
                  variant={filters.tagIds.includes(t.id) ? "default" : "outline"}
                  className="cursor-pointer text-[11px]"
                  style={filters.tagIds.includes(t.id) ? { backgroundColor: t.color } : { borderColor: t.color, color: t.color }}
                  onClick={() => onChange({ ...filters, tagIds: toggleArr(filters.tagIds, t.id) })}
                >
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
