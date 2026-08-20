const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const email = (process.env.SEED_ADMIN_EMAIL || "agente@myreserve.com.br").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const nome = process.env.SEED_ADMIN_NAME || "Administrador MyReserve";

  const senha_hash = await bcrypt.hash(password, 10);

  // Upsert garante a criação ou atualização da senha
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      nome,
      senha_hash,
      role: "ADMIN",
      ativo: true,
    },
    create: {
      nome,
      email,
      senha_hash,
      role: "ADMIN",
      ativo: true,
    },
  });

  console.log(`Usuário ${usuario.email} configurado com sucesso com a senha solicitada.`);

  // Criar cotação inicial baseada no Caso de Teste 1 do Prompt Mestre
  const cotacaoExistente = await prisma.cotacao.findFirst({
    where: { cliente_nome: "Cliente Referência - Caso 1" },
  });

  if (!cotacaoExistente) {
    const cotacao = await prisma.cotacao.create({
      data: {
        criado_por_usuario_id: usuario.id,
        cliente_nome: "Cliente Referência - Caso 1",
        destino: "Paris, França",
        data_ida: new Date("2026-09-10"),
        data_volta: new Date("2026-09-17"),
        adultos: 2,
        criancas: 0,
        idades_criancas: "[]",
        quartos: 1,
        cotacao_usd: 5.45,
        cotacao_eur: 5.91,
        comissao_padrao_agencia_pct: 6.0,
        hoteis: {
          create: [
            {
              hotel_nome: "Hôtel Plaza Athénée",
              ordem_exibicao: 0,
              canais: {
                create: [
                  {
                    canal_nome: "Booking.com",
                    valor_mostrado: 10294.19,
                    moeda: "EUR",
                    comissao_fornecedor_pct: 14.0,
                    comissao_venda_pct: 6.0,
                    categoria_quarto: "Deluxe Junior Suite",
                    cafe_da_manha: true,
                    reembolsavel_ate: new Date("2026-09-01"),
                    observacoes: "Cancelamento gratuito até 01/09",
                    escolhido_manual: true,
                    valor_comissao: 1441.19,
                    custo_liquido: 8853.0,
                    cotacao_utilizada: 5.91,
                    custo_em_brl: 52321.25,
                    valor_final_venda: 55660.9,
                    menor_custo_do_grupo: true,
                    maior_venda_do_grupo: true,
                  },
                  {
                    canal_nome: "Interep",
                    valor_mostrado: 10800.0,
                    moeda: "EUR",
                    comissao_fornecedor_pct: 12.0,
                    comissao_venda_pct: 6.0,
                    categoria_quarto: "Deluxe Junior Suite",
                    cafe_da_manha: true,
                    reembolsavel_ate: null,
                    observacoes: "Tarifa não reembolsável",
                    escolhido_manual: false,
                    valor_comissao: 1296.0,
                    custo_liquido: 9504.0,
                    cotacao_utilizada: 5.91,
                    custo_em_brl: 56168.64,
                    valor_final_venda: 59753.87,
                    menor_custo_do_grupo: false,
                    maior_venda_do_grupo: false,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.log("Cotação modelo criada com ID:", cotacao.id);
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
