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

console.log('[MyReserve] Inicializando produção com SQLite persistente.');
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

// O DATABASE_URL absoluto evita que o Prisma resolva o banco dentro do bundle Standalone.
// Não copiamos o Prisma Client nem qualquer arquivo .db para o bundle.
require(standalonePath);
