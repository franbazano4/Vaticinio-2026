import { useState, useEffect, useCallback } from "react";

interface GlobeButtonProps {
  onFetched: () => void;
  apiBase: string;
}

export function GlobeButton({ onFetched, apiBase }: GlobeButtonProps) {
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({ type: "idle", msg: "" });

  const fetchResults = useCallback(async () => {
    setStatus({ type: "loading", msg: "FETCHING..." });
    try {
      const res = await fetch(`${apiBase}/api/results/fetch`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus({ type: "success", msg: data.message || `+${data.count} RESULTS` });
      onFetched();
    } catch (e) {
      setStatus({ type: "error", msg: "ERROR" });
    } finally {
      setTimeout(() => setStatus({ type: "idle", msg: "" }), 4000);
    }
  }, [apiBase, onFetched]);

  // Auto-fetch on mount so results are always fresh when someone opens the app
  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      {status.type !== "idle" && (
        <span
          className={`text-xs font-mono font-bold px-2 py-1 rounded ${
            status.type === "loading"
              ? "text-primary animate-pulse"
              : status.type === "success"
              ? "text-green-400 bg-green-400/10"
              : "text-red-400 bg-red-400/10"
          }`}
        >
          {status.msg}
        </span>
      )}
      <button
        className={`text-2xl p-2 rounded-full transition-all cursor-pointer ${
          status.type === "loading" ? "animate-spin opacity-50 cursor-not-allowed" : "hover:bg-white/10"
        }`}
        title="Actualizar resultados"
        onClick={() => {
          if (status.type !== "loading") fetchResults();
        }}
        disabled={status.type === "loading"}
      >
        🌐
      </button>
    </div>
  );
}
