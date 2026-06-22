import { useEffect, useCallback } from "react";

interface GlobeButtonProps {
  onFetched: () => void;
  apiBase: string;
}

export function GlobeButton({ onFetched, apiBase }: GlobeButtonProps) {
  const fetchResults = useCallback(async () => {
    try {
      await fetch(`${apiBase}/api/results/fetch`, { method: "POST" });
      onFetched();
    } catch (e) {
      console.error("Failed to fetch results", e);
    }
  }, [apiBase, onFetched]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchResults();
  }, []);

  return null;
}
