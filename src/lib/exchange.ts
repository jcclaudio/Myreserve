/**
 * RN-09 — Cotação automática de câmbio (AwesomeAPI)
 */

export interface ExchangeRatesResult {
  success: boolean;
  usd?: number;
  eur?: number;
  atualizadoEm?: string;
  error?: string;
}

export async function buscarCotacoesCambio(): Promise<ExchangeRatesResult> {
  const url =
    process.env.EXCHANGE_API_URL ||
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Serviço de câmbio respondeu com status ${response.status}. Preencha as cotações manualmente.`,
      };
    }

    const data = await response.json();

    const usdAsk = data?.USDBRL?.ask;
    const eurAsk = data?.EURBRL?.ask;

    if (!usdAsk || !eurAsk) {
      return {
        success: false,
        error: "Resposta do serviço de câmbio incompleta. Preencha as cotações manualmente.",
      };
    }

    return {
      success: true,
      usd: parseFloat(parseFloat(usdAsk).toFixed(4)),
      eur: parseFloat(parseFloat(eurAsk).toFixed(4)),
      atualizadoEm: data?.USDBRL?.create_date || new Date().toISOString(),
    };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return {
      success: false,
      error: isTimeout
        ? "Tempo limite esgotado ao buscar cotação de câmbio online. Preencha manualmente."
        : "Não foi possível conectar à API de câmbio. Preencha manualmente as cotações.",
    };
  }
}
