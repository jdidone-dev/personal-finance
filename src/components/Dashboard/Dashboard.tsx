import { useState } from 'react';
import { useCarteira } from '../../context/CarteiraContext';
import { getHistoricoGeral, getCurrentAnoMes, calcularPatrimonioTotal, formatCurrency } from '../../utils/calculations';
import { KPICards } from './KPICards';
import { PatrimonyChart } from './PatrimonyChart';
import { CorretoraView } from './CorretoraView';
import { AssetsTable } from './AssetsTable';
import { AddCorretoraModal } from '../Modals/AddCorretoraModal';
import { AddAtivoModal } from '../Modals/AddAtivoModal';
import { AddPosicaoModal } from '../Modals/AddPosicaoModal';
import { ConfirmModal } from '../Modals/ConfirmModal';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import type { ApiTokens } from '../../hooks/usePriceUpdater';

type ActiveModal = 'corretora' | 'ativo' | 'posicao' | 'consolidar' | null;

function ApiSettings({
  tokens,
  onChange,
}: {
  tokens: ApiTokens;
  onChange: (t: ApiTokens) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasUS = !!tokens.finnhub;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
        title="Configurar tokens de API"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        APIs
        {hasUS && (
          <span className="text-emerald-500 text-xs">🇺🇸</span>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-7 w-80 bg-surface-1 border border-slate-700 rounded-xl p-4 shadow-2xl z-20 space-y-4">
          {/* BRAPI */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">🇧🇷 BRAPI</span>
              <span className="text-xs text-slate-600">brapi.dev</span>
            </div>
            <input
              type="text"
              value={tokens.brapi ?? ''}
              onChange={(e) => onChange({ ...tokens, brapi: e.target.value || undefined })}
              placeholder="Token opcional (mais limites)"
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-1.5 text-xs mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-slate-600">Sem token: 15 req/min. Com token gratuito: 120 req/min.</p>
          </div>

          <div className="border-t border-slate-700" />

          {/* Finnhub */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">🇺🇸 Finnhub</span>
              <span className="text-xs text-slate-600">finnhub.io</span>
            </div>
            <input
              type="text"
              value={tokens.finnhub ?? ''}
              onChange={(e) => onChange({ ...tokens, finnhub: e.target.value || undefined })}
              placeholder="Token obrigatório para ativos US"
              className="w-full bg-surface-0 border border-slate-600 rounded-lg px-3 py-1.5 text-xs mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <p className="text-xs text-slate-600">
              Gratuito em finnhub.io → 60 req/min. Necessário para Stocks e ETFs americanos.
            </p>
          </div>

          <p className="text-xs text-slate-700">Tokens ficam apenas na memória da sessão.</p>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { carteira, exportCarteira, consolidarMes } = useCarteira();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [tokens, setTokens] = useState<ApiTokens>({
    finnhub: import.meta.env.VITE_FINNHUB_TOKEN || undefined,
    brapi: import.meta.env.VITE_BRAPI_TOKEN || undefined,
  });

  if (!carteira) return null;

  const historicoGeral = getHistoricoGeral(carteira);
  const patrimonioTotal = calcularPatrimonioTotal(carteira);
  const anoMesAtual = getCurrentAnoMes();

  const hasUSAtivos = carteira.ativos.some(
    (a) => a.mercado === 'US' && a.atualizacao === 'automatica'
  );

  function handleConsolidar() {
    consolidarMes();
    setActiveModal(null);
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-0/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-600/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-200 hidden sm:inline">
              Gestão de Investimentos
            </span>
            <span className="mono text-xs text-slate-500 hidden md:inline">
              {formatCurrency(patrimonioTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ApiSettings tokens={tokens} onChange={setTokens} />
            <Button size="sm" variant="ghost" onClick={() => setActiveModal('corretora')}>
              + Corretora
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setActiveModal('ativo')}>
              + Ativo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setActiveModal('consolidar')}
              title={`Congelar snapshot de ${anoMesAtual} no histórico`}>
              Consolidar {anoMesAtual}
            </Button>
            <Button size="sm" variant="primary" onClick={exportCarteira}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar / Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Aviso de moeda mista */}
      {hasUSAtivos && !tokens.finnhub && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-lg bg-sky-950/40 border border-sky-800/40 px-4 py-2.5 text-xs text-sky-300 flex items-center gap-2">
            <span>ℹ</span>
            Ativos americanos usarão <strong>Yahoo Finance</strong> (gratuito, sem token).
            Se houver erro de CORS, configure o token <strong>Finnhub</strong> em ⚙ APIs como alternativa confiável.
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="space-y-4">
          <KPICards />
          <Card title="Evolução Patrimonial Geral">
            <PatrimonyChart data={historicoGeral} title="" />
          </Card>
        </section>

        <section>
          <CorretoraView />
        </section>

        <section>
          <AssetsTable tokens={tokens} onAddPosicao={() => setActiveModal('posicao')} />
        </section>
      </main>

      <AddCorretoraModal open={activeModal === 'corretora'} onClose={() => setActiveModal(null)} />
      <AddAtivoModal open={activeModal === 'ativo'} onClose={() => setActiveModal(null)} />
      <AddPosicaoModal open={activeModal === 'posicao'} onClose={() => setActiveModal(null)} />
      <ConfirmModal
        open={activeModal === 'consolidar'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConsolidar}
        title="Consolidar Mês Atual"
        message={`Isso vai gravar (ou sobrescrever) o snapshot de ${anoMesAtual} no histórico patrimonial com os valores atuais. Esta operação é idempotente — pode ser repetida quantas vezes necessário dentro do mesmo mês. Continuar?`}
        confirmLabel="Consolidar"
        variant="primary"
      />
    </div>
  );
}
