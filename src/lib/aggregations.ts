import { ads, bumps, productConfig, upsellConfig, previousPeriod } from "./seed";
import { BENCHMARKS, classify, calcCpaTeto, calcLucro } from "./metrics";

export function aggregateAccount() {
  const t = ads.reduce(
    (a, x) => {
      a.gasto += x.gasto;
      a.impressoes += x.impressoes;
      a.alcance += x.alcance;
      a.cliques += x.cliquesLink;
      a.lpViews += x.lpViews;
      a.ic += x.initiateCheckout;
      a.compras += x.compras;
      a.receita += x.receita;
      return a;
    },
    { gasto: 0, impressoes: 0, alcance: 0, cliques: 0, lpViews: 0, ic: 0, compras: 0, receita: 0 },
  );

  const roas = t.receita / t.gasto;
  const cpa = t.gasto / t.compras;
  const aov = t.receita / t.compras;
  const ctrLink = (t.cliques / t.impressoes) * 100;
  const cpc = t.gasto / t.cliques;
  const cpm = (t.gasto / t.impressoes) * 1000;
  const freq = t.impressoes / t.alcance;
  const clickToLp = (t.lpViews / t.cliques) * 100;
  const lpToIc = (t.ic / t.lpViews) * 100;
  const costPerIc = t.gasto / t.ic;
  const icToPurchase = (t.compras / t.ic) * 100;

  // CPA-teto
  const precoLiquidoFront =
    productConfig.precoProdutoPrincipal *
      (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100) -
    productConfig.custoProduto;
  const avgBumpPreco = bumps.reduce((s, b) => s + b.preco, 0) / bumps.length;
  const avgBumpTake = bumps.reduce((s, b) => s + b.takeRate, 0) / bumps.length;
  const valorMedioBumpLiquido =
    avgBumpPreco * (1 - productConfig.taxaGatewayPercent / 100 - productConfig.impostoPercent / 100);
  const cpaTeto = calcCpaTeto({
    precoLiquidoFront,
    takeRateBump: avgBumpTake,
    valorMedioBumpLiquido,
    takeRateUpsell: upsellConfig.taxaConversaoEstimadaPercent / 100,
    ltvLiquidoUpsell: upsellConfig.ltvLiquido,
    margemAlvo: productConfig.margemAlvo,
  });

  const lucroCalc = calcLucro({
    receita: t.receita,
    gastoAds: t.gasto,
    taxaGatewayPct: productConfig.taxaGatewayPercent,
    taxaGatewayFixa: productConfig.taxaGatewayFixa,
    impostoPct: productConfig.impostoPercent,
    custoProduto: productConfig.custoProduto,
    qtdPedidos: t.compras,
  });

  // Breakdown receita
  const receitaBumps = t.compras * avgBumpTake * avgBumpPreco;
  const receitaUpsell = t.compras * (upsellConfig.taxaConversaoEstimadaPercent / 100) * upsellConfig.preco;
  const receitaFront = Math.max(0, t.receita - receitaBumps);

  return {
    totals: t,
    metrics: {
      roas,
      cpa,
      aov,
      ctrLink,
      cpc,
      cpm,
      freq,
      clickToLp,
      lpToIc,
      costPerIc,
      icToPurchase,
    },
    cpaTeto,
    lucro: lucroCalc,
    receitaBreakdown: { front: receitaFront, bumps: receitaBumps, upsell: receitaUpsell },
    bumpStats: { avgTake: avgBumpTake, avgPreco: avgBumpPreco },
    previous: previousPeriod,
  };
}

export function trendPct(curr: number, prev: number) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

export { BENCHMARKS, classify };
