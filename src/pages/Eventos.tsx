import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEventsWithDetails } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import EventCalendarView from "@/components/events/EventCalendarView";
import EventListView from "@/components/events/EventListView";
import EventDrawer from "@/components/events/EventDrawer";
import CreateEventModal from "@/components/events/CreateEventModal";
import type { EventWithDetails } from "@/hooks/useEvents";

export default function Eventos() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: events = [], isLoading } = useEventsWithDetails();

  const openDrawer = (event: EventWithDetails) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Próximos eventos e calendário
        </div>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <EventListView events={events} loading={isLoading} onEventClick={openDrawer} />
      <EventCalendarView events={events} loading={isLoading} onEventClick={openDrawer} />

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
        userId={user?.id || ""}
      />
    </div>
  );
}
