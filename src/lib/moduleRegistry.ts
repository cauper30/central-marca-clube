import { lazy } from "react";
import type { ComponentType } from "react";
import {
  LayoutGrid,
  CheckSquare,
  Calendar,
  Settings,
  Users,
  Tag,
  Columns3,
  FormInput,
  Settings as SettingsIcon,
} from "lucide-react";

export type UserRole =
  | "superadmin"
  | "vice_superadmin"
  | "equipe_marketing"
  | "presidente"
  | "gestor";

export interface AppModule {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  roles: UserRole[];
  sortOrder: number;
  component: React.LazyExoticComponent<ComponentType<any>>;
  showInSidebar?: boolean;
  pageTitle?: string;
}

export interface ConfigSubModule {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  component: React.LazyExoticComponent<ComponentType<any>>;
  pageTitle?: string;
  section?: string;
}

// ── Main modules (sidebar) ──────────────────────────────────────────────

export const modules: AppModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutGrid,
    roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"],
    sortOrder: 1,
    component: lazy(() => import("@/pages/Dashboard")),
  },
  {
    id: "tarefas",
    label: "Tarefas",
    path: "/tarefas",
    icon: CheckSquare,
    roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"],
    sortOrder: 2,
    component: lazy(() => import("@/pages/Tarefas")),
  },
  {
    id: "eventos",
    label: "Eventos",
    path: "/eventos",
    icon: Calendar,
    roles: ["superadmin", "vice_superadmin", "equipe_marketing", "presidente", "gestor"],
    sortOrder: 3,
    component: lazy(() => import("@/pages/Eventos")),
  },
  {
    id: "config",
    label: "Configurações",
    path: "/config",
    icon: Settings,
    roles: ["superadmin", "vice_superadmin"],
    sortOrder: 10,
    component: lazy(() => import("@/pages/Config")),
  },
];

// ── Config sub-modules ──────────────────────────────────────────────────

export const configSubModules: ConfigSubModule[] = [
  {
    id: "config-usuarios",
    label: "Usuários",
    description: "Gerenciar perfis, cargos e acessos",
    path: "usuarios",
    icon: Users,
    component: lazy(() => import("@/pages/config/ConfigUsuarios")),
    pageTitle: "Usuários",
    section: "Usuários",
  },
  {
    id: "config-tipos",
    label: "Tipos de Tarefa",
    description: "Criar e editar tipos de tarefa",
    path: "tipos",
    icon: Tag,
    component: lazy(() => import("@/pages/config/ConfigTipos")),
    pageTitle: "Tipos de Tarefa",
    section: "Eventos e Tarefas",
  },
  {
    id: "config-status",
    label: "Status de Tarefas",
    description: "Gerenciar colunas do Kanban",
    path: "status",
    icon: Columns3,
    component: lazy(() => import("@/pages/config/ConfigStatus")),
    pageTitle: "Status de Tarefas",
    section: "Eventos e Tarefas",
  },
  {
    id: "config-campos",
    label: "Campos Personalizados",
    description: "Campos extras para tarefas",
    path: "campos",
    icon: FormInput,
    component: lazy(() => import("@/pages/config/ConfigCampos")),
    pageTitle: "Campos Personalizados",
    section: "Eventos e Tarefas",
  },
  {
    id: "config-geral",
    label: "Geral",
    description: "Configurações gerais do sistema",
    path: "geral",
    icon: SettingsIcon,
    component: lazy(() => import("@/pages/config/ConfigGeral")),
    pageTitle: "Configurações Gerais",
    section: "Sistema",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────

export function getMenuItems(role: UserRole) {
  return modules
    .filter((m) => m.showInSidebar !== false && m.roles.includes(role))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPageTitle(pathname: string): string {
  // Check config sub-modules first
  for (const sub of configSubModules) {
    if (pathname === `/config/${sub.path}`) {
      return sub.pageTitle || sub.label;
    }
  }
  // Check main modules
  const mod = modules.find(
    (m) => pathname === m.path || pathname.startsWith(m.path + "/")
  );
  if (mod) return mod.pageTitle || mod.label;
  return "";
}
