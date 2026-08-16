import { NextResponse } from "next/server";
import { buscarCotacoesCambio } from "@/lib/exchange";

export const dynamic = "force-dynamic";

export async function GET() {
  const resultado = await buscarCotacoesCambio();
  return NextResponse.json(resultado);
}
