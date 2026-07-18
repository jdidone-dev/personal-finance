export class PriceFetchError extends Error {
  constructor(
    public readonly ticker: string,
    message: string
  ) {
    super(message);
    this.name = 'PriceFetchError';
  }
}

// ─── BRAPI (mercado BR) ────────────────────────────────────────────────────

const BRAPI_BASE = 'https://brapi.dev/api/quote';

export interface BrapiQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
}

export async function fetchBrapiQuote(
  ticker: string,
  token?: string
): Promise<BrapiQuoteResult> {
  const url = new URL(`${BRAPI_BASE}/${encodeURIComponent(ticker)}`);
  if (token) url.searchParams.set('token', token);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });

  if (!response.ok) {
    throw new PriceFetchError(ticker, `BRAPI HTTP ${response.status} para ${ticker}`);
  }

  const data = (await response.json()) as { results?: BrapiQuoteResult[] };
  const result = data?.results?.[0];

  if (!result || typeof result.regularMarketPrice !== 'number') {
    throw new PriceFetchError(ticker, `Dados indisponíveis no BRAPI para ${ticker}`);
  }

  return {
    symbol: result.symbol,
    regularMarketPrice: result.regularMarketPrice,
    regularMarketChangePercent: result.regularMarketChangePercent ?? 0,
  };
}

// ─── Yahoo Finance (mercado US — sem token, sujeito a CORS) ───────────────

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote';

export interface YahooQuoteResult {
  symbol: string;
  currentPrice: number;
  changePercent: number;
}

interface YahooRaw {
  quoteResponse?: {
    result?: Array<{
      symbol: string;
      regularMarketPrice: number;
      regularMarketChangePercent: number;
    }>;
    error?: { description: string } | null;
  };
}

export async function fetchYahooQuote(ticker: string): Promise<YahooQuoteResult> {
  const url = new URL(YAHOO_BASE);
  url.searchParams.set('symbols', ticker);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('region', 'US');

  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  } catch (err) {
    // TypeError de rede quase sempre significa bloqueio de CORS
    const isCors =
      err instanceof TypeError && err.message.toLowerCase().includes('fetch');
    throw new PriceFetchError(
      ticker,
      isCors
        ? `Yahoo Finance bloqueado por CORS neste navegador. Use o token Finnhub como alternativa.`
        : `Falha de rede ao buscar ${ticker} no Yahoo Finance.`
    );
  }

  if (!response.ok) {
    throw new PriceFetchError(ticker, `Yahoo Finance HTTP ${response.status} para ${ticker}`);
  }

  const data = (await response.json()) as YahooRaw;
  const result = data?.quoteResponse?.result?.[0];

  if (!result || typeof result.regularMarketPrice !== 'number') {
    throw new PriceFetchError(ticker, `Símbolo "${ticker}" não encontrado no Yahoo Finance.`);
  }

  return {
    symbol: result.symbol,
    currentPrice: result.regularMarketPrice,
    changePercent: result.regularMarketChangePercent ?? 0,
  };
}

// ─── Finnhub (mercado US) ──────────────────────────────────────────────────

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export interface FinnhubQuoteResult {
  symbol: string;
  currentPrice: number;
  changePercent: number;
}

interface FinnhubRawQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // change percent
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

export async function fetchFinnhubQuote(
  symbol: string,
  token: string
): Promise<FinnhubQuoteResult> {
  if (!token) {
    throw new PriceFetchError(symbol, 'Token Finnhub não configurado. Adicione seu token nas configurações.');
  }

  const url = new URL(`${FINNHUB_BASE}/quote`);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('token', token);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });

  if (!response.ok) {
    throw new PriceFetchError(symbol, `Finnhub HTTP ${response.status} para ${symbol}`);
  }

  const data = (await response.json()) as FinnhubRawQuote;

  // Finnhub retorna c=0 quando o símbolo não é encontrado
  if (!data || typeof data.c !== 'number' || data.c === 0) {
    throw new PriceFetchError(
      symbol,
      `Símbolo "${symbol}" não encontrado no Finnhub. Verifique o ticker (ex: AAPL, VOO, XLK).`
    );
  }

  return {
    symbol,
    currentPrice: data.c,
    changePercent: data.dp ?? 0,
  };
}
