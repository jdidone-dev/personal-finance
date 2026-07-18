import React, { useRef, useState } from 'react';
import { parseCarteiraFile } from '../../utils/fileHandler';
import { useCarteira } from '../../context/CarteiraContext';
import { Button } from '../UI/Button';

export function FileHandler() {
  const { loadCarteira, createNewCarteira } = useCarteira();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const carteira = await parseCarteiraFile(file);
      loadCarteira(carteira);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600/20 border border-sky-500/30 mb-2">
            <svg
              className="w-8 h-8 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão de Investimentos</h1>
          <p className="text-sm text-slate-400">
            Consolidação de carteira 100% client-side — seus dados ficam no seu dispositivo.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Import */}
          <div className="bg-surface-1 rounded-xl border border-slate-700/50 p-5 space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-200">
                Importar Carteira Existente
              </h2>
              <p className="text-xs text-slate-500">
                Carregue seu arquivo <code className="text-sky-400">carteira_investimentos.json</code> para
                continuar de onde parou.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full justify-center"
              loading={loading}
              onClick={() => inputRef.current?.click()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Importar Arquivo de Carteira (.json)
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {error && (
              <div className="rounded-lg bg-rose-950/60 border border-rose-800/50 px-4 py-3 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* New wallet */}
          <div className="bg-surface-1 rounded-xl border border-slate-700/50 p-5 space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-200">Iniciar Nova Carteira</h2>
              <p className="text-xs text-slate-500">
                Comece do zero com uma carteira vazia. Lembre-se de exportar ao final da sessão.
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={createNewCarteira}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Iniciar Nova Carteira do Zero
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Nenhum dado é enviado a servidores. Tudo roda no seu navegador.
        </p>
      </div>
    </div>
  );
}
