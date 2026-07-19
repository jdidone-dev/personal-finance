// AwesomeAPI — gratuita, sem token, CORS habilitado, mantida por time brasileiro
const AWESOME_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

interface AwesomeResponse {
  USDBRL: { bid: string; timestamp: string };
}

export async function fetchUsdBrlRate(): Promise<number> {
  const response = await fetch(AWESOME_URL, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar cotação USD/BRL`);

  const data = (await response.json()) as AwesomeResponse;
  const rate = parseFloat(data?.USDBRL?.bid);

  if (isNaN(rate) || rate <= 0) throw new Error('Cotação USD/BRL inválida');
  return rate;
}
