# Personal Finance

Aplicação frontend em React + Vite para gerenciamento de finanças pessoais.

## Estrutura do projeto

- `index.html` - página inicial do Vite.
- `src/` - código-fonte React em TypeScript.
- `package.json` - dependências e scripts do projeto.
- `tailwind.config.js` / `postcss.config.js` - configuração do Tailwind CSS.
- `tsconfig.json` - configuração do TypeScript.
- `deploy/` - scripts de deploy.

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

A aplicação será disponibilizada em `http://localhost:5173` por padrão.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Observações

- A pasta `node_modules` e `dist` não devem ser commitadas.
- Mantenha os arquivos de ambiente privados fora do controle de versão (`.env`, `.env.local`).
