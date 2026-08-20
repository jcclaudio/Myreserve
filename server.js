const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { configureRuntime, requireJwtSecret } = require('./scripts/runtime-config');

const projectRoot = __dirname;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.PORT = process.env.PORT || '3000';

configureRuntime({ projectRoot });
requireJwtSecret();

console.log('[MyReserve] Inicializando aplicação...');
execFileSync(process.execPath, [path.join(projectRoot, 'scripts', 'prepare-database.js')], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

const buildIdPath = path.join(projectRoot, '.next', 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.log('[MyReserve] Build de produção ausente; executando next build.');
  const nextCli = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  execFileSync(process.execPath, [nextCli, 'build'], { cwd: projectRoot, env: process.env, stdio: 'inherit' });
}

const standalonePath = path.join(projectRoot, '.next', 'standalone', 'server.js');
if (!fs.existsSync(standalonePath)) {
  throw new Error('Bundle Standalone não encontrado após o build.');
}

function copyStandaloneAssets(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Asset obrigatório ausente: ${path.relative(projectRoot, source)}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

const standaloneDirectory = path.dirname(standalonePath);
copyStandaloneAssets(path.join(projectRoot, 'public'), path.join(standaloneDirectory, 'public'));
copyStandaloneAssets(path.join(projectRoot, '.next', 'static'), path.join(standaloneDirectory, '.next', 'static'));

// O DATABASE_URL absoluto evita que o Prisma resolva o banco dentro do bundle Standalone.
// Copiamos somente assets estáticos; Prisma Client e arquivos .db permanecem fora do bundle.
require(standalonePath);
