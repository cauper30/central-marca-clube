import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];
import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks"> & {
  profiles?: { id: string; full_name: string; avatar_url: string | null } | null;
  task_statuses?: { id: string; name: string; color: string } | null;
  task_types?: { id: string; name: string; color: string; icon: string | null } | null;
  task_tags?: { tag_id: string; tags: { id: string; name: string; color: string } }[];
};

export function useTasks(showArchived = false) {
  return useQuery({
    queryKey: ["tasks", showArchived],
    queryFn: async () => {
      const query = supabase
        .from("tasks")
        .select(`
          *,
          profiles:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
          task_statuses:task_statuses!tasks_status_id_fkey(id, name, color),
          task_types:task_types!tasks_type_id_fkey(id, name, color, icon),
          task_tags(tag_id, tags:tags!task_tags_tag_id_fkey(id, name, color))
        `)
        .eq("is_archived", showArchived)
        .order("sort_order");
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Task[];
    },
  });
}

export function useTaskStatuses() {
  return useQuery({
    queryKey: ["task_statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_statuses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskTypes() {
  return useQuery({
    queryKey: ["task_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, area, role")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      const { error } = await supabase.from("tasks").update({ status_id: statusId }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      type_id?: string | null;
      priority?: TaskPriority;
      assigned_to?: string | null;
      due_date?: string | null;
      event_id?: string | null;
      campaign_id?: string | null;
      status_id: string;
      created_by: string;
      is_demand?: boolean;
      demand_area?: string | null;
      tag_ids?: string[];
    }) => {
      const { tag_ids, ...taskData } = task;
      const { data, error } = await supabase.from("tasks").insert([taskData]).select("id").single();
      if (error) throw error;

      if (tag_ids?.length) {
        await supabase.from("task_tags").insert(tag_ids.map((tag_id) => ({ task_id: data.id, tag_id })));
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: task.created_by,
        action: task.is_demand ? "Solicitação criada" : "Tarefa criada",
        entity_type: "task",
        entity_id: data.id,
        details: { title: task.title },
      });

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
