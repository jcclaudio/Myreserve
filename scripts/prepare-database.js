const { execFileSync } = require('child_process');
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

runPrisma(['generate']);
// Não há migrations versionadas neste projeto. db push sem force-reset preserva os dados existentes.
runPrisma(['db', 'push', '--skip-generate']);
execFileSync(process.execPath, [path.join(projectRoot, 'prisma', 'seed.js')], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});
