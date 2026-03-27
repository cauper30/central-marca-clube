import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateEvent, useCreateCampaign, EventWithDetails } from "@/hooks/useEvents";
import { useProfiles } from "@/hooks/useTasks";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  type: "event" | "campaign";
  userId: string;
  events: EventWithDetails[];
}

export default function CreateEventModal({ open, onClose, type, userId, events }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [status, setStatus] = useState("planejamento");
  const [eventId, setEventId] = useState("");

  const { data: profiles = [] } = useProfiles();
  const createEvent = useCreateEvent();
  const createCampaign = useCreateCampaign();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      if (type === "event") {
        await createEvent.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          event_date: startDate || null,
          event_end_date: endDate || null,
          location: location.trim() || undefined,
          responsible_id: responsibleId || null,
          status,
          created_by: userId,
        });
        toast.success("Evento criado!");
      } else {
        await createCampaign.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
          event_id: eventId || null,
          status,
          created_by: userId,
        });
        toast.success("Campanha criada!");
      }
      resetForm();
      onClose();
    } catch {
      toast.error(`Erro ao criar ${type === "event" ? "evento" : "campanha"}`);
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setStartDate(""); setEndDate("");
    setLocation(""); setResponsibleId(""); setStatus("planejamento"); setEventId("");
  };

  const isEvent = type === "event";
  const isPending = isEvent ? createEvent.isPending : createCampaign.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEvent ? "Novo Evento" : "Nova Campanha"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isEvent ? "Nome do evento" : "Nome da campanha"} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isEvent ? "Data início" : "Data início"}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {isEvent && (
            <>
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Local do evento" />
              </div>
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select value={responsibleId} onValueChange={setResponsibleId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {!isEvent && (
            <div className="space-y-1.5">
              <Label>Evento vinculado</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
