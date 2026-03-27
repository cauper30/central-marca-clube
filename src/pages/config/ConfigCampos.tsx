import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type FieldType = Database["public"]["Enums"]["custom_field_type"];

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Texto",
  number: "Número",
  date: "Data",
  dropdown: "Lista suspensa",
};

export default function ConfigCampos() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [isRequired, setIsRequired] = useState(false);

  const { data: fields = [] } = useQuery({
    queryKey: ["custom_fields"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_fields").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("custom_fields").insert({
        name,
        field_type: fieldType,
        is_required: isRequired,
        sort_order: fields.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_fields"] });
      setDialogOpen(false);
      setName("");
      toast.success("Campo criado");
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("custom_fields").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_fields"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_fields"] });
      toast.success("Campo removido");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo Campo
        </Button>
      </div>
      <h2 className="text-lg font-bold text-foreground">Campos Personalizados</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{fieldTypeLabels[f.field_type]}</TableCell>
                <TableCell>{f.is_required ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  <Switch checked={f.is_active} onCheckedChange={(v) => toggle.mutate({ id: f.id, is_active: v })} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Campo Personalizado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(fieldTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <Label>Obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!name.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
