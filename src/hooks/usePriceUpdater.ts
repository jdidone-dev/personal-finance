import { useState, useCallback } from 'react';
import { fetchQuote } from '../utils/priceService';
import { useCarteira } from '../context/CarteiraContext';

export type PriceUpdateStatus = 'idle' | 'loading' | 'success' | 'error';

interface PriceUpdaterState {
  statusMap: Record<string, PriceUpdateStatus>;
  errorMap: Record<string, string>;
}

export function usePriceUpdater() {
  const { updatePrecoCache } = useCarteira();
  const [state, setState] = useState<PriceUpdaterState>({
    statusMap: {},
    errorMap: {},
  });

  const setStatus = useCallback(
    (ativoId: string, status: PriceUpdateStatus, error?: string) => {
      setState((prev) => ({
        statusMap: { ...prev.statusMap, [ativoId]: status },
        errorMap: error
          ? { ...prev.errorMap, [ativoId]: error }
          : prev.errorMap,
      }));
    },
    []
  );

  const updatePrice = useCallback(
    async (ativoId: string, ticker: string, token?: string) => {
      setStatus(ativoId, 'loading');
      try {
        const quote = await fetchQuote(ticker, token);
        updatePrecoCache(ativoId, quote.regularMarketPrice);
        setStatus(ativoId, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao buscar preço';
        setStatus(ativoId, 'error', message);
      }
    },
    [updatePrecoCache, setStatus]
  );

  const getStatus = useCallback(
    (ativoId: string): PriceUpdateStatus => state.statusMap[ativoId] ?? 'idle',
    [state.statusMap]
  );

  const getError = useCallback(
    (ativoId: string): string | undefined => state.errorMap[ativoId],
    [state.errorMap]
  );

  return { updatePrice, getStatus, getError };
}
