import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  version_label?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  signed_url?: string;
}

function extractStoragePath(fileUrl: string): string {
  if (!fileUrl.includes("http")) return fileUrl;
  const marker = "/task-attachments/";
  const idx = fileUrl.indexOf(marker);
  if (idx < 0) return fileUrl;
  const raw = fileUrl.slice(idx + marker.length);
  return raw.split("?")[0];
}

export function useTaskAttachments(taskId: string | null) {
  return useQuery({
    queryKey: ["task_attachments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments" as never)
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const attachments = ((data ?? []) as TaskAttachment[]).map((item) => ({
        ...item,
        file_url: extractStoragePath(item.file_url),
      }));

      const withSignedUrls = await Promise.all(
        attachments.map(async (item) => {
          const { data: signed, error: signError } = await supabase.storage
            .from("task-attachments")
            .createSignedUrl(item.file_url, 60 * 15);
          if (signError) return item;
          return { ...item, signed_url: signed.signedUrl };
        })
      );

      return withSignedUrls;
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      file,
      userId,
      versionLabel,
    }: {
      taskId: string;
      file: File;
      userId: string;
      versionLabel?: string;
    }) => {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${taskId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data, error } = await (supabase
        .from("task_attachments" as any)
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
          file_size: file.size,
          version_label: versionLabel || null,
          created_by: userId,
        } as any)
        .select("*")
        .single() as any);
      if (error) throw error;

      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "Anexo adicionado",
        entity_type: "task",
        entity_id: taskId,
        details: { file_name: file.name, version_label: versionLabel || null },
      });

      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["task_attachments", vars.taskId] });
      qc.invalidateQueries({ queryKey: ["activity_log", vars.taskId] });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attachment, userId }: { attachment: TaskAttachment; userId: string }) => {
      const storagePath = extractStoragePath(attachment.file_url);

      if (storagePath) {
        await supabase.storage.from("task-attachments").remove([storagePath]);
      }

      const { error } = await supabase.from("task_attachments" as never).delete().eq("id", attachment.id);
      if (error) throw error;

      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "Anexo removido",
        entity_type: "task",
        entity_id: attachment.task_id,
        details: { file_name: attachment.file_name },
      });

      return attachment.task_id as string;
    },
    onSuccess: (taskId: string) => {
      qc.invalidateQueries({ queryKey: ["task_attachments", taskId] });
      qc.invalidateQueries({ queryKey: ["activity_log", taskId] });
    },
  });
}
