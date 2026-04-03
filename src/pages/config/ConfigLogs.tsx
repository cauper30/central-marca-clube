import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityLogRow, useActivityLog } from "@/hooks/useActivityLog";

export default function ConfigLogs() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      entityType: entityType || undefined,
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize: 15,
    }),
    [entityType, action, dateFrom, dateTo, page]
  );

  const { data, isLoading } = useActivityLog(filters);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
      </Button>
      <h2 className="text-lg font-bold text-foreground">Logs de Atividade</h2>

      <Card className="p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Entidade (task, event...)"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Ação"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (data?.rows.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data?.rows.map((row: ActivityLogRow) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs">
                    {format(new Date(row.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">{row.profiles?.full_name || "—"}</TableCell>
                  <TableCell className="text-sm">{row.action}</TableCell>
                  <TableCell className="text-sm">{row.entity_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.details ? JSON.stringify(row.details) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Página {data?.page ?? 1} de {data?.totalPages ?? 1} • {data?.total ?? 0} registros
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(data?.page ?? 1) <= 1}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
