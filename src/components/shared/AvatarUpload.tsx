import { ChangeEvent, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  userId: string;
  onUploaded?: (publicUrl: string) => void | Promise<void>;
}

export default function AvatarUpload({ userId, onUploaded }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    try {
      setLoading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (profileError) throw profileError;

      await onUploaded?.(publicUrl);
      toast.success("Avatar atualizado!");
    } catch {
      toast.error("Erro ao enviar avatar");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
        <Button type="button" size="sm" variant="outline" asChild>
          <span>{loading ? "Enviando..." : "Alterar Avatar"}</span>
        </Button>
      </label>
    </div>
  );
}
