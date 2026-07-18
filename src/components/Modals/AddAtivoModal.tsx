import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { useCarteira } from '../../context/CarteiraContext';
import type { TipoAtualizacao } from '../../types/schema';

interface Props {
  open: boolean;
  onClose: () => void;
}

const initialState = {
  ticker: '',
  nome: '',
  classe_id: '',
  atualizacao: 'automatica' as TipoAtualizacao,
};

export function AddAtivoModal({ open, onClose }: Props) {
  const { carteira, addAtivo } = useCarteira();
  const [form, setForm] = useState(initialState);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ticker.trim() || !form.nome.trim() || !form.classe_id) return;
    addAtivo({
      ticker: form.ticker.toUpperCase().trim(),
      nome: form.nome.trim(),
      classe_id: form.classe_id,
      atualizacao: form.atualizacao,
    });
    setForm(initialState);
    onClose();
  }

  if (!carteira) return null;

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Ativo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Ticker</label>
            <input
              autoFocus
              type="text"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder="Ex: PETR4"
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Petrobras PN"
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Classe</label>
          <select
            value={form.classe_id}
            onChange={(e) => setForm((f) => ({ ...f, classe_id: e.target.value }))}
            className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="">Selecione a classe</option>
            {carteira.classes_ativos.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Atualização de Preço</label>
          <div className="grid grid-cols-2 gap-2">
            {(['automatica', 'manual'] as TipoAtualizacao[]).map((tipo) => (
              <label
                key={tipo}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors',
                  form.atualizacao === tipo
                    ? 'border-sky-500 bg-sky-950/50 text-sky-300'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="atualizacao"
                  value={tipo}
                  checked={form.atualizacao === tipo}
                  onChange={() => setForm((f) => ({ ...f, atualizacao: tipo }))}
                  className="accent-sky-500"
                />
                {tipo === 'automatica' ? 'Automática (BRAPI)' : 'Manual (entrada direta)'}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.ticker.trim() || !form.nome.trim() || !form.classe_id}
          >
            Adicionar Ativo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
