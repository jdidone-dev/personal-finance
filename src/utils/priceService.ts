const BRAPI_BASE = 'https://brapi.dev/api/quote';

export interface BrapiQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

export class PriceFetchError extends Error {
  constructor(
    public readonly ticker: string,
    message: string
  ) {
    super(message);
    this.name = 'PriceFetchError';
  }
}

export async function fetchQuote(
  ticker: string,
  token?: string
): Promise<BrapiQuoteResult> {
  const url = new URL(`${BRAPI_BASE}/${encodeURIComponent(ticker)}`);
  if (token) url.searchParams.set('token', token);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });

  if (!response.ok) {
    throw new PriceFetchError(ticker, `HTTP ${response.status} ao buscar cotação de ${ticker}`);
  }

  const data = (await response.json()) as { results?: BrapiQuoteResult[] };
  const result = data?.results?.[0];

  if (!result || typeof result.regularMarketPrice !== 'number') {
    throw new PriceFetchError(ticker, `Dados indisponíveis para ${ticker}`);
  }

  return {
    symbol: result.symbol,
    regularMarketPrice: result.regularMarketPrice,
    regularMarketChangePercent: result.regularMarketChangePercent ?? 0,
  };
}

export async function fetchMultipleQuotes(
  tickers: string[],
  token?: string,
  onProgress?: (ticker: string, price: number | null, error?: string) => void
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  const unique = [...new Set(tickers)];

  await Promise.allSettled(
    unique.map(async (ticker) => {
      try {
        const quote = await fetchQuote(ticker, token);
        results.set(ticker, quote.regularMarketPrice);
        onProgress?.(ticker, quote.regularMarketPrice);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        onProgress?.(ticker, null, message);
      }
    })
  );

  return results;
}
