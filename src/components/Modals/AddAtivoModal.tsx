import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { useCarteira } from '../../context/CarteiraContext';
import type { TipoAtualizacao, Mercado } from '../../types/schema';
import { getModoClasse } from '../../types/schema';

interface Props {
  open: boolean;
  onClose: () => void;
}

const initialState = {
  ticker: '',
  nome: '',
  classe_id: '',
  atualizacao: 'automatica' as TipoAtualizacao,
  mercado: 'BR' as Mercado,
};

export function AddAtivoModal({ open, onClose }: Props) {
  const { carteira, addAtivo } = useCarteira();
  const [form, setForm] = useState(initialState);

  const classeAtivo = carteira?.classes_ativos.find((cl) => cl.id === form.classe_id);
  const isValorMode = getModoClasse(classeAtivo) === 'valor';

  useEffect(() => {
    if (isValorMode) {
      setForm((f) => ({ ...f, atualizacao: 'manual' }));
    }
  }, [isValorMode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ticker.trim() || !form.nome.trim() || !form.classe_id) return;
    addAtivo({
      ticker: form.ticker.toUpperCase().trim(),
      nome: form.nome.trim(),
      classe_id: form.classe_id,
      atualizacao: isValorMode ? 'manual' : form.atualizacao,
      mercado: form.atualizacao === 'automatica' && !isValorMode ? form.mercado : undefined,
    });
    setForm(initialState);
    onClose();
  }

  if (!carteira) return null;

  const showMercadoSelector = form.atualizacao === 'automatica' && !isValorMode;

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Ativo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Ticker / Código</label>
            <input
              autoFocus
              type="text"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
              placeholder={form.mercado === 'US' ? 'Ex: AAPL, VOO' : 'Ex: PETR4'}
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder={form.mercado === 'US' ? 'Ex: Apple Inc.' : 'Ex: Petrobras PN'}
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

        {isValorMode ? (
          <div className="rounded-lg bg-amber-950/40 border border-amber-800/40 px-4 py-3 text-xs text-amber-300">
            Esta classe registra apenas o <strong>valor atual da posição</strong> — sem quantidade
            nem preço médio. A atualização será sempre manual.
          </div>
        ) : (
          <>
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
                    {tipo === 'automatica' ? 'Automática' : 'Manual'}
                  </label>
                ))}
              </div>
            </div>

            {showMercadoSelector && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Mercado</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'BR', label: '🇧🇷 Brasil', sub: 'via BRAPI' },
                    { value: 'US', label: '🇺🇸 EUA', sub: 'via Finnhub' },
                  ] as { value: Mercado; label: string; sub: string }[]).map((m) => (
                    <label
                      key={m.value}
                      className={[
                        'flex flex-col px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors',
                        form.mercado === m.value
                          ? 'border-sky-500 bg-sky-950/50 text-sky-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mercado"
                          value={m.value}
                          checked={form.mercado === m.value}
                          onChange={() => setForm((f) => ({ ...f, mercado: m.value }))}
                          className="accent-sky-500"
                        />
                        <span>{m.label}</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-5">{m.sub}</span>
                    </label>
                  ))}
                </div>
                {form.mercado === 'US' && (
                  <p className="text-xs text-slate-500">
                    Preços cotados em <strong className="text-slate-400">USD</strong>. Configure
                    o token Finnhub nas ⚙ configurações do cabeçalho.
                  </p>
                )}
              </div>
            )}
          </>
        )}

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
