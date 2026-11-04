# BomVizinho — integração de contas e carrinhos

## O que foi integrado
- API de cadastro, login, logout e consulta da conta do cliente no Worker.
- Senhas derivadas com PBKDF2-SHA256 (100.000 iterações, o máximo aceito pela Cloudflare e salt individual); o token da sessão é armazenado no D1 somente como SHA-256.
- Cookie de sessão `HttpOnly`, `Secure` e `SameSite=Lax`.
- Interface Minha conta na loja, cadastro e login.
- Sincronização do carrinho da conta com D1 e recuperação em outro dispositivo.
- Ao entrar, itens locais de visitante são combinados com os itens da conta; itens duplicados são consolidados. Quando o carrinho local já pertence à mesma conta, quantidades não são somadas novamente.
- Visão de carrinhos ativos, abandonados, recuperados e com pedido real registrado, com filtro de inatividade e dados de cliente/produtos.
- Pedidos feitos em uma sessão autenticada são vinculados à conta; pedidos antigos ou de visitantes não são associados por suposição.
- A ação de WhatsApp fica disponível apenas para carrinho abandonado com consentimento ativo, que pode ser retirado em Minha conta.
- WhatsApp abre com mensagem pré-preenchida; o envio continua manual e precisa ser revisado pelo atendente.
- Abrir a conversa não registra o envio. O painel tem uma ação separada para marcar o lembrete depois do envio manual.

## Banco
A migração `0005_customer_accounts_and_carts.sql` cria as contas, sessões e carrinhos. A migração aditiva `0006_customer_cart_order_link.sql` relaciona pedidos feitos por clientes autenticados às contas e preserva pedidos já existentes sem associação presumida. Nenhuma migração foi executada no D1 remoto nesta revisão. Confira o estado remoto com `npx wrangler d1 migrations list rommo-db` antes de aplicar a migração 0006; não reaplique migrações já registradas.

## Aplicação
1. Faça backup do projeto local.
2. Extraia este ZIP em uma pasta separada para revisão.
3. Copie os arquivos mantendo os caminhos relativos. Não substitua `wrangler.toml`, `package.json` ou arquivos de segredo por versões de outros projetos.
4. Use Node.js 22.5 ou superior e rode `npm test`. A suíte usa o SQLite local do Node e as migrações incluídas; não conecta ao D1 remoto.
5. A suíte de navegador (`npm run test:browser`) requer Python, Playwright e Chromium instalados e acessíveis.

## Validação desta revisão
- `npm test`: 10 testes passaram, cobrindo cadastro, duplicidade de e-mail, senha derivada, sessão, sincronização entre dispositivos, consentimento, autorização e vínculo de pedido real à conta.
- `node --check`: 18 arquivos JavaScript passaram na revisão local.
- `npm run test:browser`: não iniciou neste computador porque o ambiente não conseguiu executar o Python (`O sistema não pode executar o programa especificado.`). Os testes de interface para Minha conta no celular e erros JavaScript continuam incluídos em `tests/test_site.py`, mas não foram executados.
- Nenhuma consulta, migração ou alteração foi feita no D1 remoto. O estado das migrações remotas permanece não verificado.
- A cena de abertura e os ajustes responsivos não foram validados visualmente em um navegador nesta revisão; faça essa verificação antes de publicar.

## Limitações importantes
- O lembrete não é enviado automaticamente: o painel abre o WhatsApp com texto personalizado e o atendente precisa revisar e enviar.
- A conta exige e-mail em formato válido, telefone e senha com pelo menos 10 caracteres. Não há confirmação de e-mail nem fluxo de redefinição de senha nesta etapa; não use a conta como mecanismo de autenticação de alto risco.
- A sincronização do carrinho ocorre quando o cliente está autenticado. Visitantes continuam com carrinho local no navegador.
- A migração 0006 é aditiva, preserva pedidos anteriores sem associação e não recria o banco. Confira o estado de migrações antes de aplicá-la em qualquer banco remoto.
- A alteração de conta não inclui cobrança, pagamento ou reserva de estoque.
- A correção geral das imagens e do layout mobile requer validação no domínio publicado e em dispositivos reais. Este pacote inclui atualização de cache-busting dos scripts, mas não declara o problema visual resolvido sem esse teste.
- `wrangler.toml` continua com valores de exemplo para `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Antes de publicar, configure credenciais reais e fortes usando o mecanismo de segredos da Cloudflare; os valores de exemplo não são credenciais de produção.
- O login ainda não tem confirmação de e-mail, recuperação de senha ou regra de limitação de tentativas. Planeje esses controles antes de tratar a conta como acesso de alto risco.
