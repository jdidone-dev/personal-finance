import { useState, useEffect, useCallback } from 'react';
import { fetchUsdBrlRate } from '../utils/exchangeRate';

export interface ExchangeRateState {
  rate: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExchangeRate(): ExchangeRateState {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUsdBrlRate()
      .then((r) => {
        if (!cancelled) { setRate(r); setLoading(false); }
      })
      .catch((e: Error) => {
        if (!cancelled) { setError(e.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { rate, loading, error, refetch };
}
