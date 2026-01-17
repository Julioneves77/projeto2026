# Portal Acesso Online

Projeto front-end isolado para o domínio `portalcacesso.online`.

## Sobre

Este é um projeto completamente isolado, criado do zero, sem qualquer reaproveitamento de código, componentes ou estrutura visual dos projetos existentes no repositório.

## Stack Tecnológico

- React 18+ com TypeScript
- Vite como bundler
- Tailwind CSS para estilização
- Lucide React para ícones

## Estrutura do Projeto

```
PORTAL_ACESSO/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas
│   ├── lib/            # Utilitários e serviços
│   ├── types/          # Definições TypeScript
│   └── index.css       # Estilos globais
├── public/             # Arquivos estáticos
└── dist/              # Build de produção
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## Serviços Disponíveis

O portal oferece acesso a 8 serviços digitais diferentes, todos redirecionando para o Portal Certidão:

1. Acesso Criminal Federal
2. Acesso Quitação Eleitoral
3. Acesso Antecedência PF
4. Acesso Criminal Estadual
5. Acesso Cível Federal
6. Acesso Cível Estadual
7. Acesso CND
8. Acesso CPF Regular

## Isolamento

Este projeto foi criado para isolar ativos de Google Ads. Não há:
- Imports cruzados com outros projetos
- Componentes compartilhados
- Código reutilizado
- Estrutura visual similar

## Licença

Projeto privado.
