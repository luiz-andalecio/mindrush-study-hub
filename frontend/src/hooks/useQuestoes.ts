import { useCallback, useEffect, useMemo, useState } from "react";
import { enemService, type ListEnemQuestionsParams } from "@/services/enemService";
import type { EnemQuestionsPage } from "@/types";

export function useQuestoes(filters: ListEnemQuestionsParams | null) {
  const [data, setData] = useState<EnemQuestionsPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableKey = useMemo(() => {
    if (!filters) return null;
    return `${filters.year}|${filters.limit ?? ""}|${filters.offset ?? ""}|${filters.language ?? ""}`;
  }, [filters]);

  const refetch = useCallback(async () => {
    if (!filters) return;

    setLoading(true);
    setError(null);

    try {
      const res = await enemService.listQuestoes(filters);
      setData(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar questões";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!stableKey) return;
    void refetch();
  }, [stableKey, refetch]);

  return { data, loading, error, refetch };
}
