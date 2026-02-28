# Correções de Responsividade - Plataforma (plataforma.portalcertidao.org)

## Resumo

Este documento descreve as alterações realizadas para tornar a interface da plataforma totalmente responsiva em mobile (320px–414px), tablet (768px) e desktop (1024px+).

---

## Telas Ajustadas

| Tela | Problemas Encontrados | Soluções Aplicadas |
|------|------------------------|---------------------|
| **Header** | Nav horizontal com muitos itens causava overflow em mobile | Menu hamburger + Sheet (drawer) lateral em telas &lt;768px |
| **Tickets** | Tabela com min-width 1200px causava scroll horizontal | Cards empilhados no mobile; tabela mantida no desktop |
| **Index (Layout)** | Padding fixo, possível overflow | Padding responsivo (p-4 mobile, p-6 desktop), overflow-x-hidden |
| **Login** | Inputs/botões pequenos para touch | min-h-[44px], text-base, padding responsivo no card |
| **Dashboard** | Truncate em listas, inputs de data | min-w-0 para truncate, min-h em inputs |
| **Usuários** | Tabela com 7 colunas em telas pequenas | overflow-x-auto no container, min-w-[640px] na tabela |
| **Modais (Detalhe/Edição)** | Largura fixa em mobile | w-[95vw] no mobile, overflow-y-auto |

---

## Principais Problemas Encontrados

1. **Header**: Navegação horizontal com 6–9 itens não cabia em telas &lt;768px, gerando overflow ou itens cortados.
2. **Tickets**: Tabela com 10+ colunas e `minWidth: 1200px` forçava scroll horizontal na página inteira.
3. **Layout geral**: `main` com `p-6` fixo; ausência de `overflow-x: hidden` em html/body.
4. **Touch targets**: Botões e inputs com altura menor que 44px, dificultando uso em celular.
5. **Modais**: Largura fixa em mobile podia causar corte ou scroll fora da tela.
6. **Tabs**: Abas de Tickets podiam causar overflow horizontal em mobile.

---

## Arquivos Alterados

| Arquivo | Descrição das alterações |
|---------|---------------------------|
| `PLATAFORMA/src/components/Header.tsx` | Menu hamburger + Sheet (drawer) em mobile; header sticky; padding e altura responsivos; botões com min-h 44px |
| `PLATAFORMA/src/components/Tickets.tsx` | Visualização em cards no mobile; tabela mantida no desktop; tabs com overflow-x-auto; inputs/botões touch-friendly |
| `PLATAFORMA/src/pages/Index.tsx` | main com p-4 sm:p-6, overflow-x-hidden, max-w-full, min-w-0 |
| `PLATAFORMA/src/index.css` | overflow-x: hidden em html/body/#root; scrollbar-hide; card-stat com padding responsivo; modal-content responsivo |
| `PLATAFORMA/src/components/Login.tsx` | min-h-[44px] em inputs e botões; padding responsivo no card (p-5 sm:p-8); text-base |
| `PLATAFORMA/src/components/Dashboard.tsx` | min-h em inputs de data; min-w-0 e truncate em listas; shrink-0 em badges |
| `PLATAFORMA/src/components/Users.tsx` | overflow-x-auto no container da tabela; min-w-[640px] na tabela; min-h em inputs/botões |
| `PLATAFORMA/src/components/TicketDetailModal.tsx` | w-[95vw] sm:w-full, max-w-[95vw] sm:max-w-4xl, overflow-y-auto |
| `PLATAFORMA/src/components/TicketEditModal.tsx` | w-[95vw] sm:w-full, max-w-[95vw] sm:max-w-4xl, overflow-y-auto |
| `PLATAFORMA/src/components/DevOverflowChecker.tsx` | **Novo** – utility para detectar overflow horizontal em dev |
| `PLATAFORMA/src/App.tsx` | Inclusão do DevOverflowChecker |

---

## Breakpoints Utilizados

- **≤480px**: mobile
- **481–768px**: tablet (useIsMobile considera &lt;768px como mobile)
- **769–1024px**: small desktop
- **1025–1440px**: desktop
- **1441px+**: wide

---

## Checagem de Overflow em Dev

O componente `DevOverflowChecker` detecta elementos que excedem a largura do viewport e loga no console quando `import.meta.env.DEV` é true. Útil para validar que não há overflow horizontal após alterações.

---

## Testes Realizados

Recomenda-se validar manualmente em:

- **Mobile**: iPhone SE (320px), Android 360px, iPhone 12/13 (390px), iPhone Plus (414px)
- **Tablet**: iPad (768px)
- **Desktop**: 1024px, 1280px, 1366px, 1440px

Cenários de teste:

- Navegar entre páginas
- Abrir/fechar menu/sidebar (mobile)
- Abrir/fechar modais
- Preencher formulários e enviar
- Verificar listas/tabelas
- Confirmar ausência de scroll horizontal na página

---

## O que NÃO foi alterado

- Textos de negócio
- Regras de formulário/validação
- Endpoints, integrações, pagamentos
- Banco de dados / APIs
- Fluxo principal de telas
- Framework ou bibliotecas adicionais
