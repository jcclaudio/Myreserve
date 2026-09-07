/**
 * Sanitizador de valores CSV para prevenção contra CSV Injection / Formula Injection (CWE-1236).
 * Impede que caracteres perigosos como '=', '+', '-', '@', '\t', '\r' no início de células
 * sejam interpretados como fórmulas ou comandos executáveis por softwares como Excel ou Google Sheets.
 */

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Se o campo começa com caracteres perigosos de fórmula, prefixa com apóstrofo (')
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapa aspas duplas internas
  if (str.includes('"') || str.includes(";") || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function buildCsvRow(cells: any[], separator: string = ";"): string {
  return cells.map((cell) => sanitizeCsvCell(cell)).join(separator);
}
