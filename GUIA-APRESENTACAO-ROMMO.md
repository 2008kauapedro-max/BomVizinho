# ROMMO — pacote para apresentação

Este pacote reúne o site e o painel de operações para continuar o desenvolvimento e preparar uma apresentação.

## O que está incluído nesta versão
- Site da loja e checkout existentes.
- Painel de pedidos com visão geral, novos, em andamento, finalizados e histórico.
- Busca por pedido/cliente, detalhes e atualização de status.
- Avisos automáticos enquanto o painel está aberto (verificação periódica no navegador).
- Campo opcional de e-mail e observação do cliente no checkout.
- Número de WhatsApp configurado para +55 (61) 99314-8848.
- Tela de configurações com tema claro/escuro salvo neste dispositivo.
- Orientações de instalação para Windows, Mac, Android e iPhone; tutorial dentro do painel para iPhone.
- Manifesto PWA com ícones derivados da logo ROMMO e service worker com cache versionado.
- Opção “Manter conectado neste dispositivo”: sessão de 7 dias marcada por padrão ou 12 horas se desmarcada.
- Migração local para os campos de contato/observação do pedido.

## Como abrir localmente no Windows
1. Extraia o ZIP.
2. Abra a pasta `Rommo` no VS Code.
3. No terminal dessa pasta, rode `npm install` se necessário.
4. Rode `npx wrangler d1 migrations apply rommo-db --local`.
5. Rode `npm run dev` e abra o endereço local que o Wrangler mostrar.
6. Painel: `/gestao-6f2a/`.

Não execute migrações remotas nem `npm run deploy` até terminar os testes e a revisão de segurança.

## PWA / instalação
A instalação depende de HTTPS e do suporte do navegador. Em desenvolvimento local, `localhost` normalmente é aceito para teste. No iPhone, use Safari > Compartilhar > Adicionar à Tela de Início. A logo ROMMO é usada nos ícones do manifesto e no ícone Apple touch.

## CEP
O checkout consulta o ViaCEP quando são digitados 8 dígitos. O serviço pode não localizar um CEP ou ficar indisponível; nesses casos, o endereço deve ser preenchido manualmente. A consulta não prova a existência do endereço nem valida a identidade do comprador.

## Limites importantes desta entrega
- A instalação PWA e o fluxo de checkout ainda precisam de teste real em navegadores/dispositivos diferentes.
- O painel atual continua com o modelo de acesso administrativo já existente. A gestão real de funcionários, contas individuais e permissões por função ainda precisa ser implementada no backend antes de uso em produção; esta versão não apresenta botões falsos para essas ações.
- A sessão prolongada aumenta a conveniência. Em computador compartilhado, desmarque “Manter conectado” e saia da conta ao terminar.
- O aviso de pedido novo/atrasado só funciona enquanto o painel está aberto e conectado.
- Não considere o projeto pronto para produção sem revisão de segurança, testes locais completos e configuração correta das credenciais no ambiente Cloudflare.
