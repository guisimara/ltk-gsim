// Seed realista — Operação Mulher de Provérbios
export interface ProductConfig {
  precoProdutoPrincipal: number;
  taxaGatewayPercent: number;
  taxaGatewayFixa: number;
  impostoPercent: number;
  custoProduto: number;
  margemAlvo: number; // 0..1
}

export const productConfig: ProductConfig = {
  precoProdutoPrincipal: 37.9,
  taxaGatewayPercent: 5.99,
  taxaGatewayFixa: 0,
  impostoPercent: 6,
  custoProduto: 0,
  margemAlvo: 0.7,
};

export interface Bump { id: string; nome: string; preco: number; takeRate: number }
export const bumps: Bump[] = [
  { id: "b1", nome: "Planner de Oração", preco: 17.0, takeRate: 0.32 },
  { id: "b2", nome: "Afirmações Bíblicas", preco: 12.9, takeRate: 0.22 },
  { id: "b3", nome: "Propósito 40 Dias", preco: 27.0, takeRate: 0.18 },
];

export const upsellConfig = {
  nome: "Clube da Mulher Virtuosa",
  preco: 97.0,
  taxaConversaoEstimadaPercent: 9,
  ltvLiquido: 70.0,
};

// Ads + métricas agregadas dos últimos 7 dias
export interface Ad {
  id: string;
  campaign: string;
  adset: string;
  nome: string;
  tipo: "estatico" | "video";
  status: "ativo" | "pausado" | "vencedor" | "cortado";
  gasto: number;
  impressoes: number;
  alcance: number;
  cliquesLink: number;
  lpViews: number;
  initiateCheckout: number;
  compras: number;
  receita: number;
  video3s?: number;
  retencaoMedia?: number; // 0..1
  ctrPrev?: number; // CTR período anterior
  cpmPrev?: number;
}

export const ads: Ad[] = [
  {
    id: "ad1",
    campaign: "Conversão — Mulher de Provérbios",
    adset: "Mulheres 25-45 BR — Lookalike",
    nome: "Estático — Carrossel Provérbios 31",
    tipo: "estatico",
    status: "vencedor",
    gasto: 1842,
    impressoes: 142300,
    alcance: 78900,
    cliquesLink: 2530,
    lpViews: 2180,
    initiateCheckout: 612,
    compras: 198,
    receita: 198 * 49.2,
    ctrPrev: 1.62,
    cpmPrev: 12.4,
  },
  {
    id: "ad2",
    campaign: "Conversão — Mulher de Provérbios",
    adset: "Mulheres 25-45 BR — Interesses Fé",
    nome: "Vídeo — Testemunho Joana 45s",
    tipo: "video",
    status: "ativo",
    gasto: 2310,
    impressoes: 198400,
    alcance: 92300,
    cliquesLink: 2780,
    lpViews: 2310,
    initiateCheckout: 540,
    compras: 162,
    receita: 162 * 47.8,
    video3s: 64800,
    retencaoMedia: 0.34,
    ctrPrev: 1.45,
    cpmPrev: 11.1,
  },
  {
    id: "ad3",
    campaign: "Criativos Novos — Junho",
    adset: "Teste — Frio amplo",
    nome: "Estático — Versículo neon",
    tipo: "estatico",
    status: "ativo",
    gasto: 540,
    impressoes: 71200,
    alcance: 58200,
    cliquesLink: 612,
    lpViews: 480,
    initiateCheckout: 92,
    compras: 19,
    receita: 19 * 41.2,
    ctrPrev: 1.05,
    cpmPrev: 7.2,
  },
  {
    id: "ad4",
    campaign: "Criativos Novos — Junho",
    adset: "Teste — Frio amplo",
    nome: "Vídeo — UGC depoimento curto",
    tipo: "video",
    status: "ativo",
    gasto: 980,
    impressoes: 121000,
    alcance: 64100,
    cliquesLink: 1880,
    lpViews: 1620,
    initiateCheckout: 420,
    compras: 138,
    receita: 138 * 51.4,
    video3s: 51500,
    retencaoMedia: 0.41,
    ctrPrev: 1.42,
    cpmPrev: 7.9,
  },
  {
    id: "ad5",
    campaign: "Conversão — Mulher de Provérbios",
    adset: "Mulheres 25-45 BR — Lookalike",
    nome: "Vídeo — Antes/Depois 30s",
    tipo: "video",
    status: "ativo",
    gasto: 1620,
    impressoes: 168400,
    alcance: 41200,
    cliquesLink: 1180,
    lpViews: 940,
    initiateCheckout: 178,
    compras: 38,
    receita: 38 * 42.6,
    video3s: 30300,
    retencaoMedia: 0.18,
    ctrPrev: 1.31,
    cpmPrev: 6.8,
  },
  {
    id: "ad6",
    campaign: "Remarketing — Checkout",
    adset: "Carrinho abandonado 7d",
    nome: "Estático — Última chance",
    tipo: "estatico",
    status: "ativo",
    gasto: 312,
    impressoes: 18400,
    alcance: 9100,
    cliquesLink: 410,
    lpViews: 380,
    initiateCheckout: 142,
    compras: 64,
    receita: 64 * 53.8,
    ctrPrev: 2.1,
    cpmPrev: 14.2,
  },
  {
    id: "ad7",
    campaign: "Criativos Novos — Junho",
    adset: "Teste — Frio amplo",
    nome: "Estático — Quote design",
    tipo: "estatico",
    status: "cortado",
    gasto: 218,
    impressoes: 34000,
    alcance: 28100,
    cliquesLink: 198,
    lpViews: 142,
    initiateCheckout: 22,
    compras: 3,
    receita: 3 * 37.9,
    ctrPrev: 0.71,
    cpmPrev: 6.1,
  },
];

// Série temporal últimos 7 dias para gráficos
export const dailySeries = (() => {
  const days = 7;
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - idx));
    const base = 1100 + Math.sin(idx) * 180 + idx * 40;
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      gasto: Math.round(base),
      receita: Math.round(base * (1.05 + 0.12 * Math.cos(idx))),
      compras: Math.round(28 + idx * 2 + Math.sin(idx) * 5),
    };
  });
})();

// Período anterior — para tendência (totais)
export const previousPeriod = {
  gasto: 7100,
  receita: 8200,
  compras: 188,
  lucro: 380,
  roas: 1.15,
  cpa: 37.8,
  aov: 43.6,
};
