# Deploy seguro no Integrator

## Caminhos do banco

- Desenvolvimento: `DATABASE_URL="file:./dev.db"`, resolvido pelo Prisma como `prisma/dev.db`.
- Produção: `DATABASE_URL="file:/app/data/myreserve.db"`. O diretório `/app/data` precisa estar no volume persistente do aplicativo.

O processo de produção lê variáveis já exportadas pelo ambiente ou o arquivo indicado por
`ENV_FILE` (por padrão, `/.env`). Ele nunca regrava esse arquivo e nunca copia bancos para
`.next/standalone`.

## Variáveis necessárias no Integrator

Configure o arquivo externo `/.env` com permissões restritas:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/myreserve.db
JWT_SECRET=<segredo-aleatorio-com-ao-menos-32-caracteres>
COOKIE_SECURE=true
SEED_ADMIN_EMAIL=<email-do-administrador-inicial>
SEED_ADMIN_PASSWORD=<senha-forte-inicial>
```

Gere o novo `JWT_SECRET` fora do repositório com `openssl rand -hex 32`. A troca desse valor
invalida as sessões assinadas com o segredo anterior.

Depois do primeiro seed bem-sucedido, `SEED_ADMIN_PASSWORD` pode ser removida do ambiente:
reinícios futuros preservam o usuário e não redefinem sua senha.

Para testar temporariamente pelo endereço IP em HTTP, defina `COOKIE_SECURE=false` no painel e
reinicie a aplicação. Volte imediatamente para `COOKIE_SECURE=true` após configurar um domínio
com HTTPS.

## Redefinição de senha administrativa

O seed não altera senhas existentes. Para redefinir uma senha administrativa, defina
temporariamente `RESET_ADMIN_EMAIL` e `RESET_ADMIN_PASSWORD` (mínimo 12 caracteres) no ambiente
do container e execute:

```bash
npm run admin:reset-password
```

O comando só altera um usuário ativo com papel `ADMIN`, não imprime o e-mail nem a senha e deve
ser seguido da remoção das duas variáveis do ambiente.

## Procedimento de deploy

1. Faça backup do arquivo SQLite persistente antes de alterar a aplicação.
2. Envie somente o código e confirme que o volume que contém `/app/data` não será substituído.
3. No diretório `/app`, execute `bash deploy-integrator.sh`.
4. Reinicie com `pm2 restart myreserve --update-env` (ou `pm2 start app.yaml` no primeiro deploy).
5. Verifique `GET /login`, `GET /api/auth/me` e o login com o usuário inicial.

O script usa `npm ci`, gera o Prisma Client e executa `prisma db push --skip-generate`, sem
`--force-reset`. O projeto não possui migrations versionadas; por isso `migrate deploy` não é
aplicável até que uma baseline de migrations seja criada e validada separadamente.

## Rollback sem perda de dados

1. Pare apenas o processo da aplicação.
2. Restaure a versão anterior do código e reinicie o PM2 apontando para o mesmo `/app/data/myreserve.db`.
3. Não remova o banco, o volume ou o diretório `data`.
4. Se o schema da nova versão tiver sido alterado, restaure o backup do banco feito antes do deploy antes de religar a versão anterior.
