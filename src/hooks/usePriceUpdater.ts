import { useState, useCallback } from 'react';
import { fetchBrapiQuote, fetchFinnhubQuote, fetchYahooQuote } from '../utils/priceService';
import { useCarteira } from '../context/CarteiraContext';
import type { Mercado } from '../types/schema';

export type PriceUpdateStatus = 'idle' | 'loading' | 'success' | 'error';

interface PriceUpdaterState {
  statusMap: Record<string, PriceUpdateStatus>;
  errorMap: Record<string, string>;
}

export interface ApiTokens {
  brapi?: string;
  finnhub?: string;
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
    async (
      ativoId: string,
      ticker: string,
      mercado: Mercado = 'BR',
      tokens: ApiTokens = {}
    ) => {
      setStatus(ativoId, 'loading');
      try {
        let price: number;

        if (mercado === 'US') {
          if (tokens.finnhub) {
            // Finnhub preferido: confiável, com token
            const quote = await fetchFinnhubQuote(ticker, tokens.finnhub);
            price = quote.currentPrice;
          } else {
            // Yahoo Finance: gratuito, sem token — pode falhar por CORS
            const quote = await fetchYahooQuote(ticker);
            price = quote.currentPrice;
          }
        } else {
          const quote = await fetchBrapiQuote(ticker, tokens.brapi);
          price = quote.regularMarketPrice;
        }

        updatePrecoCache(ativoId, price);
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
