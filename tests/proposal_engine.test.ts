import { describe, it, expect } from "vitest";
import { ProposalAssembler } from "../src/lib/proposal-service";

describe("FixTur Proposal Engine 2.0 — Data Integrity & Assembler", () => {
  it("calculates exact nights for critical test case (2026-12-21 to 2026-12-30 = 9 nights)", () => {
    const checkIn = "2026-12-21";
    const checkOut = "2026-12-30";

    const nights = ProposalAssembler.calculateNights(checkIn, checkOut);
    expect(nights).toBe(9);
  });

  it("assembles ProposalViewModel with exact fields and mandatory disclaimer", () => {
    const mockCotacao = {
      id: "c8e1f5d2-1234-4567-89ab-cdef01234567",
      cliente_nome: "Alessandra Reis",
      destino: "Orlando, EUA",
      data_ida: "2026-12-21T00:00:00.000Z",
      data_volta: "2026-12-30T00:00:00.000Z",
      adultos: 2,
      criancas: 2,
      idades_criancas: "[6, 10]",
      quartos: 1,
      criado_em: "2026-08-15T12:00:00.000Z",
      usuario: {
        nome: "Alessandra Reis",
        email: "alessandra@fixtur.com.br",
      },
      hoteis: [
        {
          id: "hotel-1",
          hotel_nome: "Monreale Hotel",
          canais: [
            {
              id: "canal-1",
              categoria_quarto: "Standard Suite",
              cafe_da_manha: true,
              reembolsavel_ate: "2026-12-15T00:00:00.000Z",
              observacoes: "Quarto com vista",
              valor_final_venda: 7971.25,
              escolhido_manual: true,
            },
          ],
        },
      ],
    };

    const vm = ProposalAssembler.assemble(mockCotacao);

    expect(vm.client.name).toBe("Alessandra Reis");
    expect(vm.trip.destination).toBe("Orlando, EUA");
    expect(vm.trip.nights).toBe(9);
    expect(vm.trip.adults).toBe(2);
    expect(vm.trip.children).toBe(2);
    expect(vm.trip.childrenAges).toEqual([6, 10]);
    expect(vm.trip.rooms).toBe(1);

    expect(vm.hotels.length).toBe(1);
    expect(vm.hotels[0].hotelNome).toBe("Monreale Hotel");
    expect(vm.hotels[0].canais[0].valorFinalVenda).toBe(7971.25);
    expect(vm.hotels[0].canais[0].cafeDaManha).toBe(true);

    // Mandatory disclaimer exact check
    expect(vm.mandatoryDisclaimer).toBe(
      "Nada reservado, apenas cotado. | Valores sujeitos à alteração sem aviso prévio"
    );

    // Proposal number check
    expect(vm.proposal.number).toMatch(/^FT-PROP-2026-/);
  });

  it("handles multiple hotels with multiple options gracefully in ProposalViewModel", () => {
    const mockCotacao = {
      id: "quote-multi",
      cliente_nome: "Alessandra Reis",
      destino: "Orlando, EUA",
      data_ida: "2026-12-21T00:00:00.000Z",
      data_volta: "2026-12-30T00:00:00.000Z",
      adultos: 2,
      criancas: 0,
      idades_criancas: "[]",
      quartos: 1,
      hoteis: [
        {
          id: "hotel-1",
          hotel_nome: "Monreale Hotel",
          canais: [
            {
              id: "canal-1",
              categoria_quarto: "Standard Suite",
              cafe_da_manha: true,
              valor_final_venda: 4315.0,
              escolhido_manual: true,
            },
          ],
        },
        {
          id: "hotel-2",
          hotel_nome: "Cabana Bay Beach Resort",
          canais: [
            {
              id: "canal-2",
              categoria_quarto: "Standard Pool View",
              cafe_da_manha: false,
              valor_final_venda: 6120.0,
              escolhido_manual: true,
            },
          ],
        },
      ],
    };

    const vm = ProposalAssembler.assemble(mockCotacao);
    expect(vm.hotels.length).toBe(2);
    expect(vm.hotels[0].hotelNome).toBe("Monreale Hotel");
    expect(vm.hotels[1].hotelNome).toBe("Cabana Bay Beach Resort");
  });

  it("assembles complete Travel Quote with Multiproducts (Hotel, Flight, Transfer, Insurance, Parks)", () => {
    const mockCotacao = {
      id: "quote-multiproduct",
      cliente_nome: "Alessandra Reis",
      destino: "Orlando, EUA",
      data_ida: "2026-12-21T00:00:00.000Z",
      data_volta: "2026-12-30T00:00:00.000Z",
      adultos: 2,
      criancas: 2,
      idades_criancas: "[9, 14]",
      quartos: 1,
      hoteis: [
        {
          id: "hotel-1",
          hotel_nome: "Monreale Hotel",
          canais: [
            {
              id: "c-1",
              categoria_quarto: "Standard Suite",
              cafe_da_manha: true,
              valor_final_venda: 4315.0,
              escolhido_manual: true,
            },
          ],
        },
      ],
      sections: [
        {
          id: "sec-flight",
          product_type: "FLIGHT",
          title: "Passagens Aéreas Internacionais",
          options: [
            {
              id: "opt-f1",
              title: "Voo LATAM Guarulhos -> Orlando (Direto)",
              description: "Inclui bagagem de mão 10kg e despacho de 23kg",
              price: 8450.0,
              currency: "BRL",
              selected: true,
            },
            {
              id: "opt-f2",
              title: "Voo Copa Airlines (Conexão Panamá)",
              price: 6900.0,
              currency: "BRL",
              selected: false, // não selecionado -> deve ser filtrado
            },
          ],
        },
        {
          id: "sec-transfer",
          product_type: "TRANSFER",
          title: "Transfer Aeroporto / Hotel / Aeroporto",
          options: [
            {
              id: "opt-t1",
              title: "Van Privativa VIP (MCO -> Hotel -> MCO)",
              price: 850.0,
              currency: "BRL",
              selected: true,
            },
          ],
        },
        {
          id: "sec-insurance",
          product_type: "TRAVEL_INSURANCE",
          title: "Seguro Viagem Internacional",
          options: [
            {
              id: "opt-i1",
              title: "GTA Euro Max USD 75.000",
              description: "Cobertura médica integral com assistência Covid e cancelamento",
              price: 680.0,
              currency: "BRL",
              selected: true,
            },
          ],
        },
      ],
    };

    const vm = ProposalAssembler.assemble(mockCotacao);

    expect(vm.hotels.length).toBe(1);
    expect(vm.sections.length).toBe(3);
    expect(vm.sections[0].productType).toBe("FLIGHT");
    expect(vm.sections[0].options.length).toBe(1);
    expect(vm.sections[0].options[0].title).toBe("Voo LATAM Guarulhos -> Orlando (Direto)");
    // Segundo a ordem FixTur: 1. Aéreo, 5. Seguro, 7. Transfer
    expect(vm.sections[1].productType).toBe("TRAVEL_INSURANCE");
    expect(vm.sections[2].productType).toBe("TRANSFER");
  });

  it("strictly enforces standard business order across all travel products", () => {
    const mockCotacao = {
      id: "quote-order",
      cliente_nome: "Teste Ordem",
      destino: "Orlando",
      data_ida: "2026-12-01T00:00:00.000Z",
      data_volta: "2026-12-10T00:00:00.000Z",
      adultos: 2,
      criancas: 0,
      idades_criancas: "[]",
      quartos: 1,
      hoteis: [],
      sections: [
        { product_type: "CUSTOM_SERVICE", title: "Outros", options: [{ title: "O1", price: 10, selected: true }] },
        { product_type: "TRANSFER", title: "Transfer", options: [{ title: "T1", price: 10, selected: true }] },
        { product_type: "TICKET", title: "Ingressos", options: [{ title: "I1", price: 10, selected: true }] },
        { product_type: "TRAVEL_INSURANCE", title: "Seguro", options: [{ title: "S1", price: 10, selected: true }] },
        { product_type: "PARK", title: "Parques", options: [{ title: "P1", price: 10, selected: true }] },
        { product_type: "CAR_RENTAL", title: "Carro", options: [{ title: "C1", price: 10, selected: true }] },
        { product_type: "FLIGHT", title: "Aéreo", options: [{ title: "A1", price: 10, selected: true }] },
      ],
    };

    const vm = ProposalAssembler.assemble(mockCotacao);
    const types = vm.sections.map((s) => s.productType);

    // Ordem esperada: FLIGHT -> CAR_RENTAL -> PARK -> TRAVEL_INSURANCE -> TICKET -> TRANSFER -> CUSTOM_SERVICE
    expect(types).toEqual([
      "FLIGHT",
      "CAR_RENTAL",
      "PARK",
      "TRAVEL_INSURANCE",
      "TICKET",
      "TRANSFER",
      "CUSTOM_SERVICE",
    ]);
  });

  it("supports multiple car rental options with distinct photos and pricing", () => {
    const mockCotacao = {
      id: "quote-cars",
      cliente_nome: "Alessandra Reis",
      destino: "Miami e Orlando",
      data_ida: "2026-12-01T00:00:00.000Z",
      data_volta: "2026-12-10T00:00:00.000Z",
      adultos: 4,
      criancas: 0,
      idades_criancas: "[]",
      quartos: 1,
      hoteis: [],
      sections: [
        {
          id: "sec-cars",
          product_type: "CAR_RENTAL",
          title: "Locação de Carros",
          options: [
            {
              id: "car-1",
              title: "SUV Intermediário (Jeep Compass ou similar)",
              photo_url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
              price: 2450.0,
              currency: "BRL",
              selected: true,
              description: "Câmbio automático, ar condicionado, km livre e proteção total.",
            },
            {
              id: "car-2",
              title: "Minivan 7 Lugares (Chrysler Pacifica ou similar)",
              photo_url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
              price: 3890.0,
              currency: "BRL",
              selected: true,
              description: "Espaço amplo para 7 pessoas e 5 malas grandes.",
            },
          ],
        },
      ],
    };

    const vm = ProposalAssembler.assemble(mockCotacao);
    expect(vm.sections.length).toBe(1);
    expect(vm.sections[0].productType).toBe("CAR_RENTAL");
    expect(vm.sections[0].options.length).toBe(2);
    expect(vm.sections[0].options[0].title).toContain("SUV Intermediário");
    expect(vm.sections[0].options[0].photoUrl).toBeDefined();
    expect(vm.sections[0].options[1].title).toContain("Minivan 7 Lugares");
    expect(vm.sections[0].options[1].price).toBe(3890.0);
  });
});
