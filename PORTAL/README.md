# Portal Certidão

Portal para solicitação de certidões online. Todas as suas certidões direto no seu E-mail e WhatsApp.

## Sobre o Projeto

O Portal Certidão é uma plataforma web desenvolvida para facilitar a solicitação de certidões de forma rápida, segura e 100% online.

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
cd PORTAL

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Copie o arquivo .env.example para .env.local e configure as chaves necessárias
cp .env.example .env.local

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:3000` (ou na porta configurada no vite.config.ts).

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter

## Estrutura do Projeto

```
PORTAL/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   └── config/         # Arquivos de configuração
├── public/             # Arquivos estáticos
└── index.html          # Template HTML principal
```

## Funcionalidades

- Solicitação de certidões online
- Múltiplos tipos de certidões disponíveis
- Seleção de tipo de atendimento (Padrão, Prioritário, Premium)
- Pagamento via PIX
- Integração com reCAPTCHA para segurança
- Interface responsiva e moderna

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_RECAPTCHA_SITE_KEY=sua_chave_recaptcha_aqui
```

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
