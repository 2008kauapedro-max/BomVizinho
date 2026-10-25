/* ROMMO – configuração do sistema de pedidos (Supabase).
   Preencha DEPOIS de criar o projeto (veja ADMIN_SETUP.md). Enquanto estiver vazio, o site funciona no
   modo antigo (só WhatsApp) e o painel não tem como receber pedidos.
   A chave "anon/publishable" é PÚBLICA por natureza: quem protege os dados são as regras do banco (RLS).
   NUNCA coloque aqui a chave "service_role" / "secret". */
window.ROMMO_CONFIG = {
  SUPABASE_URL: "",        // ex.: https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: ""    // chave anon (eyJ...) ou publishable (sb_publishable_...)
};
