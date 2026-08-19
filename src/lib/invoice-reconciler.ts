export interface SupplierInvoiceRow {
  localizador: string;
  fornecedor: string;
  cliente?: string;
  valor: number;
  data?: string;
  linhaOriginal: string;
}

export interface ReconciliationResultItem {
  fatura: SupplierInvoiceRow;
  status: "MATCH_PERFEITO" | "DIVERGENCIA_VALOR" | "NAO_ENCONTRADO" | "JA_PAGO";
  pagavelId?: string;
  valorSistema?: number;
  diferencaValor?: number;
  detalhes: string;
  conciliado: boolean;
}

export interface SupplierReconciliationSummary {
  totalItensFatura: number;
  totalValorFatura: number;
  matchesPerfeitos: number;
  divergenciasValor: number;
  naoEncontrados: number;
  jaPagos: number;
  itens: ReconciliationResultItem[];
}

export class InvoiceReconciler {
  /**
   * Faz o parse de CSV/Texto de fatura de operadora
   */
  static parseCSV(csvText: string): SupplierInvoiceRow[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    // Detecta separador (; ou , ou \t)
    const firstLine = lines[0];
    let separator = ";";
    if (firstLine.includes(",") && !firstLine.includes(";")) separator = ",";
    if (firstLine.includes("\t")) separator = "\t";

    const headers = firstLine
      .split(separator)
      .map((h) =>
        h
          .toLowerCase()
          .replace(/["']/g, "")
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );

    // Mapeamento flexível de colunas
    const colLoc = headers.findIndex((h) =>
      h.includes("localizador") ||
      h.includes("reserva") ||
      h.includes("venda") ||
      h.includes("pnr") ||
      h.includes("voucher")
    );

    const colFornec = headers.findIndex((h) =>
      h.includes("fornecedor") ||
      h.includes("operador") ||
      h.includes("cia") ||
      h.includes("empresa")
    );

    const colValor = headers.findIndex((h) =>
      h.includes("valor") ||
      h.includes("total") ||
      h.includes("preco") ||
      h.includes("liquido") ||
      h.includes("tarifa")
    );

    const colCliente = headers.findIndex((h) =>
      h.includes("cliente") ||
      h.includes("passageiro") ||
      h.includes("hospede") ||
      h.includes("nome")
    );

    const colData = headers.findIndex((h) =>
      h.includes("data") ||
      h.includes("vencimento") ||
      h.includes("emissao")
    );

    const rows: SupplierInvoiceRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(separator).map((c) => c.replace(/["']/g, "").trim());
      if (cols.length < 2) continue;

      let localizador = colLoc !== -1 && cols[colLoc] ? cols[colLoc] : `FAT-${i}`;
      let fornecedor = colFornec !== -1 && cols[colFornec] ? cols[colFornec] : "FORNECEDOR";
      let cliente = colCliente !== -1 ? cols[colCliente] : "";
      let data = colData !== -1 ? cols[colData] : "";

      let valorStr = colValor !== -1 && cols[colValor] ? cols[colValor] : "0";
      // Converte formato brasileiro 1.500,50 ou americano 1500.50 para número
      valorStr = valorStr.replace("R$", "").replace(/\s/g, "");
      if (valorStr.includes(",") && valorStr.includes(".")) {
        valorStr = valorStr.replace(/\./g, "").replace(",", ".");
      } else if (valorStr.includes(",")) {
        valorStr = valorStr.replace(",", ".");
      }
      const valor = parseFloat(valorStr) || 0;

      rows.push({
        localizador,
        fornecedor,
        cliente,
        valor: Math.abs(valor),
        data,
        linhaOriginal: line,
      });
    }

    return rows;
  }

  /**
   * Cruza itens da fatura com os lançamentos de Contas a Pagar (Payables)
   */
  static reconcile(
    invoiceRows: SupplierInvoiceRow[],
    payables: Array<{
      id: string;
      fornecedor_nome: string;
      descricao: string;
      valor_brl: number;
      saldo: number;
      status: string;
      sale?: { sale_number: string; cliente_nome: string } | null;
    }>
  ): SupplierReconciliationSummary {
    const itens: ReconciliationResultItem[] = [];
    let totalValorFatura = 0;
    let matchesPerfeitos = 0;
    let divergenciasValor = 0;
    let naoEncontrados = 0;
    let jaPagos = 0;

    const usedPayableIds = new Set<string>();

    for (const row of invoiceRows) {
      totalValorFatura += row.valor;

      // 1. Tentar encontrar por Localizador/Reserva na venda ou descrição
      let match = payables.find((p) => {
        if (usedPayableIds.has(p.id)) return false;
        const locLower = row.localizador.toLowerCase();
        const saleMatch = p.sale?.sale_number.toLowerCase().includes(locLower);
        const descMatch = p.descricao.toLowerCase().includes(locLower);
        return saleMatch || descMatch;
      });

      // 2. Se não encontrou por localizador, buscar por fornecedor + valor aproximado (+- R$ 0.10)
      if (!match) {
        match = payables.find((p) => {
          if (usedPayableIds.has(p.id)) return false;
          const fornecMatch =
            p.fornecedor_nome.toLowerCase().includes(row.fornecedor.toLowerCase()) ||
            row.fornecedor.toLowerCase().includes(p.fornecedor_nome.toLowerCase());
          const valorMatch = Math.abs(p.valor_brl - row.valor) <= 0.1;
          return fornecMatch && valorMatch;
        });
      }

      if (!match) {
        naoEncontrados++;
        itens.push({
          fatura: row,
          status: "NAO_ENCONTRADO",
          detalhes: "Nenhuma conta a pagar encontrada para este localizador ou valor.",
          conciliado: false,
        });
        continue;
      }

      usedPayableIds.add(match.id);

      if (match.status === "PAID") {
        jaPagos++;
        itens.push({
          fatura: row,
          status: "JA_PAGO",
          pagavelId: match.id,
          valorSistema: match.valor_brl,
          detalhes: `Conta a pagar já se encontra liquidada (${match.fornecedor_nome} - ${match.descricao}).`,
          conciliado: false,
        });
        continue;
      }

      const diferenca = Number((row.valor - match.valor_brl).toFixed(2));

      if (Math.abs(diferenca) <= 0.1) {
        matchesPerfeitos++;
        itens.push({
          fatura: row,
          status: "MATCH_PERFEITO",
          pagavelId: match.id,
          valorSistema: match.valor_brl,
          diferencaValor: 0,
          detalhes: `Conferência exata: ${match.fornecedor_nome} (${match.descricao}).`,
          conciliado: false,
        });
      } else {
        divergenciasValor++;
        itens.push({
          fatura: row,
          status: "DIVERGENCIA_VALOR",
          pagavelId: match.id,
          valorSistema: match.valor_brl,
          diferencaValor: diferenca,
          detalhes: `Diferença de valor: Fatura R$ ${row.valor.toFixed(2)} vs Sistema R$ ${match.valor_brl.toFixed(2)} (Dif: R$ ${diferenca > 0 ? "+" : ""}${diferenca.toFixed(2)}).`,
          conciliado: false,
        });
      }
    }

    return {
      totalItensFatura: invoiceRows.length,
      totalValorFatura: Number(totalValorFatura.toFixed(2)),
      matchesPerfeitos,
      divergenciasValor,
      naoEncontrados,
      jaPagos,
      itens,
    };
  }
}
