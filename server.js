// ==============================================================================
// SERVER.JS — INICIALIZADOR AUTÔNOMO UNIVERSAL PARA NEXT.JS & ICP INTEGRATOR
// ==============================================================================
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 1. Configuração de ambiente
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'myreserve-secret-token-key-travel-agency-2026';
process.env.NODE_ENV = 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOSTNAME = '0.0.0.0';

console.log('[FixTur] Inicializando ambiente em produção...');

// 2. Garantir que o arquivo .env existe para o Prisma CLI
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  try {
    fs.writeFileSync(
      envPath,
      `DATABASE_URL="${process.env.DATABASE_URL}"\nJWT_SECRET="${process.env.JWT_SECRET}"\nNODE_ENV=production\nPORT=${PORT}\n`
    );
    console.log('[FixTur] Arquivo .env gerado com sucesso.');
  } catch (err) {
    console.warn('[FixTur] Aviso ao criar .env:', err.message);
  }
}

// 3. Garantir Prisma Client e Banco de Dados SQLite
try {
  console.log('[FixTur] Verificando Prisma Client e Banco de Dados...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  if (fs.existsSync(path.join(__dirname, 'prisma', 'seed.js'))) {
    try {
      execSync('node prisma/seed.js', { stdio: 'inherit' });
    } catch (e) {
      // Ignora se os dados já existirem
    }
  }
} catch (err) {
  console.warn('[FixTur] Aviso na inicialização do Prisma:', err.message);
}

// 4. Se a compilação .next não existir, compila automaticamente
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  console.log('[FixTur] Compilação .next não encontrada. Executando build de produção agora...');
  try {
    execSync('npx next build', { stdio: 'inherit' });
  } catch (err) {
    console.error('[FixTur] Erro no build do Next.js:', err.message);
  }
}

// 5. Iniciar Servidor Web
console.log(`[FixTur] Iniciando Next.js em http://${HOSTNAME}:${PORT}...`);
const next = require('next');
const app = next({ dev: false, hostname: HOSTNAME, port: PORT });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        handle(req, res);
      })
      .listen(PORT, HOSTNAME, () => {
        console.log(`=======================================================`);
        console.log(`🚀 FixTur / MyReserve ONLINE com sucesso na porta ${PORT}!`);
        console.log(`=======================================================`);
      });
  })
  .catch((err) => {
    console.error('[FixTur] Erro fatal ao iniciar o servidor:', err);
    process.exit(1);
  });
