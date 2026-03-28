import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkIcon, Settings } from "lucide-react";

export default function Linktree() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md w-full text-center animate-fade-in-up" style={{ padding: 40 }}>
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#EFF6FF' }}>
            <LinkIcon className="h-7 w-7" style={{ color: '#3B82F6', strokeWidth: 1.8 }} />
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#1A1A2E' }}>Gerenciamento de Links</h2>
        <p className="text-[13px] text-muted-foreground mb-6">
          Gerencie os links em <strong>Configurações → Linktree</strong>
        </p>
        <Button onClick={() => navigate("/config/linktree")} className="gap-2">
          <Settings className="h-4 w-4" />
          Ir para Configurações
        </Button>
      </Card>
    </div>
  );
}
