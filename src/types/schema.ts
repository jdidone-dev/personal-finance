export type TipoAtualizacao = 'automatica' | 'manual';
export type Mercado = 'BR' | 'US';

export interface Corretora {
  id: string;
  nome: string;
}

export type ModoClasse = 'quantidade' | 'valor';

export interface ClasseAtivo {
  id: string;
  nome: string;
  modo?: ModoClasse; // ausente = 'quantidade' (compatibilidade com JSONs antigos)
}

export interface Ativo {
  id: string;
  ticker: string;
  nome: string;
  classe_id: string;
  atualizacao: TipoAtualizacao;
  mercado?: Mercado; // ausente = 'BR' (retrocompatibilidade)
}

export interface Posicao {
  ativo_id: string;
  corretora_id: string;
  quantidade: number;
  preco_medio: number;
  preco_atual_cache: number;
}

export interface HistoricoPatrimonial {
  ano_mes: string;
  corretora_id: string;
  valor_total: number;
}

export const VERSAO_SCHEMA = '1.0' as const;

export interface CarteiraSchema {
  versao_schema: string;
  ultima_atualizacao: string;
  corretoras: Corretora[];
  classes_ativos: ClasseAtivo[];
  ativos: Ativo[];
  posicoes: Posicao[];
  historico_patrimonial: HistoricoPatrimonial[];
}

export interface PosicaoEnriquecida {
  posicao: Posicao;
  ativo: Ativo;
  corretora: Corretora;
  classeAtivo: ClasseAtivo | undefined;
  valorTotal: number;
  custoTotal: number;
  lucroAbsoluto: number;
  lucroPct: number;
  isValorMode: boolean;
}

export function getModoClasse(classe?: ClasseAtivo): ModoClasse {
  return classe?.modo ?? 'quantidade';
}

export interface FiltrosTabela {
  classeId: string | null;
  corretoraId: string | null;
}
