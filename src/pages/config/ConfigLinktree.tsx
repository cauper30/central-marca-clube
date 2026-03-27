import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function ConfigLinktree() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data: links = [] } = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("links").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("links").insert({ title, url, sort_order: links.length });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      setDialogOpen(false);
      setTitle("");
      setUrl("");
      toast.success("Link criado");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("links").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link removido");
    },
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(links);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    for (let i = 0; i < items.length; i++) {
      if (items[i].sort_order !== i) {
        await supabase.from("links").update({ sort_order: i }).eq("id", items[i].id);
      }
    }
    qc.invalidateQueries({ queryKey: ["links"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo Link
        </Button>
      </div>
      <h2 className="text-lg font-bold text-foreground">Linktree — Gerenciar Links</h2>
      <Card className="p-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="links">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                {links.map((link, i) => (
                  <Draggable key={link.id} draggableId={link.id} index={i}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <div {...prov.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{link.click_count} cliques</span>
                        <Switch checked={link.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: link.id, is_active: v })} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove.mutate(link.id)}>
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
          <DialogHeader><DialogTitle>Novo Link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!title.trim() || !url.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
