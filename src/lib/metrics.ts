// Motor de métricas e benchmarks — LowTicket OS

export type StatusLevel = "bom" | "atencao" | "ruim";

export interface Benchmark {
  metric: string;
  context?: "estatico" | "video" | "geral";
  formulaLabel: string;
  direction: "maior_melhor" | "menor_melhor";
  // Thresholds: depending on direction, a value is "bom" if >= bomMin (maior_melhor)
  // or <= bomMax (menor_melhor). Atencao is the middle band.
  bomMin?: number;
  bomMax?: number;
  atencaoMin?: number;
  atencaoMax?: number;
  ruimMin?: number;
  ruimMax?: number;
  unit?: "%" | "R$" | "x" | "ratio";
  labels: { bom: string; atencao: string; ruim: string };
}

export const BENCHMARKS: Record<string, Benchmark> = {
  ctr_estatico: {
    metric: "CTR link (estático)",
    context: "estatico",
    formulaLabel: "cliques / impressões",
    direction: "maior_melhor",
    bomMin: 1.5,
    atencaoMin: 0.9,
    atencaoMax: 1.5,
    ruimMax: 0.9,
    unit: "%",
    labels: { bom: "> 1,5%", atencao: "0,9–1,5%", ruim: "< 0,9%" },
  },
  ctr_video: {
    metric: "CTR link (vídeo)",
    context: "video",
    formulaLabel: "cliques / impressões",
    direction: "maior_melhor",
    bomMin: 1.2,
    atencaoMin: 0.7,
    atencaoMax: 1.2,
    ruimMax: 0.7,
    unit: "%",
    labels: { bom: "> 1,2%", atencao: "0,7–1,2%", ruim: "< 0,7%" },
  },
  hook_rate: {
    metric: "Hook Rate 3s",
    context: "video",
    formulaLabel: "video_3s / impressões",
    direction: "maior_melhor",
    bomMin: 30,
    atencaoMin: 20,
    atencaoMax: 30,
    ruimMax: 20,
    unit: "%",
    labels: { bom: "> 30%", atencao: "20–30%", ruim: "< 20%" },
  },
  cpc: {
    metric: "CPC link",
    formulaLabel: "gasto / cliques",
    direction: "menor_melhor",
    bomMax: 1.0,
    atencaoMin: 1.0,
    atencaoMax: 2.0,
    ruimMin: 2.0,
    unit: "R$",
    labels: { bom: "< R$1,00", atencao: "R$1,00–2,00", ruim: "> R$2,00" },
  },
  frequencia: {
    metric: "Frequência",
    formulaLabel: "impressões / alcance",
    direction: "menor_melhor",
    bomMax: 2.0,
    atencaoMin: 2.0,
    atencaoMax: 2.5,
    ruimMin: 2.5,
    unit: "x",
    labels: { bom: "< 2,0", atencao: "2,0–2,5", ruim: "> 2,5" },
  },
  click_to_lp: {
    metric: "Clique → LP",
    formulaLabel: "lp_views / cliques",
    direction: "maior_melhor",
    bomMin: 80,
    atencaoMin: 65,
    atencaoMax: 80,
    ruimMax: 65,
    unit: "%",
    labels: { bom: "> 80%", atencao: "65–80%", ruim: "< 65%" },
  },
  lp_to_checkout: {
    metric: "LP → Checkout",
    formulaLabel: "initiate_checkout / lp_views",
    direction: "maior_melhor",
    bomMin: 25,
    atencaoMin: 15,
    atencaoMax: 25,
    ruimMax: 15,
    unit: "%",
    labels: { bom: "> 25%", atencao: "15–25%", ruim: "< 15%" },
  },
  cost_per_ic: {
    metric: "Custo por Initiate Checkout",
    formulaLabel: "gasto / initiate_checkout",
    direction: "menor_melhor",
    bomMax: 5,
    atencaoMin: 5,
    atencaoMax: 8,
    ruimMin: 8,
    unit: "R$",
    labels: { bom: "< R$5", atencao: "R$5–8", ruim: "> R$8" },
  },
  checkout_to_purchase: {
    metric: "Checkout → Compra",
    formulaLabel: "compras / initiate_checkout",
    direction: "maior_melhor",
    bomMin: 30,
    atencaoMin: 20,
    atencaoMax: 30,
    ruimMax: 20,
    unit: "%",
    labels: { bom: "> 30%", atencao: "20–30%", ruim: "< 20%" },
  },
  cpa: {
    metric: "CPA",
    formulaLabel: "gasto / compras (compare com CPA-teto)",
    direction: "menor_melhor",
    bomMax: 20,
    atencaoMin: 20,
    atencaoMax: 30,
    ruimMin: 30,
    unit: "R$",
    labels: { bom: "< R$20", atencao: "R$20–30", ruim: "> R$30" },
  },
  aov: {
    metric: "AOV (Ticket Médio)",
    formulaLabel: "receita / compras",
    direction: "maior_melhor",
    bomMin: 50,
    atencaoMin: 40,
    atencaoMax: 50,
    ruimMax: 40,
    unit: "R$",
    labels: { bom: "> R$50", atencao: "R$40–50", ruim: "≈ R$38 (sem bump)" },
  },
  bump_take: {
    metric: "Take Rate Order Bump",
    formulaLabel: "compradores_com_bump / compras",
    direction: "maior_melhor",
    bomMin: 30,
    atencaoMin: 15,
    atencaoMax: 30,
    ruimMax: 15,
    unit: "%",
    labels: { bom: "> 30%", atencao: "15–30%", ruim: "< 15%" },
  },
  upsell_take: {
    metric: "Take Rate Upsell",
    formulaLabel: "compras_upsell / compras",
    direction: "maior_melhor",
    bomMin: 10,
    atencaoMin: 5,
    atencaoMax: 10,
    ruimMax: 5,
    unit: "%",
    labels: { bom: "> 10%", atencao: "5–10%", ruim: "< 5%" },
  },
  roas: {
    metric: "ROAS front",
    formulaLabel: "receita / gasto",
    direction: "maior_melhor",
    bomMin: 1.5,
    atencaoMin: 1.0,
    atencaoMax: 1.5,
    ruimMax: 1.0,
    unit: "x",
    labels: { bom: "> 1,5", atencao: "1,0–1,5", ruim: "< 1,0" },
  },
};

export function classify(value: number, b: Benchmark): StatusLevel {
  if (b.direction === "maior_melhor") {
    if (b.bomMin !== undefined && value >= b.bomMin) return "bom";
    if (b.atencaoMin !== undefined && value >= b.atencaoMin) return "atencao";
    return "ruim";
  } else {
    if (b.bomMax !== undefined && value <= b.bomMax) return "bom";
    if (b.atencaoMax !== undefined && value <= b.atencaoMax) return "atencao";
    return "ruim";
  }
}

export const STATUS_LABEL: Record<StatusLevel, string> = {
  bom: "BOM",
  atencao: "ATENÇÃO",
  ruim: "RUIM",
};

// Formatters
export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
export const fmtInt = (v: number) => v.toLocaleString("pt-BR");
export const fmtPct = (v: number, d = 1) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
export const fmtX = (v: number, d = 2) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}x`;

// CPA-teto
export interface CpaTetoInput {
  precoLiquidoFront: number;
  takeRateBump: number; // 0..1
  valorMedioBumpLiquido: number;
  takeRateUpsell: number; // 0..1
  ltvLiquidoUpsell: number;
  margemAlvo: number; // 0..1
}
export function calcCpaTeto(i: CpaTetoInput) {
  return (
    (i.precoLiquidoFront +
      i.takeRateBump * i.valorMedioBumpLiquido +
      i.takeRateUpsell * i.ltvLiquidoUpsell) *
    i.margemAlvo
  );
}

// Lucro
export interface LucroInput {
  receita: number;
  gastoAds: number;
  taxaGatewayPct: number; // %
  taxaGatewayFixa: number;
  impostoPct: number; // %
  custoProduto: number;
  qtdPedidos?: number;
}
export function calcLucro(i: LucroInput) {
  const taxasGateway = (i.receita * i.taxaGatewayPct) / 100 + i.taxaGatewayFixa * (i.qtdPedidos ?? 0);
  const imposto = (i.receita * i.impostoPct) / 100;
  const lucro = i.receita - i.gastoAds - taxasGateway - imposto - i.custoProduto * (i.qtdPedidos ?? 0);
  const margem = i.receita > 0 ? (lucro / i.receita) * 100 : 0;
  return { lucro, margem, taxasGateway, imposto };
}
