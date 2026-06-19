import React, { useState, useEffect } from "react";
import { useFetchResults } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetResultsQueryKey } from "@workspace/api-client-react";

export function GlobeButton() {
  const [status, setStatus] = useState<{type: 'idle' | 'loading' | 'success' | 'error', msg: string}>({ type: 'idle', msg: '' });
  const queryClient = useQueryClient();

  const fetchMutation = useFetchResults({
    mutation: {
      onMutate: () => {
        setStatus({ type: 'loading', msg: 'FETCHING...' });
      },
      onSuccess: (data) => {
        setStatus({ type: 'success', msg: data.message || `+${data.count} RESULTS` });
        queryClient.invalidateQueries({ queryKey: getGetResultsQueryKey() });
        setTimeout(() => setStatus({ type: 'idle', msg: '' }), 4000);
      },
      onError: () => {
        setStatus({ type: 'error', msg: 'ERROR' });
        setTimeout(() => setStatus({ type: 'idle', msg: '' }), 4000);
      }
    }
  });

  // Auto-fetch on mount so results are always fresh when someone opens the app
  useEffect(() => {
    fetchMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      {status.type !== 'idle' && (
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
          status.type === 'loading' ? 'text-primary animate-pulse' :
          status.type === 'success' ? 'text-green-400 bg-green-400/10' :
          'text-red-400 bg-red-400/10'
        }`}>
          {status.msg}
        </span>
      )}
      <button
        className={`text-2xl p-2 rounded-full transition-all cursor-pointer ${status.type === 'loading' ? 'animate-spin opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
        title="Actualizar resultados"
        onClick={() => {
          if (status.type !== 'loading') fetchMutation.mutate();
        }}
        disabled={status.type === 'loading'}
      >
        🌐
      </button>
    </div>
  );
}
