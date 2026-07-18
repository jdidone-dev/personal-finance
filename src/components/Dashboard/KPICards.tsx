import React from 'react';
import {
  calcularPatrimonioTotal,
  calcularLucroTotal,
  calcularAlocacaoPorClasse,
  formatCurrency,
  formatPercent,
} from '../../utils/calculations';
import { useCarteira } from '../../context/CarteiraContext';
import { Badge } from '../UI/Badge';

function KPICard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="kpi-card flex flex-col gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <span
        className={`text-2xl font-bold mono ${
          positive === undefined
            ? 'text-slate-100'
            : positive
              ? 'text-emerald-400'
              : 'text-rose-400'
        }`}
      >
        {value}
      </span>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function KPICards() {
  const { carteira } = useCarteira();
  if (!carteira) return null;

  const patrimonio = calcularPatrimonioTotal(carteira);
  const { absoluto, percentual } = calcularLucroTotal(carteira);
  const alocacao = calcularAlocacaoPorClasse(carteira);
  const isPositive = absoluto >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <KPICard
        label="Patrimônio Total"
        value={formatCurrency(patrimonio)}
        sub={`Última atualização: ${new Date(carteira.ultima_atualizacao).toLocaleDateString('pt-BR')}`}
      />

      <KPICard
        label="Lucro / Prejuízo"
        value={formatCurrency(absoluto)}
        positive={isPositive}
        sub={
          <span className={isPositive ? 'positive' : 'negative'}>
            {formatPercent(percentual)} sobre custo total
          </span>
        }
      />

      <div className="kpi-card flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Alocação por Classe
        </span>
        {alocacao.length === 0 ? (
          <span className="text-slate-600 text-sm">Sem posições cadastradas</span>
        ) : (
          <div className="space-y-2">
            {alocacao.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge label={item.nome} colorKey={item.id} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(item.percentual, 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="mono text-xs text-slate-300 w-12 text-right">
                    {item.percentual.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
