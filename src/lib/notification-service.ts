/**
 * 📲 SERVIÇO DE NOTIFICAÇÕES E ALERTAS FIXTUR
 * Formatação e integração de mensagens operacionais e financeiras para WhatsApp e Webhooks.
 */

export interface TicketAlertData {
  ticketNumber: string;
  titulo: string;
  categoria: string;
  prioridade: string;
  clienteNome: string;
  slaMinutos: number;
  slaLimite: Date;
}

export interface SaleConfirmationData {
  saleNumber: string;
  clienteNome: string;
  destino: string;
  dataInicio: Date;
  dataFim: Date;
  gmv: number;
  consultorNome: string;
}

export class NotificationService {
  /**
   * Gera texto formatado para envio de Alerta de Chamado / SLA Crítico via WhatsApp
   */
  static formatSlaAlertWhatsApp(ticket: TicketAlertData): string {
    const limiteFormatado = new Date(ticket.slaLimite).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `🚨 *ALERTA OPERACIONAL — SUPORTE A VIAGEM*\n\n`;
    msg += `🎫 *Chamado:* #${ticket.ticketNumber}\n`;
    msg += `⚠️ *Prioridade:* ${ticket.prioridade}\n`;
    msg += `⏱️ *SLA:* ${ticket.slaMinutos} minutos (Limite: ${limiteFormatado})\n\n`;
    msg += `👤 *Passageiro:* ${ticket.clienteNome}\n`;
    msg += `📋 *Ocorrência:* ${ticket.titulo}\n`;
    msg += `🏷️ *Categoria:* ${ticket.categoria}\n\n`;
    msg += `Acesse a Central de Operações imediatamente para atendimento.`;

    return msg;
  }

  /**
   * Gera texto formatado para envio de Confirmação de Venda ao Cliente
   */
  static formatSaleConfirmationWhatsApp(sale: SaleConfirmationData): string {
    const ida = new Date(sale.dataInicio).toLocaleDateString("pt-BR");
    const volta = new Date(sale.dataFim).toLocaleDateString("pt-BR");
    const valor = sale.gmv.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    let msg = `🎉 *RESERVA CONFIRMADA — FIXTUR TURISMO*\n\n`;
    msg += `Olá, *${sale.clienteNome}*!\n`;
    msg += `Sua viagem para *${sale.destino}* foi confirmada com sucesso.\n\n`;
    msg += `📌 *Código da Reserva:* ${sale.saleNumber}\n`;
    msg += `📅 *Período:* ${ida} a ${volta}\n`;
    msg += `💰 *Valor Total:* ${valor}\n\n`;
    msg += `Seu consultor dedicado é *${sale.consultorNome}*.\n`;
    msg += `Desejamos uma excelente viagem! ✈️🏖️`;

    return msg;
  }
}
