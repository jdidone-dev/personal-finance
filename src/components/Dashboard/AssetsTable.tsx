import { useState, useMemo } from 'react';
import { useCarteira } from '../../context/CarteiraContext';
import {
  enrichPosicoes,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '../../utils/calculations';
import { usePriceUpdater } from '../../hooks/usePriceUpdater';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import type { FiltrosTabela, PosicaoEnriquecida } from '../../types/schema';

interface ManualPriceInputProps {
  current: number;
  onConfirm: (price: number) => void;
}

function ManualPriceInput({ current, onConfirm }: ManualPriceInputProps) {
  const [value, setValue] = useState(current.toFixed(2));
  const [editing, setEditing] = useState(false);

  function handleConfirm() {
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onConfirm(parsed);
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mono text-sm text-slate-200 hover:text-sky-400 underline decoration-dotted transition-colors"
        title="Clique para editar o preço"
      >
        {formatCurrency(current)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConfirm();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-24 bg-surface-0 border border-sky-500 rounded px-2 py-1 text-xs mono text-sky-300 focus:outline-none"
      />
      <button
        onClick={handleConfirm}
        className="text-emerald-400 hover:text-emerald-300 text-xs px-1"
      >
        ✓
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-slate-500 hover:text-slate-300 text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}

function TableRow({ row, brapiToken }: { row: PosicaoEnriquecida; brapiToken?: string }) {
  const { updatePosicao, removePosicao } = useCarteira();
  const { updatePrice, getStatus, getError } = usePriceUpdater();
  const status = getStatus(row.ativo.id);
  const error = getError(row.ativo.id);
  const isPositive = row.lucroAbsoluto >= 0;

  return (
    <tr className="border-b border-slate-800/50 hover:bg-surface-2/30 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="mono text-sm font-semibold text-slate-100">{row.ativo.ticker}</span>
          <span className="text-xs text-slate-500">{row.ativo.nome}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {row.classeAtivo && <Badge label={row.classeAtivo.nome} colorKey={row.classeAtivo.id} />}
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">{row.corretora.nome}</td>
      <td className="px-4 py-3 mono text-sm text-slate-200 text-right">
        {formatNumber(row.posicao.quantidade, row.posicao.quantidade % 1 === 0 ? 0 : 4)}
      </td>
      <td className="px-4 py-3 mono text-sm text-slate-400 text-right">
        {formatCurrency(row.posicao.preco_medio)}
      </td>
      <td className="px-4 py-3 text-right">
        {row.ativo.atualizacao === 'manual' ? (
          <ManualPriceInput
            current={row.posicao.preco_atual_cache}
            onConfirm={(preco) =>
              updatePosicao(row.ativo.id, row.corretora.id, { preco_atual_cache: preco })
            }
          />
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <span className="mono text-sm text-slate-200">
              {formatCurrency(row.posicao.preco_atual_cache)}
            </span>
            {error && status === 'error' && (
              <span className="text-xs text-rose-400" title={error}>
                Erro ao atualizar
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 mono text-sm font-semibold text-slate-100 text-right">
        {formatCurrency(row.valorTotal)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span className={`mono text-sm font-medium ${isPositive ? 'positive' : 'negative'}`}>
            {formatCurrency(row.lucroAbsoluto)}
          </span>
          <span className={`text-xs ${isPositive ? 'positive' : 'negative'}`}>
            {formatPercent(row.lucroPct)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {row.ativo.atualizacao === 'automatica' && (
            <Button
              size="sm"
              variant="ghost"
              loading={status === 'loading'}
              onClick={() => updatePrice(row.ativo.id, row.ativo.ticker, brapiToken)}
              title="Buscar preço atual via BRAPI"
            >
              ↻
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => removePosicao(row.ativo.id, row.corretora.id)}
            title="Remover posição"
          >
            ×
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface AssetsTableProps {
  brapiToken?: string;
  onAddPosicao: () => void;
}

export function AssetsTable({ brapiToken, onAddPosicao }: AssetsTableProps) {
  const { carteira } = useCarteira();
  const [filtros, setFiltros] = useState<FiltrosTabela>({ classeId: null, corretoraId: null });

  const enriched = useMemo(
    () => (carteira ? enrichPosicoes(carteira) : []),
    [carteira]
  );

  const filtered = useMemo(
    () =>
      enriched.filter((row) => {
        if (filtros.classeId && row.ativo.classe_id !== filtros.classeId) return false;
        if (filtros.corretoraId && row.posicao.corretora_id !== filtros.corretoraId) return false;
        return true;
      }),
    [enriched, filtros]
  );

  if (!carteira) return null;

  return (
    <div className="bg-surface-1 rounded-xl border border-slate-700/50">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Posições ({filtered.length})
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Class filter */}
          <select
            value={filtros.classeId ?? ''}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, classeId: e.target.value || null }))
            }
            className="bg-surface-2 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="">Todas as classes</option>
            {carteira.classes_ativos.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.nome}
              </option>
            ))}
          </select>

          {/* Corretora filter */}
          <select
            value={filtros.corretoraId ?? ''}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, corretoraId: e.target.value || null }))
            }
            className="bg-surface-2 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="">Todas as corretoras</option>
            {carteira.corretoras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <Button size="sm" variant="primary" onClick={onAddPosicao}>
            + Posição
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              {['Ativo', 'Classe', 'Corretora', 'Qtd', 'Preço Médio', 'Preço Atual', 'Total', 'L/P', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right first:text-left [&:nth-child(1)]:text-left [&:nth-child(2)]:text-left [&:nth-child(3)]:text-left"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-600">
                  {enriched.length === 0
                    ? 'Nenhuma posição cadastrada. Clique em "+ Posição" para adicionar.'
                    : 'Nenhuma posição corresponde aos filtros selecionados.'}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={`${row.ativo.id}-${row.corretora.id}`}
                  row={row}
                  brapiToken={brapiToken}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
