#!/bin/bash
# ==============================================================================
# SCRIPT AUTOMATIZADO DE DEPLOY — INTEGRATOR VPS / NODE.JS
# ==============================================================================

set -e

echo "🚀 [1/5] Iniciando Deploy do FixTur / MyReserve..."

# 1. Dependências
echo "📦 [2/5] Instalando dependências com npm..."
npm install

# 2. Banco de Dados Prisma
echo "🗄️ [3/5] Gerando cliente Prisma e sincronizando schema..."
npx prisma generate
npx prisma db push
node prisma/seed.js || true

# 3. Compilação Next.js
echo "🏗️ [4/5] Executando build de produção..."
npm run build

# 4. Sincronização de arquivos estáticos
echo "⚡ [5/5] Organizando arquivos estáticos no standalone..."
if [ -d ".next/standalone" ]; then
  mkdir -p .next/standalone/public
  cp -r public/* .next/standalone/public/ 2>/dev/null || true
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true
fi

echo "=========================================================="
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO NO SERVIDOR INTEGRATOR!"
echo "=========================================================="
echo "💡 Para iniciar ou reiniciar a aplicação:"
echo "   pm2 restart myreserve || pm2 start app.yaml"
