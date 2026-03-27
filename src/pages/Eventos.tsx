import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEventsWithDetails, useCampaigns } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, List, Plus } from "lucide-react";
import EventCalendarView from "@/components/events/EventCalendarView";
import EventListView from "@/components/events/EventListView";
import EventDrawer from "@/components/events/EventDrawer";
import CreateEventModal from "@/components/events/CreateEventModal";
import CampaignSection from "@/components/events/CampaignSection";
import type { EventWithDetails } from "@/hooks/useEvents";

type ViewMode = "calendario" | "lista";

export default function Eventos() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>("calendario");
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<"event" | "campaign">("event");

  const { data: events = [], isLoading } = useEventsWithDetails();
  const { data: campaigns = [] } = useCampaigns();

  const openDrawer = (event: EventWithDetails) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as ViewMode)}
          className="rounded-full border border-border bg-card p-1"
        >
          <ToggleGroupItem value="calendario" className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <Calendar className="mr-1.5 h-4 w-4" />
            Calendário
          </ToggleGroupItem>
          <ToggleGroupItem value="lista" className="rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <List className="mr-1.5 h-4 w-4" />
            Lista
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCreateType("campaign"); setCreateOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Campanha
          </Button>
          <Button size="sm" onClick={() => { setCreateType("event"); setCreateOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Views */}
      {view === "calendario" ? (
        <EventCalendarView events={events} loading={isLoading} onEventClick={openDrawer} />
      ) : (
        <EventListView events={events} loading={isLoading} onEventClick={openDrawer} />
      )}

      {/* Campaigns section */}
      <CampaignSection campaigns={campaigns} />

      {/* Drawer */}
      <EventDrawer
        event={selectedEvent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userId={user?.id || ""}
      />

      {/* Create modal */}
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        type={createType}
        userId={user?.id || ""}
        events={events}
      />
    </div>
  );
}
