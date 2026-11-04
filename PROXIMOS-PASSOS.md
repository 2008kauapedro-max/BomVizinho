# BomVizinho — o que falta quando o cliente fechar negócio

Hoje o site é um **protótipo funcionando** para apresentação. Tudo abaixo depende de informações ou contas do cliente.

## Já funcionando (protótipo)
- Site: https://bomvizinho.vercel.app (Vercel, publica sozinho a cada envio na `main`)
- Servidor e banco: Worker `bomvizinho` + banco D1 `bomvizinho-db` na Cloudflare (publica sozinho pela `main`)
- Painel: `/gestao-6f2a/` — login com os Secrets `ADMIN_EMAIL` e `ADMIN_PASSWORD` da Cloudflare
- Contas de cliente, carrinho salvo na conta, pedidos ligados à conta, painel de pedidos, catálogo, carrinhos e configurações
- Segurança: senhas com PBKDF2, sessões em cookie HttpOnly, bloqueio após 8 senhas erradas em 15 min

## Pendências (fazer só depois de fechar)
1. **Produtos reais** — apagar os 12 produtos de demonstração (SKU `DEMO-`) e cadastrar o catálogo real pelo painel (nome, preço, estoque e foto).
2. **Dados da empresa** — razão social, CNPJ, endereço, e-mail, Instagram e WhatsApp oficiais (`rommo-site/js/data.js` e Configurações do painel).
3. **Recuperação de senha por e-mail** — e-mail bonito com a identidade da loja, enviado do e-mail real da empresa:
   - criar conta no Resend (resend.com) e verificar o domínio da empresa;
   - guardar a chave como Secret `RESEND_API_KEY` no Worker `bomvizinho`;
   - implementar "Esqueci a senha" (link com validade curta, uso único).
4. **Domínio próprio** — ex.: `www.bomvizinho.com.br`, apontado para a Vercel.
5. **Senha do painel do cliente** — trocar `ADMIN_EMAIL` / `ADMIN_PASSWORD` pelos dados da equipe da loja.
6. **Pagamento online e frete automático** (opcional) — hoje o pedido é combinado pelo WhatsApp.
7. **Textos legais** — revisar Termos de uso e Política de privacidade com os dados reais.

## Observações técnicas
- Migrações aplicadas no banco: 0001 a 0007 (registradas em `d1_migrations`).
- Testes: `npm test` (12 testes da API).
