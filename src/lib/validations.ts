import { z } from "zod";

export const MoedaEnum = z.enum(["BRL", "USD", "EUR"]);

export const CanalCotadoSchema = z.object({
  id: z.string().optional(),
  hotel_cotado_id: z.string().optional(),
  canal_nome: z.string().min(1, "Nome do canal é obrigatório"),
  valor_mostrado: z.number().gt(0, "Valor mostrado deve ser maior que zero"),
  taxas: z.number().min(0, "Taxas não podem ser negativas").default(0).optional(),
  moeda: MoedaEnum,
  comissao_fornecedor_pct: z
    .number()
    .min(0, "Comissão do fornecedor não pode ser negativa")
    .max(100, "Comissão do fornecedor deve ser no máximo 100%"),
  comissao_venda_pct: z
    .number()
    .min(0, "Comissão de venda não pode ser negativa")
    .max(99.99, "Comissão de venda deve ser menor que 100%"),
  categoria_quarto: z.string().min(1, "Categoria do quarto é obrigatória"),
  cafe_da_manha: z.boolean(),
  reembolsavel_ate: z.string().nullable().optional(),
  observacoes: z.string().optional().default(""),
  escolhido_manual: z.boolean().optional().default(false),
});

export const HotelCotadoSchema = z.object({
  id: z.string().optional(),
  cotacao_id: z.string().optional(),
  hotel_nome: z.string().min(1, "Nome do hotel é obrigatório"),
  link_hotel: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  ordem_exibicao: z.number().int().optional().default(0),
  canais: z.array(CanalCotadoSchema).min(1, "Todo hotel cotado deve ter pelo menos um canal de venda"),
});

export const CotacaoSchema = z
  .object({
    id: z.string().optional(),
    cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
    destino: z.string().min(1, "Destino é obrigatório"),
    data_ida: z.string().min(1, "Data de ida é obrigatória"),
    data_volta: z.string().min(1, "Data de volta é obrigatória"),
    adultos: z.number().int().min(1, "Deve haver no mínimo 1 adulto"),
    criancas: z.number().int().min(0, "Número de crianças não pode ser negativo").default(0),
    idades_criancas: z.array(z.number().int().min(0).max(17)).default([]),
    quartos: z.number().int().min(1, "Deve haver no mínimo 1 quarto"),
    cotacao_usd: z.number().gt(0, "Cotação do USD deve ser maior que zero"),
    cotacao_eur: z.number().gt(0, "Cotação do EUR deve ser maior que zero"),
    comissao_padrao_agencia_pct: z
      .number()
      .min(0, "Comissão padrão não pode ser negativa")
      .max(99.99, "Comissão padrão deve ser menor que 100%"),
    hoteis: z.array(HotelCotadoSchema).optional().default([]),
    sections: z.array(z.any()).optional().default([]),
  })
  .refine(
    (data) => {
      const ida = new Date(data.data_ida);
      const volta = new Date(data.data_volta);
      return ida < volta;
    },
    {
      message: "Data de volta deve ser posterior à data de ida",
      path: ["data_volta"],
    }
  )
  .refine(
    (data) => {
      return (data.idades_criancas || []).length === (data.criancas || 0);
    },
    {
      message: "A quantidade de idades informadas deve corresponder exatamente ao número de crianças",
      path: ["idades_criancas"],
    }
  );

export const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
});

export const CadastroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
});

export const TipoTransacaoEnum = z.enum(["RECEITA", "DESPESA"]);
export const CategoriaTransacaoEnum = z.enum([
  "VENDA_CLIENTE",
  "PAGAMENTO_FORNECEDOR",
  "COMISSAO_AGENCIA",
  "TAXA_CAMBIO_IOF",
  "REEMBOLSO",
  "DESPESA_OPERACIONAL",
  "OUTRO",
]);
export const StatusTransacaoEnum = z.enum(["PENDENTE", "PAGO", "CANCELADO"]);
export const MetodoPagamentoEnum = z.enum([
  "PIX",
  "CARTAO_CREDITO",
  "BOLETO",
  "TRANSFERENCIA",
  "FATURADO",
  "DINHEIRO",
]);

export const TransacaoFinanceiraSchema = z.object({
  id: z.string().optional(),
  descricao: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres"),
  tipo: TipoTransacaoEnum,
  categoria: CategoriaTransacaoEnum,
  valor_original: z.number().gt(0, "Valor deve ser maior que zero"),
  moeda_original: MoedaEnum.default("BRL"),
  cotacao_cambio: z.number().gt(0, "Câmbio deve ser maior que zero").default(1.0),
  status: StatusTransacaoEnum.default("PENDENTE"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  data_pagamento: z.string().nullable().optional(),
  metodo_pagamento: MetodoPagamentoEnum.default("PIX"),
  comprovante_ref: z.string().optional().default(""),
  observacoes: z.string().optional().default(""),
  cotacao_id: z.string().nullable().optional(),
});

