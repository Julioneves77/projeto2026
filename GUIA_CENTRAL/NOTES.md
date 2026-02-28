# Notas de Alterações - UX Mobile e Scroll

**Data:** 21/02/2026  
**Objetivo:** Otimização mobile-first, scroll ao topo em trocas de rota/etapa, e ajustes de responsividade.

---

## Arquivos Alterados

### 1. `src/lib/scrollUtils.ts` (NOVO)
- Criado utilitário com `scrollToTop()` e `scrollToFormStart()` para comportamento consistente de scroll.
- `scrollToTop()`: scroll instantâneo para o topo (window + documentElement + body).
- `scrollToFormStart()`: posiciona no início do formulário com offset do header fixo.

### 2. `src/components/ScrollToTop.tsx`
- Passa a depender de `pathname` e `search` (antes só pathname).
- Troca de tipo de certidão via `?type=` agora dispara scroll ao topo.
- Usa `scrollToTop()` de `scrollUtils`.

### 3. `src/pages/CertificateForm.tsx`
- **Scroll:** `scrollToTop()` ao trocar categoria, tipo ou estado; ao trocar de etapa (currentStep).
- **Reset de step:** `currentStep` volta a 0 quando `category`, `type` ou `selectedState` mudam.
- **Mobile:** Form com `p-4 sm:p-6`, container com `px-4 sm:px-6`, step buttons com `min-h-[44px]` e `gap-2 sm:gap-1`.

### 4. `src/pages/PrePayment.tsx`
- `useLayoutEffect` com `scrollToTop()` ao montar (confirmação antes do PIX).

### 5. `src/pages/Payment.tsx`
- `useLayoutEffect` com `scrollToTop()` ao montar (página PIX).
- Botão "Ouvir instruções" com `min-h-[44px] min-w-[44px]` para alvo de toque.

### 6. `src/pages/ThankYou.tsx`
- `useLayoutEffect` com `scrollToTop()` ao montar.
- Container com `px-4 sm:px-6`, card com `p-4 sm:p-8`.
- Botão "Ouvir instruções" com `min-h-[44px] min-w-[44px]`.

### 7. `src/components/ui/input.tsx`
- `min-h-[44px] h-11` para alvo de toque ≥44px.
- `text-base sm:text-sm` (16px em mobile para evitar zoom no iOS).

### 8. `src/components/ui/button.tsx`
- Tamanhos com `min-h-[44px]` ou `min-h-[48px]` conforme variante.
- `icon`: `min-h-[44px] min-w-[44px]`.

### 9. `src/components/ui/select.tsx`
- SelectTrigger com `min-h-[44px] h-11` e `text-base sm:text-sm`.

### 10. `src/components/layout/Header.tsx`
- Container com `px-4 sm:px-6 py-3 sm:py-4`.
- Botão hamburger com `min-h-[44px] min-w-[44px]` e `aria-label`.

### 11. `tailwind.config.ts`
- Container padding de `2rem` para `1rem`.
- Breakpoint extra `xs: 360px` em `extend.screens`.

### 12. `src/index.css`
- `html { font-size: 16px }` para evitar zoom em inputs no iOS.
- `overflow-x: hidden` e `max-width: 100vw` já existentes em html, body, #root.

---

## Comportamento de Scroll

| Evento | Ação |
|--------|------|
| Troca de rota (pathname) | ScrollToTop (componente global) |
| Troca de query (?type=, etc.) | ScrollToTop (componente global) |
| Troca de etapa no formulário | scrollToTop() no CertificateForm |
| Troca de categoria/tipo/estado | scrollToTop() + reset currentStep |
| Entrada em PrePayment | scrollToTop() no mount |
| Entrada em Payment | scrollToTop() no mount |
| Entrada em ThankYou | scrollToTop() no mount |

---

## Breakpoints Utilizados

- **xs:** 360px (Android comum)
- **sm:** 640px (Tailwind default)
- **md:** 768px (iPad portrait)
- **lg:** 1024px
- **xl:** 1280px

---

## Testes Recomendados

1. **iPhone SE (320px):** Formulário, PIX, Obrigado sem overflow horizontal.
2. **iPhone 12/13 (390px):** Botões e inputs com alvo de toque adequado.
3. **Android 360px:** Layout estável.
4. **iPad 768px:** Transição para layout desktop.
5. **Cenários de scroll:** Trocar certidão, avançar/voltar etapas, entrar no PIX e no Obrigado — sempre voltando ao topo.
