import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, ThumbsUp, AlertTriangle, Inbox, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];
type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];
type FeedbackType = Database["public"]["Enums"]["feedback_type"];

const typeLabels: Record<FeedbackType, string> = {
  reclamacao: "Reclamação",
  sugestao: "Sugestão",
  elogio: "Elogio",
};

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  reclamacao: <AlertTriangle className="h-4 w-4" />,
  sugestao: <MessageCircle className="h-4 w-4" />,
  elogio: <ThumbsUp className="h-4 w-4" />,
};

const typeColors: Record<FeedbackType, string> = {
  reclamacao: "bg-destructive/10 text-destructive",
  sugestao: "bg-info/10 text-info",
  elogio: "bg-success/10 text-success",
};

const statusLabels: Record<FeedbackStatus, string> = {
  novo: "Novo",
  lido: "Lido",
  arquivado: "Arquivado",
};

const statusColors: Record<FeedbackStatus, string> = {
  novo: "bg-warning/10 text-warning border-warning/30",
  lido: "bg-info/10 text-info border-info/30",
  arquivado: "bg-muted text-muted-foreground border-border",
};

export default function Reclamacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeedbackRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const updates: any = { status };
      if (status === "lido") {
        updates.read_at = new Date().toISOString();
        updates.read_by = user?.id;
      }
      const { error } = await supabase.from("feedback").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Status atualizado");
    },
  });

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      return true;
    });
  }, [feedbacks, filterType, filterStatus]);

  const counts = useMemo(() => ({
    total: feedbacks.length,
    reclamacao: feedbacks.filter((f) => f.type === "reclamacao").length,
    sugestao: feedbacks.filter((f) => f.type === "sugestao").length,
    elogio: feedbacks.filter((f) => f.type === "elogio").length,
  }), [feedbacks]);

  const kpis = [
    { label: "Total", value: counts.total, icon: Inbox, color: "border-l-primary" },
    { label: "Reclamações", value: counts.reclamacao, icon: AlertTriangle, color: "border-l-destructive" },
    { label: "Sugestões", value: counts.sugestao, icon: MessageCircle, color: "border-l-info" },
    { label: "Elogios", value: counts.elogio, icon: ThumbsUp, color: "border-l-success" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`border-l-4 ${kpi.color} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>
              <kpi.icon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-1.5 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {showFilters && (
        <Card className="flex flex-wrap items-center gap-4 p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reclamacao">Reclamação</SelectItem>
                <SelectItem value="sugestao">Sugestão</SelectItem>
                <SelectItem value="elogio">Elogio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="lido">Lido</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFilterType("all"); setFilterStatus("all"); }}>
            Limpar
          </Button>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Mensagem</TableHead>
              <TableHead className="hidden md:table-cell">Área</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum feedback encontrado</TableCell></TableRow>
            ) : (
              filtered.map((f) => {
                const expanded = expandedId === f.id;
                return (
                  <>
                    <TableRow
                      key={f.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : f.id)}
                    >
                      <TableCell>
                        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColors[f.type]}>
                          {typeIcons[f.type]}
                          <span className="ml-1">{typeLabels[f.type]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{f.message}</TableCell>
                      <TableCell className="hidden md:table-cell">{f.area || "—"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(f.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Select
                          value={f.status}
                          onValueChange={(v) => {
                            updateStatus.mutate({ id: f.id, status: v as FeedbackStatus });
                          }}
                        >
                          <SelectTrigger className={`w-28 h-7 text-xs ${statusColors[f.status]}`} onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="lido">Lido</SelectItem>
                            <SelectItem value="arquivado">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow key={`${f.id}-expanded`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-2 text-sm">
                            <p className="whitespace-pre-wrap">{f.message}</p>
                            <div className="flex flex-wrap gap-4 text-muted-foreground">
                              {f.name && <span><strong>Nome:</strong> {f.name}</span>}
                              {f.email && <span><strong>Email:</strong> {f.email}</span>}
                              {f.area && <span><strong>Área:</strong> {f.area}</span>}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
