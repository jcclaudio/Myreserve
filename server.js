// ==============================================================================
// SERVER.JS — INICIALIZADOR UNIVERSAL COMPATÍVEL COM PAINEL INTEGRATOR NODE.JS
// ==============================================================================
const path = require('path');
const fs = require('fs');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  // Execução direta do standalone otimizado gerado pelo Next.js
  process.env.PORT = process.env.PORT || '3000';
  process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
  require(standaloneServer);
} else {
  // Fallback padrão Next.js
  const { createServer } = require('http');
  const next = require('next');

  const dev = process.env.NODE_ENV !== 'production';
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

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
