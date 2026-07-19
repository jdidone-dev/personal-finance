import type { CarteiraSchema, ModoClasse } from '../types/schema';
import { VERSAO_SCHEMA } from '../types/schema';

export function createEmptyCarteira(): CarteiraSchema {
  return {
    versao_schema: VERSAO_SCHEMA,
    ultima_atualizacao: new Date().toISOString(),
    corretoras: [],
    classes_ativos: [
      { id: 'c1', nome: 'Ações',                  modo: 'quantidade' },
      { id: 'c2', nome: 'ETFs',                   modo: 'quantidade' },
      { id: 'c3', nome: 'Renda Fixa',             modo: 'valor'      },
      { id: 'c4', nome: 'FIIs',                   modo: 'valor'      },
      { id: 'c5', nome: 'Criptomoedas',           modo: 'quantidade' },
      { id: 'c6', nome: 'Fundos de Investimento', modo: 'valor'      },
    ],
    ativos: [],
    posicoes: [],
    historico_patrimonial: [],
    historico_diario: [],
  };
}

// IDs das classes padrão que usam modo 'valor'
const CLASSES_VALOR_IDS = new Set(['c3', 'c4', 'c6']);

function inferModoPorNome(nome: string): ModoClasse {
  const lower = nome.toLowerCase();
  if (
    lower.includes('renda fixa') ||
    lower.includes('fii') ||
    lower.includes('fundo') ||
    lower.includes('cdb') ||
    lower.includes('lca') ||
    lower.includes('lci') ||
    lower.includes('tesouro') ||
    lower.includes('debenture') ||
    lower.includes('debênture') ||
    lower.includes('cri') ||
    lower.includes('cra')
  ) {
    return 'valor';
  }
  return 'quantidade';
}

// Aplica defaults em JSONs criados antes de campos novos existirem
function migrateCarteira(carteira: CarteiraSchema): CarteiraSchema {
  let c = carteira;

  // v1.0 → v1.1: adiciona campo 'modo' nas classes e array 'historico_diario'
  const temClasseSemModo = c.classes_ativos.some((cl) => cl.modo === undefined);
  if (temClasseSemModo) {
    c = {
      ...c,
      classes_ativos: c.classes_ativos.map((cl) => {
        if (cl.modo !== undefined) return cl;
        const modo: ModoClasse = CLASSES_VALOR_IDS.has(cl.id)
          ? 'valor'
          : inferModoPorNome(cl.nome);
        return { ...cl, modo };
      }),
    };
  }

  // Garante que historico_diario existe (JSONs anteriores à v1.1 não têm)
  if (!Array.isArray((c as unknown as Record<string, unknown>).historico_diario)) {
    c = { ...c, historico_diario: [] };
  }

  return c;
}

export function validateCarteiraSchema(data: unknown): data is CarteiraSchema {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.versao_schema === 'string' &&
    typeof d.ultima_atualizacao === 'string' &&
    Array.isArray(d.corretoras) &&
    Array.isArray(d.classes_ativos) &&
    Array.isArray(d.ativos) &&
    Array.isArray(d.posicoes) &&
    Array.isArray(d.historico_patrimonial)
  );
}

export function parseCarteiraFile(file: File): Promise<CarteiraSchema> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: unknown = JSON.parse(text);
        if (!validateCarteiraSchema(data)) {
          reject(
            new Error(
              'Arquivo inválido: a estrutura do JSON não corresponde ao schema esperado.'
            )
          );
          return;
        }
        resolve(migrateCarteira(data));
      } catch {
        reject(new Error('Arquivo inválido: não foi possível parsear o JSON.'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function exportCarteiraAsJSON(carteira: CarteiraSchema): void {
  const updated: CarteiraSchema = {
    ...carteira,
    ultima_atualizacao: new Date().toISOString(),
  };

  const json = JSON.stringify(updated, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'carteira_investimentos.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
