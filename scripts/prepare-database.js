const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { configureRuntime } = require('./runtime-config');

const projectRoot = path.resolve(__dirname, '..');
configureRuntime({ projectRoot });

const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
const runPrisma = (args) => execFileSync(process.execPath, [prismaCli, ...args], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

// Apenas executa generate se o Prisma Client ainda não existir (em build/dev)
const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma', 'client', 'index.js');
if (!fs.existsSync(prismaClientPath)) {
  try {
    runPrisma(['generate']);
  } catch (err) {
    console.warn('[MyReserve] Aviso: prisma generate não pôde ser executado no runtime:', err.message);
  }
}

// Não há migrations versionadas neste projeto. db push sem force-reset preserva os dados existentes.
runPrisma(['db', 'push', '--skip-generate']);
execFileSync(process.execPath, [path.join(projectRoot, 'prisma', 'seed.js')], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});
