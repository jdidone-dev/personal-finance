import type { CarteiraSchema } from '../types/schema';
import { VERSAO_SCHEMA } from '../types/schema';

export function createEmptyCarteira(): CarteiraSchema {
  return {
    versao_schema: VERSAO_SCHEMA,
    ultima_atualizacao: new Date().toISOString(),
    corretoras: [],
    classes_ativos: [
      { id: 'c1', nome: 'Ações' },
      { id: 'c2', nome: 'ETFs' },
      { id: 'c3', nome: 'Renda Fixa' },
      { id: 'c4', nome: 'FIIs' },
      { id: 'c5', nome: 'Criptomoedas' },
    ],
    ativos: [],
    posicoes: [],
    historico_patrimonial: [],
  };
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
        resolve(data);
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
