import { ChangeEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TaskAttachment, useDeleteAttachment, useTaskAttachments, useUploadAttachment } from "@/hooks/useAttachments";

interface Props {
  taskId: string;
}

export default function TaskAttachments({ taskId }: Props) {
  const { user } = useAuth();
  const [versionLabel, setVersionLabel] = useState("");
  const { data: attachments = [] } = useTaskAttachments(taskId);
  const upload = useUploadAttachment();
  const remove = useDeleteAttachment();

  const grouped = useMemo(() => {
    return attachments.reduce<Record<string, TaskAttachment[]>>((acc, item) => {
      const key = item.version_label || "Sem versão";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [attachments]);

  const onSelectFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    await upload.mutateAsync({ taskId, file, userId: user.id, versionLabel: versionLabel || undefined });
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Anexos</h4>
      <div className="flex gap-2">
        <Input
          placeholder="Versão (ex: V1, Revisão final)"
          value={versionLabel}
          onChange={(e) => setVersionLabel(e.target.value)}
          className="h-8 text-xs"
        />
        <label>
          <input type="file" className="hidden" onChange={onSelectFile} />
          <Button asChild size="sm" variant="outline" className="h-8">
            <span>{upload.isPending ? "Enviando..." : "Enviar"}</span>
          </Button>
        </label>
      </div>

      {Object.entries(grouped).length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum anexo.</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([version, files]) => (
            <div key={version} className="rounded border border-border p-2 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{version}</p>
              <Separator />
              <div className="space-y-1.5">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2">
                    <a
                      href={file.signed_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline truncate"
                      onClick={(e) => !file.signed_url && e.preventDefault()}
                    >
                      {file.file_name}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      disabled={!user?.id || remove.isPending}
                      onClick={() => user?.id && remove.mutate({ attachment: file, userId: user.id })}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
