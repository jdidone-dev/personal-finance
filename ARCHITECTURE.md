# Arquitetura — Sistema de Gestão Financeira Pessoal

## Árvore de Diretórios

```
personal-finance/
├── index.html                        # Entry point HTML
├── package.json
├── vite.config.ts                    # Build config: base='./', chunking
├── tsconfig.json
├── tailwind.config.js                # Dark palette surface-0..3
├── postcss.config.js
├── .gitignore
│
├── deploy/
│   ├── deploy-aws.sh                 # S3 + public policy + website hosting
│   └── deploy-azure.sh              # Storage Account + $web container
│
└── src/
    ├── main.tsx                      # React root mount
    ├── App.tsx                       # Router: FileHandler | Dashboard
    ├── index.css                     # Tailwind + global tokens
    │
    ├── types/
    │   └── schema.ts                 # Interfaces que mapeiam o JSON schema
    │
    ├── utils/
    │   ├── calculations.ts           # Funções puras: patrimônio, L/P, alocação
    │   ├── fileHandler.ts            # FileReader import + Blob export
    │   └── priceService.ts           # BRAPI fetch + PriceFetchError
    │
    ├── context/
    │   └── CarteiraContext.tsx       # useReducer + Provider + useCarteira()
    │
    ├── hooks/
    │   └── usePriceUpdater.ts        # Status/loading por ativo para BRAPI
    │
    └── components/
        ├── UI/
        │   ├── Button.tsx            # Variantes: primary|secondary|danger|ghost
        │   ├── Card.tsx              # Container com title + action slot
        │   ├── Badge.tsx             # Cor determinística por hash do id
        │   └── Modal.tsx             # Overlay com ESC + click-outside
        │
        ├── FileHandler/
        │   └── FileHandler.tsx       # Tela de bloqueio: import | new wallet
        │
        ├── Dashboard/
        │   ├── Dashboard.tsx         # Layout das 3 zonas + header sticky
        │   ├── KPICards.tsx          # Patrimônio, L/P, alocação por classe
        │   ├── PatrimonyChart.tsx    # Recharts LineChart responsivo
        │   ├── CorretoraView.tsx     # Tabs por corretora + gráfico dedicado
        │   └── AssetsTable.tsx       # Tabela filtrável + preço manual inline
        │
        └── Modals/
            ├── AddCorretoraModal.tsx
            ├── AddAtivoModal.tsx
            ├── AddPosicaoModal.tsx
            └── ConfirmModal.tsx      # Consolidar mês (ação idempotente)
```

---

## Schema TypeScript → JSON

```typescript
// src/types/schema.ts

interface CarteiraSchema {
  versao_schema: string;         // "1.0"
  ultima_atualizacao: string;    // ISO 8601
  corretoras: Corretora[];
  classes_ativos: ClasseAtivo[];
  ativos: Ativo[];
  posicoes: Posicao[];
  historico_patrimonial: HistoricoPatrimonial[];
}

interface Corretora        { id: string; nome: string }
interface ClasseAtivo      { id: string; nome: string }
interface Ativo            { id: string; ticker: string; nome: string; classe_id: string; atualizacao: 'automatica' | 'manual' }
interface Posicao          { ativo_id: string; corretora_id: string; quantidade: number; preco_medio: number; preco_atual_cache: number }
interface HistoricoPatrimonial { ano_mes: string; corretora_id: string; valor_total: number }
```

---

## Fluxo de Dados

```
FileReader API ──► parseCarteiraFile() ──► validateCarteiraSchema()
                                                │
                                          loadCarteira()
                                                │
                                       CarteiraContext (useReducer)
                                       ┌────────┴────────┐
                               UI Components         Blob Export
                               (read state)     exportCarteiraAsJSON()
```

---

## Princípios Aplicados

| Princípio       | Implementação                                                              |
|-----------------|----------------------------------------------------------------------------|
| **SRP**         | `calculations.ts` só calcula; `fileHandler.ts` só faz I/O                 |
| **OCP**         | Novos tipos de ativo não exigem mudança no contexto — apenas no schema     |
| **Imutabilidade** | Reducer retorna sempre novos objetos; sem mutação direta de estado       |
| **Pure functions** | Todas as funções de cálculo são puras e testáveis em isolamento         |
| **Separação UI/lógica** | Context não importa nenhum componente; componentes não calculam  |
| **Cache de preços** | `preco_atual_cache` persiste no JSON; BRAPI só chamada sob demanda     |
| **Histórico imutável** | Consolidar mês sobrescreve apenas o mês corrente, nunca o passado   |

---

## Build e Deploy

### Build

```bash
cd personal-finance
npm install
npm run build       # gera /dist otimizado com chunks separados
```

### AWS S3

```bash
chmod +x deploy/deploy-aws.sh
./deploy/deploy-aws.sh meu-bucket-finance us-east-1
```

O script:
1. Cria o bucket S3
2. Desabilita Block Public Access
3. Aplica a política `s3:GetObject` para `*`
4. Ativa Static Website Hosting com `index.html` como error document (SPA routing)
5. Sincroniza `/dist` com cache-control adequado:
   - `index.html` → `no-cache` (sempre a versão mais recente)
   - Assets com hash → `max-age=31536000, immutable` (cache de 1 ano)

### Azure Storage

```bash
chmod +x deploy/deploy-azure.sh
./deploy/deploy-azure.sh personal-finance-rg meuaccount brazilsouth
```

O script:
1. Cria o Resource Group
2. Cria a Storage Account (Standard_LRS)
3. Ativa Static Website no contêiner `$web`
4. Sobe os arquivos com `az storage blob upload-batch`
5. Reaplica `index.html` com `no-cache`

---

## Integração de Preços (BRAPI)

- Endpoint: `https://brapi.dev/api/quote/{TICKER}`
- Ativos com `atualizacao = "automatica"`: botão ↻ na tabela dispara `fetchQuote()`
- Ativos com `atualizacao = "manual"`: campo inline editável na coluna "Preço Atual"
- Token opcional via painel de configurações no header (não persiste — sessão apenas)
- Timeout de 8s via `AbortSignal.timeout()`; erros mostrados por ativo sem travar a UI
