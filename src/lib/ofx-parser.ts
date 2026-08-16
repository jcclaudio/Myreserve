/**
 * 💳 PARSER DE EXTRATO BANCÁRIO OFX (OPEN FINANCIAL EXCHANGE)
 * Extração determinística de transações bancárias para conciliação automática.
 */

export interface OfxTransacao {
  tipo: "CREDITO" | "DEBITO";
  data: Date;
  valor: number;
  idTransacao: string;
  memo: string;
}

export interface OfxResultado {
  bancoId?: string;
  contaId?: string;
  transacoes: OfxTransacao[];
  totalCreditos: number;
  totalDebitos: number;
}

export function parseOfx(conteudoOfx: string): OfxResultado {
  const transacoes: OfxTransacao[] = [];
  let totalCreditos = 0;
  let totalDebitos = 0;

  // Regex para blocos de transação <STMTTRN>...</STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi;
  let match;

  while ((match = trnRegex.exec(conteudoOfx)) !== null) {
    const bloco = match[1];

    const trntypeMatch = /<TRNTYPE>([^\r\n<]+)/i.exec(bloco);
    const dtpostedMatch = /<DTPOSTED>([0-9]{8})/i.exec(bloco);
    const trnamtMatch = /<TRNAMT>([^\r\n<]+)/i.exec(bloco);
    const fitidMatch = /<FITID>([^\r\n<]+)/i.exec(bloco);
    const memoMatch = /<MEMO>([^\r\n<]+)/i.exec(bloco);

    const valorRaw = trnamtMatch ? parseFloat(trnamtMatch[1].replace(",", ".")) : 0;
    const valor = Math.abs(valorRaw);
    const tipo = valorRaw >= 0 ? "CREDITO" : "DEBITO";

    let dataTransacao = new Date();
    if (dtpostedMatch) {
      const y = parseInt(dtpostedMatch[1].substring(0, 4), 10);
      const m = parseInt(dtpostedMatch[1].substring(4, 6), 10) - 1;
      const d = parseInt(dtpostedMatch[1].substring(6, 8), 10);
      dataTransacao = new Date(Date.UTC(y, m, d));
    }

    if (tipo === "CREDITO") totalCreditos += valor;
    else totalDebitos += valor;

    transacoes.push({
      tipo,
      data: dataTransacao,
      valor,
      idTransacao: fitidMatch ? fitidMatch[1].trim() : Math.random().toString(36).substring(7),
      memo: memoMatch ? memoMatch[1].trim() : "Transação Bancária",
    });
  }

  return {
    transacoes,
    totalCreditos,
    totalDebitos,
  };
}
