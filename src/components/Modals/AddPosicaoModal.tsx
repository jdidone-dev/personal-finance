import React, { useState, useMemo } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { useCarteira } from '../../context/CarteiraContext';
import { getModoClasse } from '../../types/schema';

interface Props {
  open: boolean;
  onClose: () => void;
}

const initialForm = {
  ativo_id: '',
  corretora_id: '',
  quantidade: '',
  preco_medio: '',
  valor_atual: '',
};

export function AddPosicaoModal({ open, onClose }: Props) {
  const { carteira, upsertPosicao } = useCarteira();
  const [form, setForm] = useState(initialForm);

  const selectedAtivo = useMemo(
    () => carteira?.ativos.find((a) => a.id === form.ativo_id),
    [carteira, form.ativo_id]
  );

  const classeAtivo = useMemo(
    () => carteira?.classes_ativos.find((cl) => cl.id === selectedAtivo?.classe_id),
    [carteira, selectedAtivo]
  );

  const isValorMode = getModoClasse(classeAtivo) === 'valor';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ativo_id || !form.corretora_id) return;

    if (isValorMode) {
      const valor = parseFloat(form.valor_atual.replace(',', '.'));
      if (isNaN(valor) || valor < 0) return;
      upsertPosicao({
        ativo_id: form.ativo_id,
        corretora_id: form.corretora_id,
        quantidade: 1,
        preco_medio: 0,
        preco_atual_cache: valor,
      });
    } else {
      const qtd = parseFloat(form.quantidade.replace(',', '.'));
      const medio = parseFloat(form.preco_medio.replace(',', '.'));
      const atual = parseFloat(form.valor_atual.replace(',', '.'));
      if (isNaN(qtd) || isNaN(medio) || isNaN(atual)) return;
      if (qtd <= 0 || medio <= 0 || atual < 0) return;
      upsertPosicao({
        ativo_id: form.ativo_id,
        corretora_id: form.corretora_id,
        quantidade: qtd,
        preco_medio: medio,
        preco_atual_cache: atual,
      });
    }

    setForm(initialForm);
    onClose();
  }

  const isValid = isValorMode
    ? !!form.ativo_id && !!form.corretora_id && !!form.valor_atual
    : !!form.ativo_id && !!form.corretora_id && !!form.quantidade && !!form.preco_medio && !!form.valor_atual;

  if (!carteira) return null;

  return (
    <Modal open={open} onClose={onClose} title="Adicionar / Atualizar Posição">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Ativo</label>
          <select
            value={form.ativo_id}
            onChange={(e) => setForm((f) => ({ ...f, ativo_id: e.target.value }))}
            className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="">Selecione o ativo</option>
            {carteira.ativos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.ticker} — {a.nome}
              </option>
            ))}
          </select>
          {carteira.ativos.length === 0 && (
            <p className="text-xs text-amber-500">Nenhum ativo cadastrado. Adicione um ativo primeiro.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Corretora / Custodiante</label>
          <select
            value={form.corretora_id}
            onChange={(e) => setForm((f) => ({ ...f, corretora_id: e.target.value }))}
            className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="">Selecione a corretora</option>
            {carteira.corretoras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {isValorMode ? (
          // Modo valor: apenas o saldo atual
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Valor Atual da Posição (R$)</label>
            <input
              autoFocus
              type="number"
              step="any"
              min="0"
              value={form.valor_atual}
              onChange={(e) => setForm((f) => ({ ...f, valor_atual: e.target.value }))}
              placeholder="10500.00"
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-slate-500">
              Informe o saldo atual desta posição (resgate + rendimentos acumulados).
            </p>
          </div>
        ) : (
          // Modo quantidade: campos completos
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Quantidade</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.quantidade}
                onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
                placeholder="100"
                className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Preço Médio (R$)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.preco_medio}
                onChange={(e) => setForm((f) => ({ ...f, preco_medio: e.target.value }))}
                placeholder="35.50"
                className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {selectedAtivo?.atualizacao === 'manual' ? 'Preço Atual (R$)' : 'Cache Atual (R$)'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.valor_atual}
                onChange={(e) => setForm((f) => ({ ...f, valor_atual: e.target.value }))}
                placeholder="38.20"
                className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={!isValid}>
            Salvar Posição
          </Button>
        </div>
      </form>
    </Modal>
  );
}
