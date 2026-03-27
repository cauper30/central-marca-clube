import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateTask, useTaskStatuses, useTaskTypes, useProfiles, useTags, useEvents, useCampaigns } from "@/hooks/useTasks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  isGestor: boolean;
  userId: string;
  userArea: string | null;
}

export default function CreateTaskModal({ open, onClose, isGestor, userId, userArea }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [priority, setPriority] = useState("media");
  const [assignee, setAssignee] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: statuses = [] } = useTaskStatuses();
  const { data: types = [] } = useTaskTypes();
  const { data: profiles = [] } = useProfiles();
  const { data: tags = [] } = useTags();
  const { data: events = [] } = useEvents();
  const { data: campaigns = [] } = useCampaigns();
  const createTask = useCreateTask();

  const defaultStatusId = statuses.length > 0 ? statuses[0].id : "";

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!defaultStatusId) {
      toast.error("Nenhum status cadastrado");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        type_id: typeId || null,
        priority: priority as "urgente" | "alta" | "media" | "baixa",
        assigned_to: assignee || null,
        due_date: dueDate || null,
        event_id: eventId || null,
        campaign_id: campaignId || null,
        status_id: defaultStatusId,
        created_by: userId,
        is_demand: isGestor,
        demand_area: isGestor ? userArea : null,
        tag_ids: selectedTags,
      });
      toast.success(isGestor ? "Solicitação criada!" : "Tarefa criada!");
      resetForm();
      onClose();
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setTypeId(""); setPriority("media");
    setAssignee(""); setDueDate(""); setEventId(""); setCampaignId("");
    setSelectedTags([]);
  };

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isGestor ? "Nova Solicitação" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da tarefa" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalhes..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isGestor && (
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Prazo</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Evento</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge
                    key={t.id}
                    variant={selectedTags.includes(t.id) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    style={selectedTags.includes(t.id) ? { backgroundColor: t.color } : { borderColor: t.color, color: t.color }}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createTask.isPending}>
              {createTask.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
