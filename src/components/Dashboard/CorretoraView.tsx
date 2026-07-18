import { useState } from 'react';
import { useCarteira } from '../../context/CarteiraContext';
import {
  calcularPatrimonioPorCorretora,
  getHistoricoCorretora,
  formatCurrency,
} from '../../utils/calculations';
import { PatrimonyChart } from './PatrimonyChart';
import { Card } from '../UI/Card';

export function CorretoraView() {
  const { carteira } = useCarteira();
  const [activeTab, setActiveTab] = useState<string | null>(null);

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
  const patrimonioPorCorretora = calcularPatrimonioPorCorretora(carteira);
  const corretora = carteira.corretoras.find((c) => c.id === selectedId);
  const historico = getHistoricoCorretora(carteira, selectedId);
  const valorAtual = patrimonioPorCorretora[selectedId] ?? 0;

  return (
    <Card title="Visão por Corretora">
      {/* Tabs */}
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
          </button>
        ))}
      </div>

      {/* Corretora detail */}
      {corretora && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{corretora.nome}</span>
            <span className="mono text-lg font-bold text-slate-100">
              {formatCurrency(valorAtual)}
            </span>
          </div>
          <PatrimonyChart
            data={historico}
            title={`Histórico — ${corretora.nome}`}
            color="#a78bfa"
          />
        </div>
      )}
    </Card>
  );
}
