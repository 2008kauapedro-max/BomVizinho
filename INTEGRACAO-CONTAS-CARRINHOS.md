# BomVizinho — integração de contas e carrinhos

## O que foi integrado
- API de cadastro, login, logout e consulta da conta do cliente no Worker.
- Senhas derivadas com PBKDF2-SHA256 (210.000 iterações e salt individual); o token da sessão é armazenado no D1 somente como SHA-256.
- Cookie de sessão `HttpOnly`, `Secure` e `SameSite=Lax`.
- Interface Minha conta na loja, cadastro e login.
- Sincronização do carrinho da conta com D1 e recuperação em outro dispositivo.
- Ao entrar, itens locais de visitante são combinados com os itens da conta; itens duplicados são consolidados. Quando o carrinho local já pertence à mesma conta, quantidades não são somadas novamente.
- Aba Carrinhos abandonados no painel administrativo, com filtro de tempo e mensagem dinâmica contendo produtos e quantidades.
- A lista de lembretes é limitada a clientes com consentimento ativo, que pode ser retirado em Minha conta.
- WhatsApp abre com mensagem pré-preenchida; o envio continua manual e precisa ser revisado pelo atendente.
- Abrir a conversa não registra o envio. O painel tem uma ação separada para marcar o lembrete depois do envio manual.

## Banco
A migração `0005_customer_accounts_and_carts.sql` está incluída para manter o projeto reproduzível. Segundo o resultado informado pelo proprietário, ela JÁ foi aplicada no D1 remoto. Portanto, não é necessário executá-la novamente nesse banco. Confirme com `npx wrangler d1 migrations list rommo-db --remote` antes de qualquer ação.

## Aplicação
1. Faça backup do projeto local.
2. Extraia este ZIP em uma pasta separada para revisão.
3. Copie os arquivos mantendo os caminhos relativos. Não substitua `wrangler.toml`, `package.json` ou arquivos de segredo por versões de outros projetos.
4. Use Node.js 22.5 ou superior e rode `npm test`. A suíte usa o SQLite local do Node e as migrações incluídas; não conecta ao D1 remoto.
5. A suíte de navegador em Python (`npm run test:browser`) é complementar e requer Python, Playwright e Chromium.

## Validação desta revisão
- `npm test`: 9 testes passaram, cobrindo migração sem perda dos produtos, cadastro, duplicidade de e-mail, hash de senha, login/logout, sessão, carrinho entre dispositivos, carrinhos abandonados, consentimento, rotas privadas e a separação entre abrir o WhatsApp e registrar o envio.
- `node --check`: Worker, scripts da loja, checkout, páginas, painel e service worker passaram.
- O teste visual do navegador não foi executado nesta revisão; confirme o layout em dispositivos reais ou com `npm run test:browser` em um ambiente com Python, Playwright e Chromium.
- Nenhuma consulta ou alteração foi feita no D1 remoto. O documento recebido informa que a migração 0005 já foi aplicada, mas o estado remoto não foi verificado.
6. Faça primeiro testes locais com D1 local e dados fictícios. Só depois considere publicar o Worker.

## Limitações importantes
- O lembrete não é enviado automaticamente: o painel abre o WhatsApp com texto personalizado e o atendente precisa revisar e enviar.
- A conta exige e-mail em formato válido, telefone e senha com pelo menos 10 caracteres. Não há confirmação de e-mail nem fluxo de redefinição de senha nesta etapa; não use a conta como mecanismo de autenticação de alto risco.
- A sincronização do carrinho ocorre quando o cliente está autenticado. Visitantes continuam com carrinho local no navegador.
- A migração 0005 é aditiva e preserva produtos existentes; confira o estado de migrações antes de aplicá-la em qualquer banco remoto.
- A alteração de conta não inclui cobrança, pagamento ou reserva de estoque.
- A correção geral das imagens e do layout mobile requer validação no domínio publicado e em dispositivos reais. Este pacote inclui atualização de cache-busting dos scripts, mas não declara o problema visual resolvido sem esse teste.
- `wrangler.toml` continua com valores de exemplo para `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Antes de publicar, configure credenciais reais e fortes usando o mecanismo de segredos da Cloudflare; os valores de exemplo não são credenciais de produção.
- O login ainda não tem confirmação de e-mail, recuperação de senha ou regra de limitação de tentativas. Planeje esses controles antes de tratar a conta como acesso de alto risco.
