import { fmtBRL, fmtPct } from "./metrics";
import type { AlertItem } from "@/components/AlertsBanner";

export type LiveMetricsForAlerts = {
  spend: number;
  revenue: number;
  purchases: number;
  lpViews: number;
  ic: number;
  ctr: number;
  cpc: number;
  roas: number;
  cpa: number;
  cpaTeto: number;
};

export function computeAlerts(m?: LiveMetricsForAlerts): AlertItem[] {
  // Nada a analisar se não há dados reais
  if (!m || m.spend === 0) return [];

  const alerts: AlertItem[] = [];

  // ── 1. ROAS crítico ──────────────────────────────────────────────────────────
  if (m.roas < 1) {
    alerts.push({
      level: "ruim",
      title: "ROAS abaixo de 1x — operação no vermelho",
      message: `ROAS atual ${m.roas.toFixed(2)}x. Você está gastando mais do que gerando. Pause anúncios de baixo desempenho imediatamente.`,
    });
  } else if (m.roas < 1.5) {
    alerts.push({
      level: "atencao",
      title: "ROAS crítico",
      message: `ROAS ${m.roas.toFixed(2)}x — margem muito apertada. Revise criativos, oferta e público-alvo.`,
    });
  }

  // ── 2. CPA acima do teto ─────────────────────────────────────────────────────
  if (m.cpaTeto > 0 && m.cpa > m.cpaTeto && m.purchases > 0) {
    alerts.push({
      level: "ruim",
      title: "CPA acima do teto de lucro",
      message: `CPA atual ${fmtBRL(m.cpa)} vs teto ${fmtBRL(m.cpaTeto)}. Cada venda está gerando prejuízo.`,
    });
  }

  // ── 3. Tráfego bom, mas checkout travando ────────────────────────────────────
  const icToPurchase = m.ic > 0 ? (m.purchases / m.ic) * 100 : 0;
  if (m.ic >= 20 && icToPurchase < 15) {
    alerts.push({
      level: "ruim",
      title: "Checkout travando vendas",
      message: `${icToPurchase.toFixed(1)}% dos checkouts viram venda. Com ${m.ic} initiate checkouts, você deveria ter mais compras — revise o processo de pagamento, bump e garantia.`,
    });
  }

  // ── 4. LP views altas + IC muito baixo = página fraca ───────────────────────
  const icRate = m.lpViews > 0 ? (m.ic / m.lpViews) * 100 : 0;
  if (m.lpViews >= 50 && icRate < 5) {
    alerts.push({
      level: "atencao",
      title: "Página de destino com baixa conversão",
      message: `Apenas ${icRate.toFixed(1)}% dos visitantes iniciam o checkout. A LP está recebendo tráfego mas não converte — revise headline, VSL e CTA.`,
    });
  }

  // ── 5. LP views altas + IC alto + compras baixas = problema na oferta ────────
  if (m.lpViews >= 50 && icRate >= 15 && icToPurchase < 10 && m.ic >= 20) {
    alerts.push({
      level: "atencao",
      title: "Alto interesse, baixa conversão final",
      message: `${fmtPct(icRate, 1)} chegam ao checkout mas apenas ${icToPurchase.toFixed(1)}% compram. Possível atrito no preço, forma de pagamento ou falta de urgência.`,
    });
  }

  // ── 6. CTR muito baixo ───────────────────────────────────────────────────────
  if (m.ctr < 0.5 && m.spend > 50) {
    alerts.push({
      level: "atencao",
      title: "CTR muito baixo",
      message: `CTR ${m.ctr.toFixed(2)}% — os anúncios não geram interesse suficiente. Teste novos criativos, hooks e copies mais diretos.`,
    });
  }

  // ── 7. CPC alto sem retorno proporcional ─────────────────────────────────────
  if (m.cpc > 5 && m.roas < 2) {
    alerts.push({
      level: "atencao",
      title: "CPC elevado com ROAS baixo",
      message: `CPC ${fmtBRL(m.cpc)} com ROAS ${m.roas.toFixed(2)}x. O tráfego está caro e não retorna o suficiente — revise segmentação.`,
    });
  }

  return alerts;
}
