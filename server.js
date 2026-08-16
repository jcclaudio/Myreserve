// ==============================================================================
// SERVER.JS — INICIALIZADOR UNIVERSAL COMPATÍVEL COM PAINEL INTEGRATOR NODE.JS
// ==============================================================================
const path = require('path');
const fs = require('fs');

// Garantir variáveis padrão caso não tenham sido injetadas no ambiente
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "fixtur-secret-super-secure-jwt-key-2026";
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Se o arquivo .env não existir fisicamente, cria um para o Prisma CLI
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  try {
    fs.writeFileSync(
      envPath,
      `DATABASE_URL="${process.env.DATABASE_URL}"\nJWT_SECRET="${process.env.JWT_SECRET}"\nNODE_ENV=production\nPORT=${process.env.PORT}\n`
    );
  } catch (e) {
    // Silently ignore if read-only
  }
}

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  // Execução direta do standalone otimizado gerado pelo Next.js
  require(standaloneServer);
} else {
  // Fallback padrão Next.js
  const { createServer } = require('http');
  const next = require('next');

  const dev = process.env.NODE_ENV !== 'production';
  const hostname = process.env.HOSTNAME;
  const port = parseInt(process.env.PORT, 10);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error('[FixTur] Erro na requisição:', err);
        res.statusCode = 500;
        res.end('Erro interno do servidor');
      }
    }).listen(port, hostname, () => {
      console.log(`[FixTur] Servidor rodando em http://${hostname}:${port}`);
    });
  });
}
