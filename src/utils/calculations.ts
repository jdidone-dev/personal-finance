import type { CarteiraSchema, PosicaoEnriquecida } from '../types/schema';

export function enrichPosicoes(carteira: CarteiraSchema): PosicaoEnriquecida[] {
  return carteira.posicoes.map((posicao) => {
    const ativo = carteira.ativos.find((a) => a.id === posicao.ativo_id)!;
    const corretora = carteira.corretoras.find((c) => c.id === posicao.corretora_id)!;
    const classeAtivo = carteira.classes_ativos.find((cl) => cl.id === ativo?.classe_id);

    const valorTotal = posicao.quantidade * posicao.preco_atual_cache;
    const custoTotal = posicao.quantidade * posicao.preco_medio;
    const lucroAbsoluto = valorTotal - custoTotal;
    const lucroPct = custoTotal !== 0 ? (lucroAbsoluto / custoTotal) * 100 : 0;

    return { posicao, ativo, corretora, classeAtivo, valorTotal, custoTotal, lucroAbsoluto, lucroPct };
  });
}

export function calcularPatrimonioTotal(carteira: CarteiraSchema): number {
  return carteira.posicoes.reduce(
    (acc, p) => acc + p.quantidade * p.preco_atual_cache,
    0
  );
}

export function calcularCustoTotal(carteira: CarteiraSchema): number {
  return carteira.posicoes.reduce(
    (acc, p) => acc + p.quantidade * p.preco_medio,
    0
  );
}

export function calcularLucroTotal(carteira: CarteiraSchema): {
  absoluto: number;
  percentual: number;
} {
  const custoTotal = calcularCustoTotal(carteira);
  const patrimonioTotal = calcularPatrimonioTotal(carteira);
  const absoluto = patrimonioTotal - custoTotal;
  const percentual = custoTotal !== 0 ? (absoluto / custoTotal) * 100 : 0;
  return { absoluto, percentual };
}

export function calcularAlocacaoPorClasse(
  carteira: CarteiraSchema
): Array<{ id: string; nome: string; valor: number; percentual: number }> {
  const patrimonioTotal = calcularPatrimonioTotal(carteira);
  const porClasse = new Map<string, number>();

  carteira.posicoes.forEach((posicao) => {
    const ativo = carteira.ativos.find((a) => a.id === posicao.ativo_id);
    if (!ativo) return;
    const valorAtual = posicao.quantidade * posicao.preco_atual_cache;
    porClasse.set(ativo.classe_id, (porClasse.get(ativo.classe_id) ?? 0) + valorAtual);
  });

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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
