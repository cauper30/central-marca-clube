import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, ThumbsUp, AlertTriangle, Inbox, ChevronDown, ChevronUp, Search, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  reclamacao: <AlertTriangle className="h-3.5 w-3.5" />,
  sugestao: <MessageCircle className="h-3.5 w-3.5" />,
  elogio: <ThumbsUp className="h-3.5 w-3.5" />,
};

const typeColors: Record<FeedbackType, string> = {
  reclamacao: "bg-destructive/10 text-destructive border-destructive/20",
  sugestao: "bg-info/10 text-info border-info/20",
  elogio: "bg-success/10 text-success border-success/20",
};

const typeAccentColors: Record<FeedbackType, string> = {
  reclamacao: '#EF4444',
  sugestao: '#3B82F6',
  elogio: '#10B981',
};

const typeAccentBg: Record<FeedbackType, string> = {
  reclamacao: 'rgba(239, 68, 68, 0.05)',
  sugestao: 'rgba(59, 130, 246, 0.05)',
  elogio: 'rgba(16, 185, 129, 0.05)',
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

const typeFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "Todos os tipos" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "sugestao", label: "Sugestão" },
  { value: "elogio", label: "Elogio" },
];

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "novo", label: "Novo" },
  { value: "lido", label: "Lido" },
  { value: "arquivado", label: "Arquivado" },
];

export default function Reclamacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

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
    const q = search.trim().toLowerCase();
    return feedbacks.filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (q) {
        const haystack = [f.message, f.name, f.email, f.area].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [feedbacks, filterType, filterStatus, search]);

  const counts = useMemo(() => ({
    total: feedbacks.length,
    reclamacao: feedbacks.filter((f) => f.type === "reclamacao").length,
    sugestao: feedbacks.filter((f) => f.type === "sugestao").length,
    elogio: feedbacks.filter((f) => f.type === "elogio").length,
  }), [feedbacks]);

  const kpis = [
    { label: "Total", value: counts.total, icon: Inbox, color: "border-l-primary", iconColor: "#C62828", iconBg: "#FEF2F2" },
    { label: "Reclamações", value: counts.reclamacao, icon: AlertTriangle, color: "border-l-destructive", iconColor: "#EF4444", iconBg: "#FEF2F2" },
    { label: "Sugestões", value: counts.sugestao, icon: MessageCircle, color: "border-l-info", iconColor: "#3B82F6", iconBg: "#EFF6FF" },
    { label: "Elogios", value: counts.elogio, icon: ThumbsUp, color: "border-l-success", iconColor: "#10B981", iconBg: "#ECFDF5" },
  ];

  const activeFiltersCount = (filterType !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={`border-l-4 ${kpi.color} animate-fade-in-up`}
            style={{ padding: '16px 20px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: kpi.iconBg }}>
                <kpi.icon className="h-5 w-5" style={{ color: kpi.iconColor, strokeWidth: 1.8 }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mensagem, nome, e-mail ou área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {typeFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                filterType === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
          <div className="h-4 w-px bg-border mx-1" />
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                filterStatus === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 px-2"
              onClick={() => { setFilterType("all"); setFilterStatus("all"); }}
            >
              Limpar filtros
            </Button>
          )}
          {filtered.length !== feedbacks.length && (
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} de {feedbacks.length} resultados
            </span>
          )}
        </div>
      </div>

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
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Nenhum feedback encontrado</p>
                    {(search || activeFiltersCount > 0) && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setFilterType("all"); setFilterStatus("all"); }}>
                        Limpar busca e filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((f) => {
                const expanded = expandedId === f.id;
                const isNew = f.status === "novo";
                return (
                  <>
                    <TableRow
                      key={f.id}
                      className={cn("cursor-pointer transition-colors", isNew && "bg-warning/5 hover:bg-warning/10")}
                      onClick={() => setExpandedId(expanded ? null : f.id)}
                    >
                      <TableCell>
                        {expanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", typeColors[f.type])}>
                          {typeIcons[f.type]}
                          <span>{typeLabels[f.type]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <span className="truncate block" style={{ maxWidth: 280 }}>{f.message}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{f.area || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(f.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={f.status}
                          onValueChange={(v) => updateStatus.mutate({ id: f.id, status: v as FeedbackStatus })}
                        >
                          <SelectTrigger
                            className={`w-28 h-7 text-xs ${statusColors[f.status]}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="lido">Lido</SelectItem>
                            <SelectItem value="arquivado">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isNew && (
                          <button
                            title="Marcar como lido"
                            onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: f.id, status: "lido" }); }}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-info/10 hover:text-info"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow key={`${f.id}-expanded`}>
                        <TableCell colSpan={7} className="p-0">
                          <div
                            className="p-4 space-y-3"
                            style={{
                              background: typeAccentBg[f.type],
                              borderLeft: `4px solid ${typeAccentColors[f.type]}`,
                            }}
                          >
                            <p className="text-sm whitespace-pre-wrap" style={{ color: '#334155' }}>{f.message}</p>
                            {(f.name || f.email || f.area) && (
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                                {f.name && (
                                  <span>
                                    <span className="font-medium text-foreground">Nome: </span>{f.name}
                                  </span>
                                )}
                                {f.email && (
                                  <span>
                                    <span className="font-medium text-foreground">E-mail: </span>{f.email}
                                  </span>
                                )}
                                {f.area && (
                                  <span>
                                    <span className="font-medium text-foreground">Área: </span>{f.area}
                                  </span>
                                )}
                              </div>
                            )}
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
