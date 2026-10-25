# ROMMO — implantação Cloudflare (primeira versão)

Este pacote usa **Cloudflare Workers + D1**. O site público é servido como assets estáticos pelo Worker; pedidos são gravados no D1 por uma API do mesmo domínio. Clientes não precisam criar conta. O painel interno fica em `/gestao-6f2a/` e exige e-mail/senha administrativos.

> O caminho menos óbvio não é uma medida de segurança. O painel continua protegido por sessão HttpOnly e credenciais guardadas como secrets no Worker.

## 1. Pré-requisitos

- Conta Cloudflare com Workers e D1 habilitados.
- Node.js LTS instalado no computador.
- Terminal aberto na pasta que contém `wrangler.toml`.

## 2. Instalar e conectar

```bash
npm install --save-dev wrangler
npx wrangler login
npx wrangler d1 create rommo-db
```

O último comando retorna um `database_id`. Abra `wrangler.toml` e substitua `REPLACE_WITH_D1_DATABASE_ID` pelo ID retornado.

Crie as tabelas e carregue o catálogo inicial:

```bash
npx wrangler d1 migrations apply rommo-db --remote
npx wrangler d1 execute rommo-db --remote --file=seed_products.sql
```

**Confira o catálogo/preços de `seed_products.sql` antes de aceitar pedidos reais.** A API usa os preços do banco, não os valores enviados pelo navegador.

## 3. Configurar credenciais da equipe

Defina um e-mail e uma senha fortes como secrets do Worker (não coloque as credenciais nos arquivos):

```bash
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
```

Quando cada comando pedir o valor, digite o e-mail/senha que a equipe vai usar. Esta primeira versão possui um único acesso administrativo. Não reutilize senha de outros serviços.

## 4. Testar e publicar

```bash
npx wrangler dev
```

Teste `/api/health`, faça um pedido de teste pelo checkout e abra `/gestao-6f2a/`. Depois, publique:

```bash
npx wrangler deploy
```

O comando mostra a URL `workers.dev`. Para usar o domínio próprio, abra **Workers & Pages → rommo-store → Settings → Domains & Routes** e adicione o domínio/subdomínio. Se o domínio estiver em outra conta/provedor, siga o fluxo de configuração DNS apresentado pela Cloudflare.

## 5. Antes de receber pedidos reais

No arquivo `rommo-site/js/data.js`, confirme o valor de `WHATS`: o ZIP original contém `5561999990000`, que parece ser um número de exemplo. Substitua pelo WhatsApp oficial da loja (somente dígitos, com código do país), teste a mensagem e confirme os preços/estoque do catálogo.

## 6. O que está incluído

- Migrações SQL D1 e catálogo inicial dos produtos que estavam no `data.js`.
- Endpoint público `POST /api/orders`, que valida os campos e recalcula subtotais a partir dos preços do D1.
- Chave de idempotência para reduzir duplicações em reenvios.
- Sessão de painel com cookie `HttpOnly`, `Secure`, `SameSite=Strict`, validade de 12 horas e logout.
- Lista, busca, resumo, detalhes e atualização de status dos pedidos.
- Painel instalável como PWA e não indexável por mecanismos de busca.

## 7. Limitações importantes desta primeira versão

- O painel usa um único administrador definido por secrets. Para múltiplos funcionários e papéis diferentes, precisa-se adicionar gestão de equipe.
- O cadastro inicial de produtos é uma fotografia do catálogo atual; alterações futuras no `data.js` não atualizam D1 automaticamente.
- Ainda não há envio automático de mensagens, pagamento online, cálculo de frete nem notificação push. O checkout grava o pedido e abre o WhatsApp para continuidade do atendimento.
- Antes de produção, teste todos os fluxos de checkout, estados de pedido, recuperação de falhas, privacidade e regras fiscais/operacionais da loja. Esta é uma base inicial e não uma auditoria de segurança independente.
- Não remova as credenciais administrativas nem compartilhe o arquivo `wrangler.toml` caso adicione nele valores que não sejam públicos. Secrets devem ser definidos pelo comando `wrangler secret`.
