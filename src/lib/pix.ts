/**
 * FIX TURISMO — PIX ENGINE 2.0 (PADRÃO BANCO CENTRAL DO BRASIL / EMV QRCPS-MPM)
 * Gera Payload Copia-e-Cola e dados para QR Code dinâmico sem dependências externas.
 */

export interface PixPayloadParams {
  chavePix: string; // E-mail, CPF/CNPJ, Telefone ou Chave Aleatória
  beneficiarioNome: string; // Até 25 caracteres (ex: FIX TURISMO)
  beneficiarioCidade: string; // Até 15 caracteres (ex: SAO PAULO)
  valor: number; // Valor em BRL (ex: 1500.50)
  txId?: string; // Identificador da transação / Parcela (ex: VEN2026001P1)
  descricao?: string; // Descrição opcional da cobrança
}

export class PixEngine {
  /**
   * Remove acentos e caracteres especiais para compatibilidade com o padrão EMV
   */
  private static sanitize(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim();
  }

  /**
   * Formata um campo TLV (Tag-Length-Value) do padrão EMV
   */
  private static formatTLV(tag: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${tag}${len}${value}`;
  }

  /**
   * Calcula o CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
   */
  private static calculateCRC16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  /**
   * Gera o código PIX Copia-e-Cola completo validado pelo Banco Central
   */
  static generatePayload(params: PixPayloadParams): string {
    const chave = params.chavePix.trim();
    const nome = this.sanitize(params.beneficiarioNome || "FIX TURISMO").slice(0, 25);
    const cidade = this.sanitize(params.beneficiarioCidade || "SAO PAULO").slice(0, 15);
    const valorStr = params.valor.toFixed(2);
    const txId = (params.txId || "FIXTUR").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);

    // 00 - Payload Format Indicator (01)
    let payload = this.formatTLV("00", "01");

    // 26 - Merchant Account Information (GUI + Chave + Info Adicional)
    const gui = this.formatTLV("00", "br.gov.bcb.pix");
    const key = this.formatTLV("01", chave);
    let merchantAccount = `${gui}${key}`;

    if (params.descricao) {
      const info = this.formatTLV("02", this.sanitize(params.descricao).slice(0, 40));
      merchantAccount += info;
    }
    payload += this.formatTLV("26", merchantAccount);

    // 52 - Merchant Category Code (0000 = Geral)
    payload += this.formatTLV("52", "0000");

    // 53 - Transaction Currency (986 = BRL)
    payload += this.formatTLV("53", "986");

    // 54 - Transaction Amount
    payload += this.formatTLV("54", valorStr);

    // 58 - Country Code (BR)
    payload += this.formatTLV("58", "BR");

    // 59 - Merchant Name
    payload += this.formatTLV("59", nome);

    // 60 - Merchant City
    payload += this.formatTLV("60", cidade);

    // 62 - Additional Data Field (TxID)
    const txIdTLV = this.formatTLV("05", txId);
    payload += this.formatTLV("62", txIdTLV);

    // 63 - CRC16 (Tag + Tamanho 04)
    payload += "6304";
    const crc = this.calculateCRC16(payload);

    return `${payload}${crc}`;
  }

  /**
   * Gera uma URL de QR Code compatível com qualquer biblioteca de imagem ou SVG
   */
  static getQrCodeUrl(payload: string, size: number = 300): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
      payload
    )}`;
  }
}
