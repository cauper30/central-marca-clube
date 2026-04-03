import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogFilters {
  user?: string;
  entity_type?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

interface UseActivityLogParams {
  page?: number;
  pageSize?: number;
  filters?: ActivityLogFilters;
}

export function useActivityLog({
  page = 1,
  pageSize = 20,
  filters = {},
}: UseActivityLogParams) {
  return useQuery({
    queryKey: ["activity_log", "paginated", page, pageSize, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("activity_log")
        .select("*, profiles:user_id(full_name, email)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.user && filters.user !== "all") {
        query = query.eq("user_id", filters.user);
      }

      if (filters.entity_type && filters.entity_type !== "all") {
        query = query.eq("entity_type", filters.entity_type);
      }

      if (filters.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }

      if (filters.start_date) {
        query = query.gte("created_at", `${filters.start_date}T00:00:00`);
      }

      if (filters.end_date) {
        query = query.lte("created_at", `${filters.end_date}T23:59:59`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      };
    },
  });
}

export function useActivityLogFilterOptions() {
  return useQuery({
    queryKey: ["activity_log", "filter_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("action, entity_type")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const actions = Array.from(new Set((data || []).map((item) => item.action))).filter(Boolean);
      const entityTypes = Array.from(new Set((data || []).map((item) => item.entity_type))).filter(Boolean);

      return { actions, entityTypes };
    },
  });
}
