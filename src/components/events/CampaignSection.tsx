import { CampaignWithEvent } from "@/hooks/useEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  campaigns: CampaignWithEvent[];
}

export default function CampaignSection({ campaigns }: Props) {
  if (campaigns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Campanhas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="text-sm font-semibold">{c.name}</p>
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                {c.events && (
                  <span className="text-[10px] text-muted-foreground">📅 {c.events.name}</span>
                )}
              </div>
              {c.start_date && (
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(c.start_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  {c.end_date && <> — {format(new Date(c.end_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</>}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
