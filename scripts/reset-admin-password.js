const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const { configureRuntime } = require('./runtime-config');

const projectRoot = path.resolve(__dirname, '..');
configureRuntime({ projectRoot });

const email = process.env.RESET_ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.RESET_ADMIN_PASSWORD;

if (!email) {
  throw new Error('RESET_ADMIN_EMAIL é obrigatório.');
}
if (typeof password !== 'string' || password.length < 12) {
  throw new Error('RESET_ADMIN_PASSWORD com ao menos 12 caracteres é obrigatório.');
}

async function resetPassword() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, role: true, ativo: true },
    });

    if (!user || user.role !== 'ADMIN' || !user.ativo) {
      throw new Error('Administrador ativo não encontrado para a redefinição.');
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { senha_hash: await bcrypt.hash(password, 10) },
    });
    console.log('Senha do administrador redefinida.');
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword().catch((error) => {
  console.error('Falha ao redefinir a senha:', error.message);
  process.exitCode = 1;
});
