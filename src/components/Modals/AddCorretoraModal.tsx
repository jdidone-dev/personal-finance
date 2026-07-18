import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { useCarteira } from '../../context/CarteiraContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddCorretoraModal({ open, onClose }: Props) {
  const { addCorretora } = useCarteira();
  const [nome, setNome] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    addCorretora(trimmed);
    setNome('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Corretora">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Nome da Corretora</label>
          <input
            autoFocus
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: XP Investimentos"
            className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={!nome.trim()}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
