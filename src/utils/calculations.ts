import type { CarteiraSchema, PosicaoEnriquecida } from '../types/schema';
import { getModoClasse } from '../types/schema';

export function enrichPosicoes(carteira: CarteiraSchema): PosicaoEnriquecida[] {
  return carteira.posicoes.map((posicao) => {
    const ativo = carteira.ativos.find((a) => a.id === posicao.ativo_id)!;
    const corretora = carteira.corretoras.find((c) => c.id === posicao.corretora_id)!;
    const classeAtivo = carteira.classes_ativos.find((cl) => cl.id === ativo?.classe_id);
    const isValorMode = getModoClasse(classeAtivo) === 'valor';

    // Para modo 'valor': qty=1, preco_atual_cache = valor total da posição.
    // Para modo 'quantidade': cálculo normal.
    const valorTotal = isValorMode
      ? posicao.preco_atual_cache
      : posicao.quantidade * posicao.preco_atual_cache;
    const custoTotal = isValorMode ? 0 : posicao.quantidade * posicao.preco_medio;
    const lucroAbsoluto = isValorMode ? 0 : valorTotal - custoTotal;
    const lucroPct = isValorMode || custoTotal === 0 ? 0 : (lucroAbsoluto / custoTotal) * 100;

    return { posicao, ativo, corretora, classeAtivo, valorTotal, custoTotal, lucroAbsoluto, lucroPct, isValorMode };
  });
}

// Soma bruta sem conversão de moeda — usar apenas internamente ou onde se aceita a mistura.
export function calcularPatrimonioTotal(carteira: CarteiraSchema): number {
  return enrichPosicoes(carteira).reduce((acc, p) => acc + p.valorTotal, 0);
}

// Soma em BRL, convertendo posições USD pela cotação do dia.
export function calcularPatrimonioBRL(
  carteira: CarteiraSchema,
  usdBrlRate: number
): number {
  return enrichPosicoes(carteira).reduce((acc, p) => {
    const valor = p.ativo.mercado === 'US' ? p.valorTotal * usdBrlRate : p.valorTotal;
    return acc + valor;
  }, 0);
}

export interface ResumoCorretora {
  corretoraId: string;
  valorUSD: number;     // soma de posições US em dólar
  valorBRL: number;     // soma de posições BR em real
  totalBRL: number;     // valorBRL + (valorUSD * usdBrlRate)
  hasUSAssets: boolean;
}

export function calcularResumoCorretoras(
  carteira: CarteiraSchema,
  usdBrlRate: number
): Map<string, ResumoCorretora> {
  const map = new Map<string, ResumoCorretora>();

  enrichPosicoes(carteira).forEach((p) => {
    const id = p.posicao.corretora_id;
    const entry: ResumoCorretora = map.get(id) ?? {
      corretoraId: id,
      valorUSD: 0,
      valorBRL: 0,
      totalBRL: 0,
      hasUSAssets: false,
    };

    if (p.ativo.mercado === 'US') {
      entry.valorUSD += p.valorTotal;
      entry.hasUSAssets = true;
    } else {
      entry.valorBRL += p.valorTotal;
    }

    entry.totalBRL = entry.valorBRL + entry.valorUSD * usdBrlRate;
    map.set(id, entry);
  });

  return map;
}

export function calcularCustoTotal(carteira: CarteiraSchema): number {
  // Exclui ativos de modo 'valor' — não há preço médio de entrada.
  return enrichPosicoes(carteira)
    .filter((p) => !p.isValorMode)
    .reduce((acc, p) => acc + p.custoTotal, 0);
}

export function calcularLucroTotal(carteira: CarteiraSchema): {
  absoluto: number;
  percentual: number;
} {
  // Considera apenas posições BR em modo quantidade (há preço de custo em BRL).
  const posicoes = enrichPosicoes(carteira).filter(
    (p) => !p.isValorMode && p.ativo.mercado !== 'US'
  );
  const custoTotal = posicoes.reduce((acc, p) => acc + p.custoTotal, 0);
  const valorAtual = posicoes.reduce((acc, p) => acc + p.valorTotal, 0);
  const absoluto = valorAtual - custoTotal;
  const percentual = custoTotal !== 0 ? (absoluto / custoTotal) * 100 : 0;
  return { absoluto, percentual };
}

export function calcularAlocacaoPorClasse(
  carteira: CarteiraSchema,
  usdBrlRate = 1
): Array<{ id: string; nome: string; valor: number; percentual: number }> {
  const enriched = enrichPosicoes(carteira);
  const porClasse = new Map<string, number>();

  enriched.forEach((p) => {
    const valor = p.ativo.mercado === 'US' ? p.valorTotal * usdBrlRate : p.valorTotal;
    porClasse.set(p.ativo.classe_id, (porClasse.get(p.ativo.classe_id) ?? 0) + valor);
  });

  const patrimonioTotal = Array.from(porClasse.values()).reduce((a, b) => a + b, 0);

  return carteira.classes_ativos
    .filter((cl) => porClasse.has(cl.id))
    .map((cl) => ({
      id: cl.id,
      nome: cl.nome,
      valor: porClasse.get(cl.id) ?? 0,
      percentual:
        patrimonioTotal !== 0
          ? ((porClasse.get(cl.id) ?? 0) / patrimonioTotal) * 100
          : 0,
    }));
}

// Mantido para compatibilidade; retorna valores brutos (sem conversão de moeda).
export function calcularPatrimonioPorCorretora(
  carteira: CarteiraSchema
): Record<string, number> {
  const resultado: Record<string, number> = {};
  carteira.posicoes.forEach((posicao) => {
    const valor = posicao.quantidade * posicao.preco_atual_cache;
    resultado[posicao.corretora_id] = (resultado[posicao.corretora_id] ?? 0) + valor;
  });
  return resultado;
}

export function getHistoricoGeral(
  carteira: CarteiraSchema
): Array<{ mes: string; valor: number }> {
  const porMes = new Map<string, number>();
  carteira.historico_patrimonial.forEach((h) => {
    porMes.set(h.ano_mes, (porMes.get(h.ano_mes) ?? 0) + h.valor_total);
  });
  return Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes, valor }));
}

export function getHistoricoCorretora(
  carteira: CarteiraSchema,
  corretoraId: string
): Array<{ mes: string; valor: number }> {
  return carteira.historico_patrimonial
    .filter((h) => h.corretora_id === corretoraId)
    .sort((a, b) => a.ano_mes.localeCompare(b.ano_mes))
    .map((h) => ({ mes: h.ano_mes, valor: h.valor_total }));
}

export function getCurrentAnoMes(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentData(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getHistoricoGeralDiario(
  carteira: CarteiraSchema
): Array<{ mes: string; valor: number }> {
  const porData = new Map<string, number>();
  carteira.historico_diario.forEach((h) => {
    porData.set(h.data, (porData.get(h.data) ?? 0) + h.valor_total);
  });
  return Array.from(porData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes, valor }));
}

export function getHistoricoCorretoraDiario(
  carteira: CarteiraSchema,
  corretoraId: string
): Array<{ mes: string; valor: number }> {
  return carteira.historico_diario
    .filter((h) => h.corretora_id === corretoraId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((h) => ({ mes: h.data, valor: h.valor_total }));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatCurrencyByMercado(value: number, mercado?: string): string {
  return mercado === 'US' ? formatUSD(value) : formatCurrency(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
