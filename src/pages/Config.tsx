import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Users, Tag, Columns3, FormInput, Link as LinkIcon, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";

const configItems = [
  { label: "Usuários", description: "Gerenciar perfis, cargos e acessos", path: "/config/usuarios", icon: Users },
  { label: "Tipos de Tarefa", description: "Criar e editar tipos de tarefa", path: "/config/tipos", icon: Tag },
  { label: "Status de Tarefas", description: "Gerenciar colunas do Kanban", path: "/config/status", icon: Columns3 },
  { label: "Campos Personalizados", description: "Campos extras para tarefas", path: "/config/campos", icon: FormInput },
  { label: "Linktree", description: "Gerenciar links públicos", path: "/config/linktree", icon: LinkIcon },
  { label: "Geral", description: "Configurações gerais do sistema", path: "/config/geral", icon: Settings },
];

export default function Config() {
  const location = useLocation();
  const navigate = useNavigate();

  // If on a sub-page, render the sub-page via Outlet
  if (location.pathname !== "/config") {
    return <Outlet />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {configItems.map((item) => (
        <Card
          key={item.path}
          className="flex cursor-pointer items-center gap-4 p-5 transition-shadow hover:shadow-md"
          onClick={() => navigate(item.path)}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
