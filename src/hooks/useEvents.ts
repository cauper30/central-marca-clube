import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logActivity } from "@/lib/activityLog";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type EventWithDetails = EventRow & {
  profiles?: { id: string; full_name: string } | null;
  taskCount?: number;
};

export function useEventsWithDetails() {
  return useQuery({
    queryKey: ["events_detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, profiles:responsible_id(id, full_name)")
        .eq("is_archived", false)
        .order("event_date", { ascending: true });
      if (error) throw error;

      // Get task counts per event
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, event_id")
        .eq("is_archived", false)
        .not("event_id", "is", null);

      const taskCounts: Record<string, number> = {};
      tasks?.forEach((t) => {
        if (t.event_id) taskCounts[t.event_id] = (taskCounts[t.event_id] || 0) + 1;
      });

      return (data as unknown as EventWithDetails[]).map((e) => ({
        ...e,
        taskCount: taskCounts[e.id] || 0,
      }));
    },
  });
}

export function useEventTasks(eventId: string | null) {
  return useQuery({
    queryKey: ["event_tasks", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, priority, status_id, task_statuses:task_statuses!tasks_status_id_fkey(name, color)")
        .eq("event_id", eventId!)
        .eq("is_archived", false)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      name: string;
      description?: string;
      event_date?: string | null;
      event_end_date?: string | null;
      location?: string;
      responsible_id?: string | null;
      status?: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase.from("events").insert([event]).select("id").single();
      if (error) throw error;
      await logActivity({
        userId: event.created_by,
        action: "Evento criado",
        entityType: "event",
        entityId: data.id,
        details: { name: event.name, status: event.status || "planejamento" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events_detailed"] }),
  });
}
