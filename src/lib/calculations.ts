/**
 * 🏨 Motor de Cálculo Financeiro do Sistema MyReserve & FixTur
 * Implementação rigorosa das Regras de Negócio RN-01 a RN-10
 */

export const DEFAULT_AGENCY_COMMISSION_PCT = 14.0;

export type Moeda = "BRL" | "USD" | "EUR";

export interface CanalInput {
  id?: string;
  canal_nome: string;
  valor_mostrado: number | string;
  taxas?: number | string;
  moeda: Moeda;
  comissao_fornecedor_pct: number | string;
  comissao_venda_pct: number | string;
  categoria_quarto: string;
  cafe_da_manha: boolean;
  reembolsavel_ate?: string | Date | null;
  observacoes?: string | null;
  escolhido_manual?: boolean;
}

export interface CanalCalculado extends Omit<CanalInput, "valor_mostrado" | "taxas" | "comissao_fornecedor_pct" | "comissao_venda_pct"> {
  valor_mostrado: number;
  taxas: number;
  comissao_fornecedor_pct: number;
  comissao_venda_pct: number;
  valor_comissao: number;
  custo_liquido: number;
  cotacao_utilizada: number;
  custo_em_brl: number;
  valor_final_venda: number;
  lucro_bruto_agencia: number;
  menor_custo_do_grupo: boolean;
  maior_venda_do_grupo: boolean;
  maior_lucro_do_grupo: boolean;
}

export interface CotacaoCambioRef {
  cotacao_usd: number;
  cotacao_eur: number;
}

/**
 * RN-10 — Arredondamento Bancário / Comercial (ROUND_HALF_UP) para 2 casas decimais.
 * Aplicado apenas ao armazenar ou exibir o valor final de cada campo.
 */
export function round2(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * RN-03 — Cotação utilizada para conversão
 */
export function obterCotacaoUtilizada(moeda: Moeda, cambio: CotacaoCambioRef): number {
  if (moeda === "BRL") {
    return 1;
  }
  if (moeda === "USD") {
    return cambio.cotacao_usd;
  }
  if (moeda === "EUR") {
    return cambio.cotacao_eur;
  }
  throw new Error(`Moeda não suportada: ${moeda}`);
}

/**
 * Converte entradas seguras em números válidos (evita NaN e Infinity)
 */
export function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Calcula os valores financeiros de um único canal mantendo a precisão total
 * nos passos intermediários (RN-01, RN-02, RN-03, RN-04, RN-05, RN-10).
 */
export function calcularCanal(
  canal: CanalInput,
  cambio: CotacaoCambioRef
): Omit<CanalCalculado, "menor_custo_do_grupo" | "maior_venda_do_grupo" | "maior_lucro_do_grupo"> {
  const valorMostrado = safeNumber(canal.valor_mostrado, 0);
  const comissaoFornecedorPct = safeNumber(canal.comissao_fornecedor_pct, 0);
  const comissaoVendaPct = safeNumber(canal.comissao_venda_pct, DEFAULT_AGENCY_COMMISSION_PCT);
  const taxasExato = Math.max(0, safeNumber(canal.taxas, 0));

  if (valorMostrado <= 0) {
    throw new Error("Valor mostrado deve ser maior que zero");
  }

  if (comissaoFornecedorPct < 0 || comissaoFornecedorPct > 100) {
    throw new Error("Comissão do fornecedor deve estar entre 0% e 100%");
  }

  if (comissaoVendaPct >= 100) {
    throw new Error("Comissão de venda deve ser menor que 100%");
  }

  if (comissaoVendaPct < 0) {
    throw new Error("Comissão de venda não pode ser negativa");
  }

  // RN-01 — Valor da comissão do fornecedor
  const valorComissaoExato = valorMostrado * (comissaoFornecedorPct / 100);

  // RN-02 — Custo líquido somando as taxas ao custo do fornecedor
  const custoLiquidoExato = valorMostrado - valorComissaoExato + taxasExato;

  // RN-03 — Cotação utilizada
  const cotacaoUtilizada = obterCotacaoUtilizada(canal.moeda, cambio);

  // RN-04 — Custo em reais (precisão total)
  const custoEmBrlExato = custoLiquidoExato * cotacaoUtilizada;

  // RN-05 — Valor final de venda (precisão total)
  const divisor = 1 - comissaoVendaPct / 100;
  const valorFinalVendaExato = custoEmBrlExato / divisor;

  const custoEmBrl = round2(custoEmBrlExato);
  const valorFinalVenda = round2(valorFinalVendaExato);
  const lucroBrutoAgencia = round2(valorFinalVenda - custoEmBrl);

  return {
    ...canal,
    valor_mostrado: valorMostrado,
    taxas: round2(taxasExato),
    comissao_fornecedor_pct: comissaoFornecedorPct,
    comissao_venda_pct: comissaoVendaPct,
    valor_comissao: round2(valorComissaoExato),
    custo_liquido: round2(custoLiquidoExato),
    cotacao_utilizada: cotacaoUtilizada,
    custo_em_brl: custoEmBrl,
    valor_final_venda: valorFinalVenda,
    lucro_bruto_agencia: lucroBrutoAgencia,
  };
}

/**
 * Aplica os destaques no grupo de canais:
 * - Menor Custo do Grupo (MIN custo_em_brl)
 * - Maior Lucro do Grupo (MAX lucro_bruto_agencia = valor_final_venda - custo_em_brl)
 */
export function aplicarDestaquesNoGrupo<T extends CanalInput>(
  canais: T[],
  cambio: CotacaoCambioRef
): CanalCalculado[] {
  if (!canais || canais.length === 0) {
    return [];
  }

  const calculados: CanalCalculado[] = canais.map((c) => {
    try {
      const calc = calcularCanal(c, cambio);
      return {
        ...calc,
        menor_custo_do_grupo: false,
        maior_venda_do_grupo: false,
        maior_lucro_do_grupo: false,
        escolhido_manual: c.escolhido_manual ?? false,
      };
    } catch {
      let cotacaoUtilizada = 1;
      try {
        cotacaoUtilizada = obterCotacaoUtilizada(c.moeda, cambio);
      } catch {
        cotacaoUtilizada = 1;
      }
      return {
        ...c,
        valor_mostrado: safeNumber(c.valor_mostrado, 0),
        taxas: safeNumber(c.taxas, 0),
        comissao_fornecedor_pct: safeNumber(c.comissao_fornecedor_pct, 0),
        comissao_venda_pct: safeNumber(c.comissao_venda_pct, DEFAULT_AGENCY_COMMISSION_PCT),
        valor_comissao: 0,
        custo_liquido: 0,
        cotacao_utilizada: cotacaoUtilizada,
        custo_em_brl: 0,
        valor_final_venda: 0,
        lucro_bruto_agencia: 0,
        menor_custo_do_grupo: false,
        maior_venda_do_grupo: false,
        maior_lucro_do_grupo: false,
        escolhido_manual: c.escolhido_manual ?? false,
      };
    }
  });

  const canaisValidos = calculados.filter(
    (c) => c.valor_mostrado > 0 && c.custo_em_brl > 0
  );

  if (canaisValidos.length > 0) {
    const custosBrl = canaisValidos.map((c) => c.custo_em_brl);
    const lucrosBrl = canaisValidos.map((c) => c.lucro_bruto_agencia);
    const vendasBrl = canaisValidos.map((c) => c.valor_final_venda);

    const minCusto = Math.min(...custosBrl);
    const maxLucro = Math.max(...lucrosBrl);
    const maxVenda = Math.max(...vendasBrl);

    return calculados.map((c) => ({
      ...c,
      menor_custo_do_grupo: c.custo_em_brl > 0 && c.custo_em_brl === minCusto,
      maior_lucro_do_grupo: c.lucro_bruto_agencia > 0 && c.lucro_bruto_agencia === maxLucro,
      maior_venda_do_grupo: c.valor_final_venda > 0 && c.valor_final_venda === maxVenda,
    }));
  }

  return calculados;
}
