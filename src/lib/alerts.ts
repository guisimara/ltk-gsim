import { ads } from "./seed";
import { aggregateAccount } from "./aggregations";
import type { AlertItem } from "@/components/AlertsBanner";

export function computeAlerts(): AlertItem[] {
  const alerts: AlertItem[] = [];
  const agg = aggregateAccount();

  // 1. Fadiga de criativo
  for (const ad of ads) {
    const freq = ad.impressoes / ad.alcance;
    const ctr = (ad.cliquesLink / ad.impressoes) * 100;
    const prev = ad.ctrPrev ?? ctr;
    const drop = prev ? ((prev - ctr) / prev) * 100 : 0;
    if (freq > 2.5 && drop > 20) {
      alerts.push({
        level: "ruim",
        title: `Criativo "${ad.nome}" em fadiga`,
        message: `Frequência ${freq.toFixed(2)}x e CTR caiu ${drop.toFixed(0)}% vs período anterior — rotacione o criativo.`,
      });
    }
  }

  // 2. Vazamento de checkout (conta agregada)
  if (agg.metrics.icToPurchase < 20) {
    alerts.push({
      level: "ruim",
      title: "Vazamento no checkout",
      message: `Apenas ${agg.metrics.icToPurchase.toFixed(1)}% dos checkouts convertem em compra. Ative recuperação e revise o checkout.`,
    });
  }

  // 3. CPA acima do teto
  if (agg.metrics.cpa >= agg.cpaTeto) {
    alerts.push({
      level: "ruim",
      title: "CPA acima do teto de lucro",
      message: `CPA atual R$${agg.metrics.cpa.toFixed(2)} ≥ CPA-teto R$${agg.cpaTeto.toFixed(2)}. Operação no vermelho.`,
    });
  }

  // 4. CPM subindo + CTR caindo (agregado por ad)
  for (const ad of ads) {
    const cpm = (ad.gasto / ad.impressoes) * 1000;
    const ctr = (ad.cliquesLink / ad.impressoes) * 100;
    if (ad.cpmPrev && ad.ctrPrev) {
      const cpmRise = ((cpm - ad.cpmPrev) / ad.cpmPrev) * 100;
      const ctrFall = ((ad.ctrPrev - ctr) / ad.ctrPrev) * 100;
      if (cpmRise > 20 && ctrFall > 10) {
        alerts.push({
          level: "atencao",
          title: `CPM subindo em "${ad.nome}"`,
          message: `CPM +${cpmRise.toFixed(0)}% e CTR -${ctrFall.toFixed(0)}% — público pode estar saturando.`,
        });
      }
    }
  }

  return alerts;
}
