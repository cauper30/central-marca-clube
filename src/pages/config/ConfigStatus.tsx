import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function ConfigStatus() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#616161");

  const { data: statuses = [] } = useQuery({
    queryKey: ["task_statuses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_statuses").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("task_statuses").insert({ name, color, sort_order: statuses.length });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_statuses"] });
      setDialogOpen(false);
      setName("");
      toast.success("Status criado");
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("task_statuses").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task_statuses"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_statuses"] });
      toast.success("Status removido");
    },
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(statuses);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // Update sort_order for each
    for (let i = 0; i < items.length; i++) {
      if (items[i].sort_order !== i) {
        await supabase.from("task_statuses").update({ sort_order: i }).eq("id", items[i].id);
      }
    }
    qc.invalidateQueries({ queryKey: ["task_statuses"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo Status
        </Button>
      </div>
      <h2 className="text-lg font-bold text-foreground">Status de Tarefas</h2>
      <Card className="p-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="statuses">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                {statuses.map((s, i) => (
                  <Draggable key={s.id} draggableId={s.id} index={i}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <div {...prov.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="h-4 w-4 rounded" style={{ backgroundColor: s.color }} />
                        <span className="flex-1 text-sm font-medium">{s.name}</span>
                        <Switch checked={s.is_active} onCheckedChange={(v) => toggle.mutate({ id: s.id, is_active: v })} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Status</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Cor</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!name.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
