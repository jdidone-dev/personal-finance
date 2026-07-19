import { useState } from 'react';
import { useCarteira } from '../../context/CarteiraContext';
import {
  calcularResumoCorretoras,
  getHistoricoCorretora,
  getHistoricoCorretoraDiario,
  formatCurrency,
  formatUSD,
} from '../../utils/calculations';
import { PatrimonyChart } from './PatrimonyChart';
import { Card } from '../UI/Card';

interface CorretoraViewProps {
  usdBrlRate: number | null;
  rateLoading: boolean;
}

type ModoHistorico = 'mensal' | 'diario';

export function CorretoraView({ usdBrlRate, rateLoading }: CorretoraViewProps) {
  const { carteira } = useCarteira();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [modoHistorico, setModoHistorico] = useState<ModoHistorico>('diario');

  if (!carteira || carteira.corretoras.length === 0) {
    return (
      <Card title="Visão por Corretora">
        <p className="text-sm text-slate-500">
          Nenhuma corretora cadastrada. Adicione uma corretora para começar.
        </p>
      </Card>
    );
  }

  const selectedId = activeTab ?? carteira.corretoras[0].id;
  const corretora = carteira.corretoras.find((c) => c.id === selectedId);

  const effectiveRate = usdBrlRate ?? 1;
  const resumoPorCorretora = calcularResumoCorretoras(carteira, effectiveRate);
  const resumo = resumoPorCorretora.get(selectedId);

  const isPureUSD = resumo?.hasUSAssets && resumo.valorBRL === 0;
  const chartCurrency = isPureUSD ? 'USD' : 'BRL';

  const historicoMensal = getHistoricoCorretora(carteira, selectedId);
  const historicoDiario = getHistoricoCorretoraDiario(carteira, selectedId);

  // Fallback: se o modo preferido não tem dados, usa o outro
  const historicoAtivo =
    modoHistorico === 'diario'
      ? (historicoDiario.length > 0 ? historicoDiario : historicoMensal)
      : (historicoMensal.length > 0 ? historicoMensal : historicoDiario);

  const modoEfetivo: ModoHistorico =
    modoHistorico === 'diario'
      ? (historicoDiario.length > 0 ? 'diario' : 'mensal')
      : (historicoMensal.length > 0 ? 'mensal' : 'diario');

  return (
    <Card title="Visão por Corretora">
      {/* Tabs de corretoras */}
      <div className="flex flex-wrap gap-2 mb-5">
        {carteira.corretoras.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              c.id === selectedId ? 'tab-active' : 'tab-inactive',
            ].join(' ')}
          >
            {c.nome}
            {resumoPorCorretora.get(c.id)?.hasUSAssets && (
              <span className="ml-1.5 text-xs">🇺🇸</span>
            )}
          </button>
        ))}
      </div>

      {/* Detalhe da corretora */}
      {corretora && resumo && (
        <div className="space-y-4">
          {/* Valor atual */}
          {resumo.hasUSAssets ? (
            <div className="space-y-2">
              {resumo.valorBRL > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Posições em BRL</span>
                  <span className="mono text-sm text-slate-300">
                    {formatCurrency(resumo.valorBRL)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Posições em USD</span>
                <div className="text-right">
                  <span className="mono text-sm text-slate-300">
                    {formatUSD(resumo.valorUSD)}
                  </span>
                  {usdBrlRate !== null ? (
                    <div className="text-xs text-slate-600 mono">
                      ≈ {formatCurrency(resumo.valorUSD * usdBrlRate)}
                    </div>
                  ) : rateLoading ? (
                    <div className="text-xs text-slate-600">convertendo…</div>
                  ) : (
                    <div className="text-xs text-slate-600">cotação indisponível</div>
                  )}
                </div>
              </div>

              {usdBrlRate !== null && (
                <div className="text-xs text-slate-700 text-right">
                  USD 1 = <span className="mono">{formatCurrency(usdBrlRate)}</span>{' '}
                  (cotação do dia)
                </div>
              )}

              <div className="border-t border-slate-700/60 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Total (em BRL)</span>
                <span className="mono text-lg font-bold text-slate-100">
                  {usdBrlRate !== null
                    ? formatCurrency(resumo.totalBRL)
                    : rateLoading
                      ? '…'
                      : formatCurrency(resumo.valorBRL)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{corretora.nome}</span>
              <span className="mono text-lg font-bold text-slate-100">
                {formatCurrency(resumo.totalBRL)}
              </span>
            </div>
          )}

          {/* Toggle de período do gráfico */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 uppercase tracking-wider">Histórico</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
              <button
                onClick={() => setModoHistorico('diario')}
                className={[
                  'px-3 py-1 transition-colors',
                  modoEfetivo === 'diario'
                    ? 'bg-slate-700 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
              >
                Diário
                {historicoDiario.length > 0 && (
                  <span className="ml-1 text-slate-600">({historicoDiario.length})</span>
                )}
              </button>
              <button
                onClick={() => setModoHistorico('mensal')}
                className={[
                  'px-3 py-1 border-l border-slate-700 transition-colors',
                  modoEfetivo === 'mensal'
                    ? 'bg-slate-700 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
              >
                Mensal
                {historicoMensal.length > 0 && (
                  <span className="ml-1 text-slate-600">({historicoMensal.length})</span>
                )}
              </button>
            </div>
          </div>

          <PatrimonyChart
            data={historicoAtivo}
            title=""
            color="#a78bfa"
            currency={chartCurrency}
          />
        </div>
      )}
    </Card>
  );
}
