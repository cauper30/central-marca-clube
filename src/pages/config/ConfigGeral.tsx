import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConfigGeral() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/config")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
      </Button>
      <h2 className="text-lg font-bold text-foreground">Configurações Gerais</h2>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">Em construção — Configurações gerais estarão disponíveis em breve.</p>
      </Card>
    </div>
  );
}
