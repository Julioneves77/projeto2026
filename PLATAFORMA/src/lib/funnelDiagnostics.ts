/**
 * Lógica de diagnóstico de gargalos do funil
 * Identifica o gargalo dominante baseado em eventos e custos
 */

export interface FunnelEvents {
  links_view?: number;
  links_cta_click?: number;
  portal_view?: number;
  form_start?: number;
  form_submit_success?: number;
  form_submit_error?: number;
  pix_view?: number;
  pix_initiated?: number;
  payment_confirmed?: number;
}

export interface FunnelCosts {
  total: number;
  spent_without_conversion: number;
  tickets_burned: number;
}

export interface BottleneckResult {
  bottleneck: 'TRÁFEGO' | 'LINKS' | 'PORTAL' | 'FORMULÁRIO' | 'PIX' | null;
  diagnosis: string;
  suggestedAction: string;
}

/**
 * Identifica o gargalo dominante do funil
 */
export function identifyBottleneck(
  events: FunnelEvents,
  costs: FunnelCosts
): BottleneckResult {
  const {
    links_view = 0,
    links_cta_click = 0,
    portal_view = 0,
    form_start = 0,
    form_submit_success = 0,
    form_submit_error = 0,
    pix_view = 0,
    pix_initiated = 0,
    payment_confirmed = 0
  } = events;

  // 1) GARGALO: TRÁFEGO (Google Ads)
  // Sinais: Custo ocorre, mas links_view baixo ou inexistente
  if (costs.total > 0 && links_view === 0) {
    return {
      bottleneck: 'TRÁFEGO',
      diagnosis: 'Há gasto em campanhas, mas nenhuma visualização nas páginas de links foi registrada.',
      suggestedAction: 'Ajustar anúncio, palavra-chave ou segmentação. O público pode não ter intenção ou o anúncio não está atraindo cliques relevantes.'
    };
  }

  // 2) GARGALO: LINKS
  // Sinais: links_view alto, mas links_cta_click baixo
  if (links_view > 0) {
    const ctaClickRate = links_cta_click / links_view;
    if (ctaClickRate < 0.1) { // Menos de 10% de conversão
      return {
        bottleneck: 'LINKS',
        diagnosis: `Muitas visualizações (${links_view}), mas poucos cliques no botão CTA (${links_cta_click}). Taxa de conversão: ${(ctaClickRate * 100).toFixed(1)}%`,
        suggestedAction: 'Ajustar headline, CTA ou alinhamento com anúncio. A página não está convertendo a intenção em ação.'
      };
    }
  }

  // 3) GARGALO: PORTAL (Confiança)
  // Sinais: portal_view alto, mas form_start baixo
  if (portal_view > 0) {
    const formStartRate = form_start / portal_view;
    if (formStartRate < 0.3) { // Menos de 30% começam o formulário
      return {
        bottleneck: 'PORTAL',
        diagnosis: `Muitas visualizações do Portal (${portal_view}), mas poucos iniciaram o formulário (${form_start}). Taxa de conversão: ${(formStartRate * 100).toFixed(1)}%`,
        suggestedAction: 'Ajustar textos, clareza e credibilidade. Falta de confiança no Portal pode estar impedindo o início do preenchimento.'
      };
    }
  }

  // 4) GARGALO: FORMULÁRIO
  // Sinais: form_start alto, mas form_submit_success baixo
  if (form_start > 0) {
    const submitSuccessRate = form_submit_success / form_start;
    if (submitSuccessRate < 0.5) { // Menos de 50% completam
      const hasErrors = form_submit_error > 0;
      return {
        bottleneck: 'FORMULÁRIO',
        diagnosis: `Muitos iniciaram o formulário (${form_start}), mas poucos completaram com sucesso (${form_submit_success}). Taxa de conversão: ${(submitSuccessRate * 100).toFixed(1)}%${hasErrors ? `. Erros registrados: ${form_submit_error}` : ''}`,
        suggestedAction: hasErrors
          ? 'Simplificar campos ou corrigir validações. Erros de validação estão impedindo a conclusão.'
          : 'Simplificar campos ou reduzir fricção. O formulário pode estar muito longo ou complexo.'
      };
    }
  }

  // 5) GARGALO: PIX (Pagamento)
  // Sinais: pix_view ou pix_initiated alto, mas payment_confirmed baixo
  if (pix_view > 0 || pix_initiated > 0) {
    const pixViews = Math.max(pix_view, pix_initiated);
    const paymentRate = payment_confirmed / pixViews;
    if (paymentRate < 0.3) { // Menos de 30% pagam
      return {
        bottleneck: 'PIX',
        diagnosis: `Muitos visualizaram/iniciaram o PIX (${pixViews}), mas poucos pagamentos confirmados (${payment_confirmed}). Taxa de conversão: ${(paymentRate * 100).toFixed(1)}%`,
        suggestedAction: 'Ajustar copy de segurança e fechamento no PIX. Pode haver fricção no processo de pagamento ou falta de confiança.'
      };
    }
  }

  // Sem gargalo identificado (funil fluindo bem ou dados insuficientes)
  return {
    bottleneck: null,
    diagnosis: 'Nenhum gargalo dominante identificado. O funil está fluindo normalmente ou há dados insuficientes para diagnóstico.',
    suggestedAction: 'Continuar monitorando. Se houver gasto sem conversão, verificar se os eventos estão sendo coletados corretamente.'
  };
}


