import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface LogActivityParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Json;
}

export async function logActivity({ userId, action, entityType, entityId, details }: LogActivityParams) {
  const { error } = await supabase.from("activity_log").insert({
    user_id: userId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  });

  if (error) {
    throw error;
  }
}
