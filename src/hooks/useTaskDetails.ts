import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";

export function useChecklists(taskId: string | null) {
  return useQuery({
    queryKey: ["checklists", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("task_id", taskId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useSubtasks(taskId: string | null) {
  return useQuery({
    queryKey: ["subtasks", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*, profiles:assigned_to(id, full_name)")
        .eq("task_id", taskId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: ["comments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:author_id(id, full_name, avatar_url)")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomFieldValues(taskId: string | null) {
  return useQuery({
    queryKey: ["custom_field_values", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_field_values")
        .select("*, custom_fields:field_id(id, name, field_type, options, is_required)")
        .eq("task_id", taskId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomFields() {
  return useQuery({
    queryKey: ["custom_fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useApprovals(taskId: string | null) {
  return useQuery({
    queryKey: ["approvals", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*, requested:requested_by(full_name), decided:decided_by(full_name)")
        .eq("task_id", taskId!)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskActivity(taskId: string | null) {
  return useQuery({
    queryKey: ["activity_log", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, profiles:user_id(full_name)")
        .eq("entity_id", taskId!)
        .eq("entity_type", "task")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_completed,
      task_id,
      user_id,
    }: {
      id: string;
      is_completed: boolean;
      task_id: string;
      user_id?: string;
    }) => {
      const { error } = await supabase.from("checklists").update({ is_completed }).eq("id", id);
      if (error) throw error;

      await logActivity({
        userId: user_id,
        action: is_completed ? "Checklist concluído" : "Checklist reaberto",
        entityType: "task",
        entityId: task_id,
        details: { checklist_id: id, is_completed },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["checklists"] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.task_id] });
    },
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_completed,
      task_id,
      user_id,
    }: {
      id: string;
      is_completed: boolean;
      task_id: string;
      user_id?: string;
    }) => {
      const { error } = await supabase.from("subtasks").update({ is_completed }).eq("id", id);
      if (error) throw error;

      await logActivity({
        userId: user_id,
        action: is_completed ? "Subtarefa concluída" : "Subtarefa reaberta",
        entityType: "task",
        entityId: task_id,
        details: { subtask_id: id, is_completed },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subtasks"] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.task_id] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      task_id,
      author_id,
      content,
      mentions,
    }: {
      task_id: string;
      author_id: string;
      content: string;
      mentions?: string[];
    }) => {
      const { error } = await supabase.from("comments").insert({ task_id, author_id, content, mentions: mentions || [] });
      if (error) throw error;

      await logActivity({
        userId: author_id,
        action: "Comentário adicionado",
        entityType: "task",
        entityId: task_id,
        details: { content_preview: content.slice(0, 120), mentions: mentions || [] },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["comments"] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.task_id] });
    },
  });
}

export function useSubmitApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, requested_by }: { task_id: string; requested_by: string }) => {
      const { error } = await supabase.from("approvals").insert({ task_id, requested_by, status: "pendente" });
      if (error) throw error;

      await logActivity({
        userId: requested_by,
        action: "Aprovação solicitada",
        entityType: "task",
        entityId: task_id,
        details: { status: "pendente" },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.task_id] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actor_id, ...updates }: { id: string; actor_id?: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;

      await logActivity({
        userId: actor_id,
        action: "Tarefa atualizada",
        entityType: "task",
        entityId: id,
        details: { updated_fields: Object.keys(updates), updates },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.id] });
    },
  });
}
