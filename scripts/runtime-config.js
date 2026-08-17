const fs = require('fs');
const path = require('path');

function parseEnvironmentFile(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '').trim();
    values[key] = value;
  }
  return values;
}

function loadEnvironmentFile(envFilePath) {
  if (!envFilePath || !fs.existsSync(envFilePath)) return false;
  const values = parseEnvironmentFile(fs.readFileSync(envFilePath, 'utf8'));
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

function loadRuntimeEnvironment(projectRoot) {
  const candidates = [process.env.ENV_FILE, '/.env', path.join(projectRoot, '.env')].filter(Boolean);
  for (const candidate of candidates) {
    if (loadEnvironmentFile(candidate)) return candidate;
  }
  return null;
}

function getSqliteDatabasePath(databaseUrl) {
  if (typeof databaseUrl !== 'string' || !databaseUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL deve usar o formato SQLite file:.');
  }
  const filePath = databaseUrl.slice('file:'.length);
  if (!filePath || filePath.includes('?') || filePath.includes('#')) {
    throw new Error('DATABASE_URL SQLite deve referenciar somente um arquivo de banco.');
  }
  return decodeURIComponent(filePath);
}

function configureRuntime({ projectRoot, production } = {}) {
  loadRuntimeEnvironment(projectRoot);
  const isProduction = production === undefined ? process.env.NODE_ENV === 'production' : production;
  const databaseUrl = process.env.DATABASE_URL;
  const databasePath = getSqliteDatabasePath(databaseUrl);
  const isAbsolutePath = path.posix.isAbsolute(databasePath) || path.win32.isAbsolute(databasePath);
  if (isProduction && !isAbsolutePath) {
    throw new Error('Em produção, DATABASE_URL deve apontar para um caminho SQLite absoluto e persistente.');
  }
  if (isProduction) fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  return { databaseUrl, databasePath };
}

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_SECRET com ao menos 32 caracteres é obrigatório.');
  }
  return secret;
}

module.exports = { configureRuntime, getSqliteDatabasePath, loadRuntimeEnvironment, parseEnvironmentFile, requireJwtSecret };
