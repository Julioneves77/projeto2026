# Atendimento Virtual

Sistema de gestão de tickets e atendimento ao cliente para processamento de certidões.

## Sobre o Projeto

O Atendimento Virtual é uma plataforma web desenvolvida para gerenciar tickets de solicitação de certidões, permitindo que a equipe de atendimento processe solicitações de forma organizada e eficiente.

## Tecnologias Utilizadas

Este projeto é construído com:

- **Vite** - Build tool e dev server
- **TypeScript** - Linguagem de programação
- **React** - Biblioteca JavaScript para interfaces
- **shadcn-ui** - Componentes de UI
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento para aplicações React

## Como executar o projeto localmente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

```sh
# 1. Clone o repositório
git clone <YOUR_GIT_URL>

# 2. Navegue até o diretório do projeto
cd PLATAFORMA

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8081` (ou na porta configurada no vite.config.ts).

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter

## Estrutura do Projeto

```
PLATAFORMA/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   ├── data/           # Dados mockados
│   └── types/          # Definições de tipos TypeScript
├── public/             # Arquivos estáticos
└── index.html          # Template HTML principal
```

## Funcionalidades

- Sistema de autenticação com diferentes perfis (Admin, Financeiro, Atendente)
- Gestão de tickets com diferentes status
- Dashboard com estatísticas e métricas
- Histórico de interações por ticket
- Respostas prontas para agilizar atendimento
- Relatórios e estatísticas
- Interface responsiva e moderna

## Perfis de Usuário

- **Admin**: Acesso completo ao sistema, visualiza todos os tickets
- **Financeiro**: Visualiza tickets financeiros e pode gerenciar valores
- **Atendente**: Visualiza apenas tickets atribuídos, processa solicitações

## Deploy

Para fazer o deploy do projeto:

```sh
# Criar build de produção
npm run build

# Os arquivos estarão na pasta dist/
# Faça o upload da pasta dist/ para seu servidor de hospedagem
```

## Licença

Este projeto é privado e proprietário.
