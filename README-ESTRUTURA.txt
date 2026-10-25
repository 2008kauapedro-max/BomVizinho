ROMMO — PROJETO ORGANIZADO

ESTRUTURA ÚNICA

ROMMO/
  rommo-site/       Arquivos públicos da loja e do painel administrativo
    index.html      Página principal da loja
    css/            Estilos do site
    js/             JavaScript do site e checkout
    assets/         Imagens e recursos
    gestao-6f2a/    Painel administrativo (URL /gestao-6f2a/)
  worker/index.js   API e regras do backend Cloudflare Worker
  migrations/      Migrações do banco D1
  seed_products.sql Dados iniciais de produtos para D1
  wrangler.toml    Configuração do Worker, assets e banco D1
  package.json     Comandos do projeto
  .dev.vars.example Exemplo de variáveis locais, sem senhas reais

POR QUE ALGUNS ARQUIVOS SUMIRAM?
Foram excluídas cópias antigas que ficavam soltas na raiz (por exemplo, admin.js, admin.css, painel.css, api.js e versões antigas de páginas), além de backups ZIP embutidos, node_modules, .wrangler e .dev.vars. O site configurado em wrangler.toml serve rommo-site/; manter cópias paralelas desses arquivos na raiz causava confusão. Os arquivos locais .dev.vars e .wrangler podem conter credenciais e dados de desenvolvimento, portanto não devem ser distribuídos.

COMO TESTAR LOCALMENTE (WINDOWS / POWERSHELL)
1. Extraia a pasta ROMMO para um local fácil, por exemplo Documentos\ROMMO.
2. Abra o PowerShell dentro da pasta ROMMO (a mesma que contém package.json e wrangler.toml).
3. Execute: npm install
4. Crie o arquivo .dev.vars copiando .dev.vars.example e preencha ADMIN_EMAIL e ADMIN_PASSWORD com valores próprios. Não envie esse arquivo por chat nem publique no Git.
5. Execute as migrações locais: npx wrangler d1 migrations apply rommo-db --local
6. Se precisar popular o banco local, execute: npx wrangler d1 execute rommo-db --local --file=seed_products.sql
7. Inicie: npm run dev
8. Loja: http://127.0.0.1:8787/
   Painel: http://127.0.0.1:8787/gestao-6f2a/
   Saúde da API: http://127.0.0.1:8787/api/health

IMPORTANTE
- Este pacote não inclui credenciais nem o estado do banco local. O banco local poderá precisar ser migrado e populado.
- Não execute db:migrate ou db:seed com --remote e não publique ainda. Antes de produção, revise segurança, configurações, produtos/preços, contato/WhatsApp e faça testes de checkout e painel.
- O painel usa a API existente; não foram inventadas telas administrativas para funções que o backend ainda não oferece.
- Não compartilhe ADMIN_PASSWORD ou o conteúdo do arquivo .dev.vars.
