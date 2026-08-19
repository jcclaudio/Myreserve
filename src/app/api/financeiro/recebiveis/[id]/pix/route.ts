import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PixEngine } from "@/lib/pix";

export const dynamic = "force-dynamic";

// GET /api/financeiro/recebiveis/[id]/pix -> Gera cobrança PIX com QR Code e Copia-e-Cola
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const receivable = await prisma.receivable.findUnique({
      where: { id: params.id },
      include: {
        sale: {
          select: {
            sale_number: true,
            cliente_nome: true,
            cliente_telefone: true,
            destino: true,
          },
        },
      },
    });

    if (!receivable) {
      return NextResponse.json(
        { error: "Conta a receber não encontrada." },
        { status: 404 }
      );
    }

    const chavePix = process.env.PIX_CHAVE_PADRAO || "financeiro@fixturismo.com.br";
    const beneficiario = process.env.PIX_BENEFICIARIO_NOME || "FIX TURISMO";
    const cidade = process.env.PIX_BENEFICIARIO_CIDADE || "SAO PAULO";
    const valor = receivable.saldo || receivable.valor_parcela;

    // TxID limpo e único
    const cleanSaleNumber = (receivable.sale?.sale_number || "VENDA").replace(/[^A-Za-z0-9]/g, "");
    const txId = `${cleanSaleNumber}P${receivable.numero_parcela}`.slice(0, 25);

    const payloadPix = PixEngine.generatePayload({
      chavePix,
      beneficiarioNome: beneficiario,
      beneficiarioCidade: cidade,
      valor,
      txId,
      descricao: `Parcela ${receivable.numero_parcela}/${receivable.total_parcelas} - FixTur`,
    });

    const qrCodeUrl = PixEngine.getQrCodeUrl(payloadPix);

    const formatBRL = (val: number) =>
      val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const mensagemWhatsApp = `Olá, *${receivable.sale?.cliente_nome || "Cliente"}*! 👋\n\nSegue o código PIX para pagamento da sua viagem com a *Fix Turismo*:\n\n` +
      `📌 *Reserva:* ${receivable.sale?.sale_number || "Viagem"}\n` +
      `📍 *Destino:* ${receivable.sale?.destino || "Viagem"}\n` +
      `📅 *Parcela:* ${receivable.numero_parcela}/${receivable.total_parcelas}\n` +
      `💰 *Valor:* ${formatBRL(valor)}\n` +
      `⏰ *Vencimento:* ${new Date(receivable.data_vencimento).toLocaleDateString("pt-BR")}\n\n` +
      `🔑 *PIX Copia-e-Cola:*\n\`\`\`${payloadPix}\`\`\`\n\n` +
      `_Fix Turismo — Experiências VIP & Viagens Sob Medida_`;

    return NextResponse.json({
      success: true,
      pix: {
        receivable_id: receivable.id,
        sale_number: receivable.sale?.sale_number,
        cliente_nome: receivable.sale?.cliente_nome,
        valor,
        parcela: `${receivable.numero_parcela}/${receivable.total_parcelas}`,
        vencimento: receivable.data_vencimento,
        chave_pix: chavePix,
        beneficiario,
        payload_copia_cola: payloadPix,
        qrcode_url: qrCodeUrl,
        mensagem_whatsapp: mensagemWhatsApp,
      },
    });
  } catch (err: any) {
    console.error("Erro ao gerar cobrança PIX:", err);
    return NextResponse.json(
      { error: "Erro interno ao gerar cobrança PIX." },
      { status: 500 }
    );
  }
}
