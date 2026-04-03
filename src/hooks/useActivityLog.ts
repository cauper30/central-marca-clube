import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogFilters {
  userId?: string;
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ActivityLogRow {
  id: string;
  action: string;
  entity_type: string;
  details: unknown;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
}

export function useActivityLog(filters: ActivityLogFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["activity_log_paginated", filters],
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*, profiles:user_id(id, full_name, avatar_url)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.entityType) query = query.eq("entity_type", filters.entityType);
      if (filters.action) query = query.ilike("action", `%${filters.action}%`);
      if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
      if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        rows: (data ?? []) as ActivityLogRow[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      };
    },
  });
}
