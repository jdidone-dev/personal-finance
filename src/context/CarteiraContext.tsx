import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CarteiraSchema, Corretora, ClasseAtivo, Ativo, Posicao } from '../types/schema';
import { createEmptyCarteira, exportCarteiraAsJSON } from '../utils/fileHandler';
import { getCurrentAnoMes, getCurrentData, enrichPosicoes } from '../utils/calculations';

interface CarteiraState {
  carteira: CarteiraSchema | null;
}

type CarteiraAction =
  | { type: 'LOAD_CARTEIRA'; payload: CarteiraSchema }
  | { type: 'NEW_CARTEIRA' }
  | { type: 'ADD_CORRETORA'; payload: Omit<Corretora, 'id'> }
  | { type: 'ADD_CLASSE_ATIVO'; payload: Omit<ClasseAtivo, 'id'> }
  | { type: 'ADD_ATIVO'; payload: Omit<Ativo, 'id'> }
  | { type: 'UPSERT_POSICAO'; payload: Posicao }
  | { type: 'UPDATE_POSICAO'; payload: { ativo_id: string; corretora_id: string; updates: Partial<Posicao> } }
  | { type: 'UPDATE_PRECO_CACHE'; payload: { ativo_id: string; preco: number } }
  | { type: 'CONSOLIDAR_MES'; payload: { usdBrlRate: number } }
  | { type: 'CONSOLIDAR_DIA'; payload: { usdBrlRate: number } }
  | { type: 'REMOVE_POSICAO'; payload: { ativo_id: string; corretora_id: string } }
  | { type: 'REMOVE_ATIVO'; payload: string }
  | { type: 'REMOVE_CORRETORA'; payload: string };

function reducer(state: CarteiraState, action: CarteiraAction): CarteiraState {
  const c = state.carteira;

  switch (action.type) {
    case 'LOAD_CARTEIRA':
      return { carteira: action.payload };

    case 'NEW_CARTEIRA':
      return { carteira: createEmptyCarteira() };

    case 'ADD_CORRETORA':
      if (!c) return state;
      return {
        carteira: {
          ...c,
          corretoras: [...c.corretoras, { ...action.payload, id: uuidv4() }],
        },
      };

    case 'ADD_CLASSE_ATIVO':
      if (!c) return state;
      return {
        carteira: {
          ...c,
          classes_ativos: [...c.classes_ativos, { ...action.payload, id: uuidv4() }],
        },
      };

    case 'ADD_ATIVO':
      if (!c) return state;
      return {
        carteira: {
          ...c,
          ativos: [...c.ativos, { ...action.payload, id: uuidv4() }],
        },
      };

    case 'UPSERT_POSICAO': {
      if (!c) return state;
      const idx = c.posicoes.findIndex(
        (p) =>
          p.ativo_id === action.payload.ativo_id &&
          p.corretora_id === action.payload.corretora_id
      );
      const posicoes =
        idx >= 0
          ? c.posicoes.map((p, i) => (i === idx ? action.payload : p))
          : [...c.posicoes, action.payload];
      return { carteira: { ...c, posicoes } };
    }

    case 'UPDATE_POSICAO': {
      if (!c) return state;
      const { ativo_id, corretora_id, updates } = action.payload;
      return {
        carteira: {
          ...c,
          posicoes: c.posicoes.map((p) =>
            p.ativo_id === ativo_id && p.corretora_id === corretora_id
              ? { ...p, ...updates }
              : p
          ),
        },
      };
    }

    case 'UPDATE_PRECO_CACHE': {
      if (!c) return state;
      const { ativo_id, preco } = action.payload;
      return {
        carteira: {
          ...c,
          posicoes: c.posicoes.map((p) =>
            p.ativo_id === ativo_id ? { ...p, preco_atual_cache: preco } : p
          ),
        },
      };
    }

    case 'CONSOLIDAR_MES': {
      if (!c) return state;
      const anoMes = getCurrentAnoMes();
      const { usdBrlRate } = action.payload;

      // Agrega por corretora convertendo posições USD para BRL pela cotação do dia.
      const porCorretora: Record<string, number> = {};
      enrichPosicoes(c).forEach((p) => {
        const id = p.posicao.corretora_id;
        const valor = p.ativo.mercado === 'US' ? p.valorTotal * usdBrlRate : p.valorTotal;
        porCorretora[id] = (porCorretora[id] ?? 0) + valor;
      });

      const novasEntradas = Object.entries(porCorretora).map(
        ([corretora_id, valor_total]) => ({ ano_mes: anoMes, corretora_id, valor_total })
      );

      const historicoPrevio = c.historico_patrimonial.filter((h) => h.ano_mes !== anoMes);

      return {
        carteira: {
          ...c,
          historico_patrimonial: [...historicoPrevio, ...novasEntradas].sort((a, b) =>
            a.ano_mes.localeCompare(b.ano_mes)
          ),
        },
      };
    }

    case 'CONSOLIDAR_DIA': {
      if (!c) return state;
      const data = getCurrentData();
      const { usdBrlRate } = action.payload;

      const porCorretora: Record<string, number> = {};
      enrichPosicoes(c).forEach((p) => {
        const id = p.posicao.corretora_id;
        const valor = p.ativo.mercado === 'US' ? p.valorTotal * usdBrlRate : p.valorTotal;
        porCorretora[id] = (porCorretora[id] ?? 0) + valor;
      });

      const novasEntradas = Object.entries(porCorretora).map(
        ([corretora_id, valor_total]) => ({ data, corretora_id, valor_total })
      );

      // Substitui entradas do mesmo dia (idempotente)
      const historicoPrevio = c.historico_diario.filter((h) => h.data !== data);

      return {
        carteira: {
          ...c,
          historico_diario: [...historicoPrevio, ...novasEntradas].sort((a, b) =>
            a.data.localeCompare(b.data)
          ),
        },
      };
    }

    case 'REMOVE_POSICAO': {
      if (!c) return state;
      const { ativo_id, corretora_id } = action.payload;
      return {
        carteira: {
          ...c,
          posicoes: c.posicoes.filter(
            (p) => !(p.ativo_id === ativo_id && p.corretora_id === corretora_id)
          ),
        },
      };
    }

    case 'REMOVE_ATIVO':
      if (!c) return state;
      return {
        carteira: {
          ...c,
          ativos: c.ativos.filter((a) => a.id !== action.payload),
          posicoes: c.posicoes.filter((p) => p.ativo_id !== action.payload),
        },
      };

    case 'REMOVE_CORRETORA':
      if (!c) return state;
      return {
        carteira: {
          ...c,
          corretoras: c.corretoras.filter((cr) => cr.id !== action.payload),
          posicoes: c.posicoes.filter((p) => p.corretora_id !== action.payload),
        },
      };

    default:
      return state;
  }
}

interface CarteiraContextType {
  carteira: CarteiraSchema | null;
  loadCarteira: (data: CarteiraSchema) => void;
  createNewCarteira: () => void;
  exportCarteira: () => void;
  addCorretora: (nome: string) => void;
  addClasseAtivo: (nome: string) => void;
  addAtivo: (ativo: Omit<Ativo, 'id'>) => void;
  upsertPosicao: (posicao: Posicao) => void;
  updatePosicao: (ativo_id: string, corretora_id: string, updates: Partial<Posicao>) => void;
  updatePrecoCache: (ativo_id: string, preco: number) => void;
  consolidarMes: (usdBrlRate: number) => void;
  consolidarDia: (usdBrlRate: number) => void;
  removePosicao: (ativo_id: string, corretora_id: string) => void;
  removeAtivo: (ativo_id: string) => void;
  removeCorretora: (corretora_id: string) => void;
}

const CarteiraContext = createContext<CarteiraContextType | null>(null);

export function CarteiraProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { carteira: null });

  const loadCarteira = useCallback((data: CarteiraSchema) => {
    dispatch({ type: 'LOAD_CARTEIRA', payload: data });
  }, []);

  const createNewCarteira = useCallback(() => {
    dispatch({ type: 'NEW_CARTEIRA' });
  }, []);

  const exportCarteira = useCallback(() => {
    if (state.carteira) exportCarteiraAsJSON(state.carteira);
  }, [state.carteira]);

  const addCorretora = useCallback((nome: string) => {
    dispatch({ type: 'ADD_CORRETORA', payload: { nome } });
  }, []);

  const addClasseAtivo = useCallback((nome: string) => {
    dispatch({ type: 'ADD_CLASSE_ATIVO', payload: { nome } });
  }, []);

  const addAtivo = useCallback((ativo: Omit<Ativo, 'id'>) => {
    dispatch({ type: 'ADD_ATIVO', payload: ativo });
  }, []);

  const upsertPosicao = useCallback((posicao: Posicao) => {
    dispatch({ type: 'UPSERT_POSICAO', payload: posicao });
  }, []);

  const updatePosicao = useCallback(
    (ativo_id: string, corretora_id: string, updates: Partial<Posicao>) => {
      dispatch({ type: 'UPDATE_POSICAO', payload: { ativo_id, corretora_id, updates } });
    },
    []
  );

  const updatePrecoCache = useCallback((ativo_id: string, preco: number) => {
    dispatch({ type: 'UPDATE_PRECO_CACHE', payload: { ativo_id, preco } });
  }, []);

  const consolidarMes = useCallback((usdBrlRate: number) => {
    dispatch({ type: 'CONSOLIDAR_MES', payload: { usdBrlRate } });
  }, []);

  const consolidarDia = useCallback((usdBrlRate: number) => {
    dispatch({ type: 'CONSOLIDAR_DIA', payload: { usdBrlRate } });
  }, []);

  const removePosicao = useCallback((ativo_id: string, corretora_id: string) => {
    dispatch({ type: 'REMOVE_POSICAO', payload: { ativo_id, corretora_id } });
  }, []);

  const removeAtivo = useCallback((ativo_id: string) => {
    dispatch({ type: 'REMOVE_ATIVO', payload: ativo_id });
  }, []);

  const removeCorretora = useCallback((corretora_id: string) => {
    dispatch({ type: 'REMOVE_CORRETORA', payload: corretora_id });
  }, []);

  return (
    <CarteiraContext.Provider
      value={{
        carteira: state.carteira,
        loadCarteira,
        createNewCarteira,
        exportCarteira,
        addCorretora,
        addClasseAtivo,
        addAtivo,
        upsertPosicao,
        updatePosicao,
        updatePrecoCache,
        consolidarMes,
        consolidarDia,
        removePosicao,
        removeAtivo,
        removeCorretora,
      }}
    >
      {children}
    </CarteiraContext.Provider>
  );
}

export function useCarteira(): CarteiraContextType {
  const ctx = useContext(CarteiraContext);
  if (!ctx) throw new Error('useCarteira must be used inside CarteiraProvider');
  return ctx;
}
