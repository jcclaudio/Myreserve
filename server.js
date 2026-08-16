// ==============================================================================
// SERVER.JS — INICIALIZADOR AUTÔNOMO UNIVERSAL PARA NEXT.JS & ICP INTEGRATOR
// ==============================================================================
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Função auxiliar para copiar pastas recursivamente
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  const elements = fs.readdirSync(from);
  for (const element of elements) {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

// 1. Sanitização e Validação Robusta do DATABASE_URL para SQLite (Garante protocolo "file:")
let dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
if (
  !dbUrl.startsWith('file:') &&
  !dbUrl.startsWith('postgresql://') &&
  !dbUrl.startsWith('postgres://') &&
  !dbUrl.startsWith('mysql://')
) {
  dbUrl = `file:${dbUrl}`;
}
process.env.DATABASE_URL = dbUrl;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'myreserve-secret-token-key-travel-agency-2026';
process.env.NODE_ENV = 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOSTNAME = '0.0.0.0';

console.log(`[FixTur] Inicializando ambiente em produção...`);
console.log(`[FixTur] DATABASE_URL configurada: ${process.env.DATABASE_URL}`);

// 2. Garantir que o arquivo .env existe e contém o formato com "file:"
const envPath = path.join(__dirname, '.env');
try {
  fs.writeFileSync(
    envPath,
    `DATABASE_URL="${process.env.DATABASE_URL}"\nJWT_SECRET="${process.env.JWT_SECRET}"\nNODE_ENV=production\nPORT=${PORT}\n`
  );
  console.log('[FixTur] Arquivo .env sincronizado com protocolo file: válido.');
} catch (err) {
  console.warn('[FixTur] Aviso ao sincronizar .env:', err.message);
}

// 3. Garantir Prisma Client e Banco de Dados SQLite
try {
  console.log('[FixTur] Verificando Prisma Client e Banco de Dados SQLite...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: __dirname });
  if (fs.existsSync(path.join(__dirname, 'prisma', 'seed.js'))) {
    try {
      execSync('node prisma/seed.js', { stdio: 'inherit', cwd: __dirname });
    } catch (e) {
      // Ignora se os dados já existirem
    }
  }
} catch (err) {
  console.warn('[FixTur] Aviso na inicialização do Prisma:', err.message);
}

// 3.1 Sincronizar o Prisma Client recém-gerado (engine nativo desta plataforma) para dentro
// do bundle Standalone. O build do Next.js pode ter sido empacotado em outro SO (ex: Windows),
// deixando ali um query engine incompatível com o Linux da VPS — isso quebra toda chamada ao
// banco (ex: 500 no login) mesmo com o Prisma Client da raiz já correto.
try {
  const standaloneNodeModules = path.join(__dirname, '.next', 'standalone', 'node_modules');
  if (fs.existsSync(standaloneNodeModules)) {
    console.log('[FixTur] Sincronizando Prisma Client nativo para o bundle Standalone...');
    fs.rmSync(path.join(standaloneNodeModules, '.prisma'), { recursive: true, force: true });
    fs.rmSync(path.join(standaloneNodeModules, '@prisma', 'client'), { recursive: true, force: true });
    copyFolderSync(
      path.join(__dirname, 'node_modules', '.prisma'),
      path.join(standaloneNodeModules, '.prisma')
    );
    copyFolderSync(
      path.join(__dirname, 'node_modules', '@prisma', 'client'),
      path.join(standaloneNodeModules, '@prisma', 'client')
    );
    console.log('[FixTur] Prisma Client do Standalone sincronizado com sucesso.');
  }
} catch (err) {
  console.warn('[FixTur] Aviso ao sincronizar Prisma Client do Standalone:', err.message);
}

// 4. Verificação robusta de build de produção (.next/BUILD_ID)
function ensureProductionBuild() {
  const buildIdPath = path.join(__dirname, '.next', 'BUILD_ID');

  if (!fs.existsSync(buildIdPath)) {
    console.log('[FixTur] Build de produção não encontrado (.next/BUILD_ID ausente). Executando "npx next build"...');
    try {
      execSync('npx next build', { stdio: 'inherit', cwd: __dirname });
      console.log('[FixTur] Build de produção concluído com sucesso.');
    } catch (err) {
      console.error('[FixTur] Erro fatal ao executar o build de produção:', err);
      process.exit(1);
    }
  } else {
    console.log('[FixTur] Build de produção já existente (.next/BUILD_ID verificado). Pulando etapa de build.');
  }

  // 4.1 Sincronização obrigatória de arquivos estáticos para o modo Standalone do Next.js
  const standaloneDir = path.join(__dirname, '.next', 'standalone');
  if (fs.existsSync(standaloneDir)) {
    console.log('[FixTur] Sincronizando arquivos estáticos (.next/static e public) para o servidor Standalone...');
    const staticSrc = path.join(__dirname, '.next', 'static');
    const staticDest = path.join(standaloneDir, '.next', 'static');
    copyFolderSync(staticSrc, staticDest);

    const publicSrc = path.join(__dirname, 'public');
    const publicDest = path.join(standaloneDir, 'public');
    copyFolderSync(publicSrc, publicDest);
    console.log('[FixTur] Arquivos estáticos sincronizados com sucesso.');
  }
}

ensureProductionBuild();

// 5. Iniciar Servidor Web Next.js
console.log(`[FixTur] Iniciando Next.js em http://${HOSTNAME}:${PORT}...`);

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
if (fs.existsSync(standalonePath)) {
  console.log(`=======================================================`);
  console.log(`🚀 FixTur / MyReserve ONLINE em modo Standalone na porta ${PORT}!`);
  console.log(`=======================================================`);
  require(standalonePath);
} else {
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
}
