/**
 * Lógica de semáforo para status do funil
 * 🟢 VALIDADO, 🟡 OBSERVAÇÃO, 🔴 ALERTA, 🔴 DESCARTE
 */

export type SemaphoreStatus = 'VALIDADO' | 'OBSERVACAO' | 'ALERTA' | 'DESCARTE';

export interface SemaphoreResult {
  status: SemaphoreStatus;
  emoji: '🟢' | '🟡' | '🔴';
  label: string;
  description: string;
}

const TICKET_MIN_PRICE = 39.90;
const MAX_ACCEPTABLE_CPA = 39.90;
const MIN_ROI = 1.2;

/**
 * Calcula status do semáforo baseado em custos e pagamentos
 */
export function getSemaphoreStatus(
  costs: {
    total: number;
    spent_without_conversion: number;
    tickets_burned: number;
  },
  payments: number,
  cpa: number | null,
  roi: number | null
): SemaphoreResult {
  const ticketPrice = TICKET_MIN_PRICE;
  const spentWithoutConversion = costs.spent_without_conversion;
  const ticketsBurned = costs.tickets_burned;

  // 🟡 OBSERVAÇÃO
  // Gasto acumulado < 1× ticket, Pagamentos = 0
  if (spentWithoutConversion < ticketPrice && payments === 0) {
    return {
      status: 'OBSERVACAO',
      emoji: '🟡',
      label: 'OBSERVAÇÃO',
      description: `Gasto acumulado abaixo de 1× ticket (R$ ${spentWithoutConversion.toFixed(2)}). Ainda não há pagamentos confirmados.`
    };
  }

  // 🔴 ALERTA
  // Gasto acumulado ≥ 1× ticket, Pagamentos = 0
  // NÃO matar, apenas diagnosticar e sugerir ajuste
  if (spentWithoutConversion >= ticketPrice && payments === 0) {
    return {
      status: 'ALERTA',
      emoji: '🔴',
      label: 'ALERTA',
      description: `Gasto acumulado de R$ ${spentWithoutConversion.toFixed(2)} (${ticketsBurned.toFixed(2)}× ticket) sem pagamentos confirmados. Investigar gargalo.`
    };
  }

  // 🔴 DESCARTE
  // Gasto acumulado ≥ 2× ou 3× ticket, Pagamentos = 0
  // OU
  // Pagamentos existem, mas CPA > ticket ou ROI < 1.2
  if (payments === 0 && spentWithoutConversion >= 2 * ticketPrice) {
    return {
      status: 'DESCARTE',
      emoji: '🔴',
      label: 'DESCARTE',
      description: `Gasto acumulado de R$ ${spentWithoutConversion.toFixed(2)} (${ticketsBurned.toFixed(2)}× ticket) sem pagamentos. Considerar pausar ou ajustar campanha.`
    };
  }

  if (payments > 0) {
    if (cpa !== null && cpa > MAX_ACCEPTABLE_CPA) {
      return {
        status: 'DESCARTE',
        emoji: '🔴',
        label: 'DESCARTE',
        description: `CPA de R$ ${cpa.toFixed(2)} está acima do ticket mínimo (R$ ${MAX_ACCEPTABLE_CPA}). Campanha não é viável economicamente.`
      };
    }

    if (roi !== null && roi < MIN_ROI) {
      return {
        status: 'DESCARTE',
        emoji: '🔴',
        label: 'DESCARTE',
        description: `ROI de ${roi.toFixed(2)} está abaixo do mínimo aceitável (${MIN_ROI}). Campanha não está gerando retorno suficiente.`
      };
    }
  }

  // 🟢 VALIDADO
  // Pagamentos ≥ 1, CPA ≤ ticket, ROI ≥ 1.2
  if (payments >= 1) {
    const cpaValid = cpa === null || cpa <= MAX_ACCEPTABLE_CPA;
    const roiValid = roi === null || roi >= MIN_ROI;

    if (cpaValid && roiValid) {
      return {
        status: 'VALIDADO',
        emoji: '🟢',
        label: 'VALIDADO',
        description: `Funil validado! ${payments} pagamento(s) confirmado(s). CPA: R$ ${cpa?.toFixed(2) || 'N/A'}, ROI: ${roi?.toFixed(2) || 'N/A'}.`
      };
    }
  }

  // Fallback: se chegou aqui, retornar OBSERVAÇÃO
  return {
    status: 'OBSERVACAO',
    emoji: '🟡',
    label: 'OBSERVAÇÃO',
    description: 'Aguardando mais dados para determinar status.'
  };
}


