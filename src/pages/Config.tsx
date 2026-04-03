import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { configSubModules } from "@/lib/moduleRegistry";

export default function Config() {
  const location = useLocation();
  const navigate = useNavigate();

  // If on a sub-page, render the sub-page via Outlet
  if (location.pathname !== "/config") {
    return <Outlet />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {configSubModules.map((item) => (
        <Card
          key={item.path}
          className="flex cursor-pointer items-center gap-4 p-5 transition-shadow hover:shadow-md"
          onClick={() => navigate(`/config/${item.path}`)}
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
