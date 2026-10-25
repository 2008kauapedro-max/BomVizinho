-- =====================================================================
-- ROMMO – banco de pedidos (Supabase / PostgreSQL)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute UMA vez.
-- Segurança: RLS ligada, nenhum acesso direto às tabelas para o navegador.
-- Tudo passa por funções (RPC) que validam no servidor.
-- Valores em CENTAVOS (inteiros) para evitar erro de arredondamento.
-- =====================================================================

-- ---------- TABELAS ----------
create table if not exists public.equipe (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  nome      text not null,
  papel     text not null default 'atendente' check (papel in ('admin','atendente')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.produtos (       -- fonte da verdade dos PREÇOS
  id              int primary key,
  nome            text not null,
  categoria       text not null,
  preco_centavos  int  not null check (preco_centavos >= 0),
  ativo           boolean not null default true
);

create sequence if not exists public.pedido_seq;

create table if not exists public.pedidos (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null unique,                    -- ex.: 2610-0042
  chave_idempotencia    text not null unique,                    -- evita pedido duplicado em reenvio
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  versao                int  not null default 1,                 -- controle de concorrência
  visto_em              timestamptz,
  status                text not null default 'recebido' check (status in
    ('recebido','em_analise','aguardando_cliente','confirmado','em_separacao','pronto','despachado','concluido','cancelado')),
  cliente_nome          text not null,
  cliente_tel           text not null,                           -- só dígitos (DDD + número)
  entrega_tipo          text not null check (entrega_tipo in ('Entrega','Retirada na loja')),
  cep text, rua text, numero text, complemento text, bairro text, cidade text, uf text,
  pagamento_forma       text not null,
  pagamento_troco       text,
  pagamento_status      text not null default 'nao_verificado'
                          check (pagamento_status in ('nao_verificado','aguardando','confirmado','recusado')),
  subtotal_centavos     int  not null check (subtotal_centavos >= 0),
  desconto_centavos     int  not null default 0 check (desconto_centavos >= 0),
  frete_situacao        text not null default 'pendente'
                          check (frete_situacao in ('pendente','calculado','informado','aceito','sem_cobranca')),
  frete_centavos        int  check (frete_centavos is null or frete_centavos >= 0),
  frete_modalidade      text, frete_prazo text, frete_obs text,
  frete_atualizado_em   timestamptz, frete_atualizado_por text,
  total_centavos        int                                      -- NULL enquanto o frete não está definido
);
create index if not exists pedidos_criado_idx on public.pedidos (criado_em desc);
create index if not exists pedidos_status_idx on public.pedidos (status);

create table if not exists public.pedido_itens (
  id                   bigserial primary key,
  pedido_id            uuid not null references public.pedidos(id) on delete cascade,
  produto_id           int  not null,
  nome                 text not null,
  preco_unit_centavos  int  not null,
  quantidade           int  not null check (quantidade between 1 and 999),
  subtotal_centavos    int  not null,
  obs                  text
);
create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

create table if not exists public.pedido_historico (
  id           bigserial primary key,
  pedido_id    uuid not null references public.pedidos(id) on delete cascade,
  criado_em    timestamptz not null default now(),
  usuario_id   uuid,
  usuario_nome text,
  tipo         text not null check (tipo in ('status','frete','pagamento','nota','visualizado')),
  de           text, para text, detalhe text
);
create index if not exists pedido_hist_pedido_idx on public.pedido_historico (pedido_id, criado_em desc);

-- ---------- RLS: ligada e SEM políticas = ninguém acessa direto ----------
alter table public.equipe           enable row level security;
alter table public.produtos         enable row level security;
alter table public.pedidos          enable row level security;
alter table public.pedido_itens     enable row level security;
alter table public.pedido_historico enable row level security;
revoke all on public.equipe, public.produtos, public.pedidos, public.pedido_itens, public.pedido_historico from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------- FUNÇÕES INTERNAS (não expostas) ----------
create or replace function public.exige_equipe() returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not exists (select 1 from public.equipe where user_id = auth.uid() and ativo) then
    raise exception 'nao_autorizado' using errcode = '42501';
  end if;
end $$;

create or replace function public.log_hist(p_pedido uuid, p_tipo text, p_de text, p_para text, p_detalhe text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.pedido_historico (pedido_id, usuario_id, usuario_nome, tipo, de, para, detalhe)
  values (p_pedido, auth.uid(), coalesce((select nome from public.equipe where user_id = auth.uid()), 'cliente'), p_tipo, p_de, p_para, p_detalhe);
end $$;

-- ---------- PÚBLICO: o cliente cria o pedido (único acesso do site) ----------
create or replace function public.criar_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_chave text := nullif(trim(coalesce(p->>'chave','')), '');
  v_exist public.pedidos;
  v_nome  text := left(trim(coalesce(p #>> '{cliente,nome}', '')), 100);
  v_tel   text := regexp_replace(coalesce(p #>> '{cliente,tel}', ''), '\D', '', 'g');
  v_tipo  text := p #>> '{entrega,tipo}';
  v_cep   text := regexp_replace(coalesce(p #>> '{entrega,cep}', ''), '\D', '', 'g');
  v_rua   text := left(trim(coalesce(p #>> '{entrega,rua}', '')), 120);
  v_num   text := left(trim(coalesce(p #>> '{entrega,numero}', '')), 15);
  v_comp  text := nullif(left(trim(coalesce(p #>> '{entrega,complemento}', '')), 80), '');
  v_bai   text := left(trim(coalesce(p #>> '{entrega,bairro}', '')), 80);
  v_cid   text := left(trim(coalesce(p #>> '{entrega,cidade}', '')), 80);
  v_uf    text := upper(trim(coalesce(p #>> '{entrega,uf}', '')));
  v_forma text := left(trim(coalesce(p #>> '{pagamento,forma}', '')), 30);
  v_troco text := nullif(left(trim(coalesce(p #>> '{pagamento,troco}', '')), 20), '');
  v_itens jsonb := p -> 'itens';
  v_item jsonb; v_prod public.produtos; v_ids int[] := '{}';
  v_pid int; v_qtd int; v_pc int; v_obs text;
  v_sub bigint := 0; v_id uuid := gen_random_uuid(); v_cod text; v_entrega boolean;
begin
  if v_chave is null or length(v_chave) not between 16 and 64 then raise exception 'dados_invalidos'; end if;
  select * into v_exist from public.pedidos where chave_idempotencia = v_chave;
  if found then return jsonb_build_object('id', v_exist.id, 'codigo', v_exist.codigo, 'duplicado', true); end if;

  if length(v_nome) < 3 then raise exception 'dados_invalidos'; end if;
  if length(v_tel) not between 10 and 11 then raise exception 'dados_invalidos'; end if;
  if v_tipo is null or v_tipo not in ('Entrega', 'Retirada na loja') then raise exception 'dados_invalidos'; end if;
  v_entrega := (v_tipo = 'Entrega');
  if v_entrega and (length(v_cep) <> 8 or length(v_rua) < 2 or length(v_num) < 1 or length(v_bai) < 2 or length(v_cid) < 2 or v_uf !~ '^[A-Z]{2}$') then
    raise exception 'dados_invalidos';
  end if;
  if not v_entrega then v_cep := null; v_rua := null; v_num := null; v_comp := null; v_bai := null; v_cid := null; v_uf := null; end if;
  if length(v_forma) < 2 then raise exception 'dados_invalidos'; end if;
  if v_itens is null or jsonb_typeof(v_itens) <> 'array' or jsonb_array_length(v_itens) not between 1 and 50 then raise exception 'dados_invalidos'; end if;

  -- limites contra abuso (por telefone e geral)
  if (select count(*) from public.pedidos where cliente_tel = v_tel and criado_em > now() - interval '10 minutes') >= 5 then raise exception 'muitas_tentativas'; end if;
  if (select count(*) from public.pedidos where criado_em > now() - interval '1 hour') >= 300 then raise exception 'limite_global'; end if;

  -- 1ª passada: valida itens e calcula o subtotal COM OS PREÇOS DO BANCO (o navegador não manda no preço)
  for v_item in select value from jsonb_array_elements(v_itens) loop
    begin
      v_pid := (v_item ->> 'produto_id')::int; v_qtd := (v_item ->> 'qtd')::int; v_pc := (v_item ->> 'preco')::int;
    exception when others then raise exception 'dados_invalidos';
    end;
    if v_qtd is null or v_qtd not between 1 and 999 then raise exception 'quantidade_invalida'; end if;
    if v_pid = any (v_ids) then raise exception 'dados_invalidos'; end if;
    v_ids := v_ids || v_pid;
    select * into v_prod from public.produtos where id = v_pid and ativo;
    if not found then raise exception 'produto_invalido'; end if;
    if v_pc is null or v_pc <> v_prod.preco_centavos then raise exception 'preco_desatualizado'; end if;
    v_sub := v_sub + v_prod.preco_centavos::bigint * v_qtd;
  end loop;
  if v_sub > 1000000000 then raise exception 'dados_invalidos'; end if;

  v_cod := to_char(now() at time zone 'America/Sao_Paulo', 'YYMM') || '-' || lpad(nextval('public.pedido_seq')::text, 4, '0');
  begin
    insert into public.pedidos (id, codigo, chave_idempotencia, cliente_nome, cliente_tel, entrega_tipo, cep, rua, numero, complemento, bairro, cidade, uf,
                                pagamento_forma, pagamento_troco, subtotal_centavos, frete_situacao, frete_centavos, total_centavos)
    values (v_id, v_cod, v_chave, v_nome, v_tel, v_tipo, v_cep, v_rua, v_num, v_comp, v_bai, v_cid, v_uf, v_forma, v_troco, v_sub::int,
            case when v_entrega then 'pendente' else 'sem_cobranca' end,           -- retirada na loja: sem frete
            case when v_entrega then null else 0 end,
            case when v_entrega then null else v_sub::int end);                    -- total NULL = aguardando frete
    -- 2ª passada: grava os itens com os preços do banco
    for v_item in select value from jsonb_array_elements(v_itens) loop
      select * into v_prod from public.produtos where id = (v_item ->> 'produto_id')::int;
      v_qtd := (v_item ->> 'qtd')::int;
      v_obs := nullif(left(trim(coalesce(v_item ->> 'obs', '')), 200), '');
      insert into public.pedido_itens (pedido_id, produto_id, nome, preco_unit_centavos, quantidade, subtotal_centavos, obs)
      values (v_id, v_prod.id, v_prod.nome, v_prod.preco_centavos, v_qtd, v_prod.preco_centavos * v_qtd, v_obs);
    end loop;
    insert into public.pedido_historico (pedido_id, usuario_nome, tipo, de, para, detalhe)
    values (v_id, 'cliente', 'status', null, 'recebido', 'Pedido criado pelo cliente no site');
  exception when unique_violation then                       -- dois envios simultâneos com a mesma chave
    select * into v_exist from public.pedidos where chave_idempotencia = v_chave;
    if found then return jsonb_build_object('id', v_exist.id, 'codigo', v_exist.codigo, 'duplicado', true); end if;
    raise;
  end;
  return jsonb_build_object('id', v_id, 'codigo', v_cod, 'duplicado', false, 'subtotal_centavos', v_sub);
end $$;

-- ---------- EQUIPE: leitura ----------
create or replace function public.contagens() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public.exige_equipe();
  return (select jsonb_build_object(
    'total', count(*),
    'novos', count(*) filter (where visto_em is null),
    'frete_pendente', count(*) filter (where frete_situacao = 'pendente' and status not in ('cancelado','concluido')),
    'acao', count(*) filter (where status in ('recebido','em_analise','aguardando_cliente') or (frete_situacao = 'pendente' and status not in ('cancelado','concluido'))),
    'por_status', (select coalesce(jsonb_object_agg(s.status, s.c), '{}'::jsonb) from (select status, count(*) c from public.pedidos group by status) s)
  ) from public.pedidos);
end $$;

create or replace function public.listar_pedidos(f jsonb default '{}'::jsonb) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_b text := lower(trim(coalesce(f ->> 'busca', '')));
  v_dig text; v_status text := nullif(f ->> 'status', '');
  v_de date := nullif(f ->> 'de', '')::date; v_ate date := nullif(f ->> 'ate', '')::date;
  v_acao boolean := coalesce((f ->> 'acao')::boolean, false);
  v_asc boolean := (f ->> 'ordem') = 'asc';
  v_pag int := greatest(coalesce((f ->> 'pagina')::int, 1), 1);
  v_tam int := least(greatest(coalesce((f ->> 'tamanho')::int, 20), 1), 50);
  v_rows jsonb; v_total int;
begin
  perform public.exige_equipe();
  v_dig := regexp_replace(v_b, '\D', '', 'g');
  select coalesce(jsonb_agg(to_jsonb(x) - 'rn' - 'total' order by x.rn), '[]'::jsonb), coalesce(max(x.total), 0)
    into v_rows, v_total
  from (
    select row_number() over (order by case when v_asc then p.criado_em end asc, case when not v_asc then p.criado_em end desc) rn,
           count(*) over () total,
           p.id, p.codigo, p.criado_em, p.status, p.cliente_nome, (p.visto_em is not null) as visto,
           p.subtotal_centavos, p.frete_situacao, p.frete_centavos, p.total_centavos, p.pagamento_forma, p.entrega_tipo,
           (select count(*) from public.pedido_itens i where i.pedido_id = p.id) as qtd_produtos,
           (select coalesce(sum(i.quantidade), 0) from public.pedido_itens i where i.pedido_id = p.id) as qtd_unidades
    from public.pedidos p
    where (v_status is null or p.status = v_status)
      and (v_de  is null or (p.criado_em at time zone 'America/Sao_Paulo')::date >= v_de)
      and (v_ate is null or (p.criado_em at time zone 'America/Sao_Paulo')::date <= v_ate)
      and (not v_acao or p.status in ('recebido','em_analise','aguardando_cliente') or (p.frete_situacao = 'pendente' and p.status not in ('cancelado','concluido')))
      and (v_b = '' or strpos(lower(p.codigo), v_b) > 0 or strpos(lower(p.cliente_nome), v_b) > 0 or (length(v_dig) >= 4 and strpos(p.cliente_tel, v_dig) > 0))
    order by case when v_asc then p.criado_em end asc, case when not v_asc then p.criado_em end desc
    offset (v_pag - 1) * v_tam limit v_tam
  ) x;
  return jsonb_build_object('total', v_total, 'pagina', v_pag, 'tamanho', v_tam, 'itens', v_rows);
end $$;

create or replace function public.obter_pedido(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.pedidos;
begin
  perform public.exige_equipe();
  select * into r from public.pedidos where id = p_id;
  if not found then raise exception 'nao_encontrado'; end if;
  if r.visto_em is null then
    update public.pedidos set visto_em = now() where id = p_id;     -- não muda a versão (não gera conflito)
    perform public.log_hist(p_id, 'visualizado', null, null, 'Primeira visualização');
    r.visto_em := now();
  end if;
  return jsonb_build_object(
    'pedido', to_jsonb(r) - 'chave_idempotencia',
    'itens', (select coalesce(jsonb_agg(to_jsonb(i) order by i.id), '[]'::jsonb) from public.pedido_itens i where i.pedido_id = p_id),
    'historico', (select coalesce(jsonb_agg(to_jsonb(h) order by h.criado_em desc, h.id desc), '[]'::jsonb) from public.pedido_historico h where h.pedido_id = p_id));
end $$;

-- ---------- EQUIPE: alterações (todas com checagem de versão = sem sobrescrita acidental) ----------
create or replace function public.atualizar_status(p_id uuid, p_versao int, p_novo text, p_nota text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.pedidos; v_nota text := nullif(trim(coalesce(p_nota, '')), ''); v_ok boolean;
begin
  perform public.exige_equipe();
  select * into r from public.pedidos where id = p_id for update;
  if not found then raise exception 'nao_encontrado'; end if;
  if r.versao <> p_versao then raise exception 'conflito'; end if;
  if p_novo is null or p_novo not in ('recebido','em_analise','aguardando_cliente','confirmado','em_separacao','pronto','despachado','concluido','cancelado') then raise exception 'status_invalido'; end if;
  if p_novo = r.status then raise exception 'sem_mudanca'; end if;
  if r.status = 'concluido' then raise exception 'transicao_invalida'; end if;           -- concluído é final

  v_ok := p_novo = 'cancelado' or exists (select 1 from (values
    ('recebido','em_analise'),('recebido','aguardando_cliente'),('em_analise','aguardando_cliente'),('em_analise','confirmado'),
    ('aguardando_cliente','em_analise'),('aguardando_cliente','confirmado'),('confirmado','em_separacao'),('confirmado','aguardando_cliente'),
    ('em_separacao','pronto'),('em_separacao','confirmado'),('pronto','despachado'),('pronto','em_separacao'),('despachado','concluido'),('cancelado','em_analise')
  ) t(a, b) where a = r.status and b = p_novo);
  if not v_ok and (v_nota is null or length(v_nota) < 10) then raise exception 'transicao_invalida'; end if;           -- salto exige justificativa
  if (p_novo = 'cancelado' or r.status = 'cancelado') and (v_nota is null or length(v_nota) < 5) then raise exception 'justificativa_obrigatoria'; end if;
  if p_novo = 'confirmado' and r.frete_situacao not in ('aceito','sem_cobranca') and (v_nota is null or length(v_nota) < 10) then raise exception 'frete_nao_confirmado'; end if;
  if p_novo = 'concluido' and (v_nota is null or length(v_nota) < 10)
     and not exists (select 1 from public.pedido_historico where pedido_id = p_id and tipo = 'status' and para = 'despachado') then raise exception 'sem_despacho'; end if;

  update public.pedidos set status = p_novo, versao = versao + 1, atualizado_em = now() where id = p_id;
  perform public.log_hist(p_id, 'status', r.status, p_novo, v_nota);
  return jsonb_build_object('versao', r.versao + 1, 'status', p_novo);
end $$;

create or replace function public.registrar_frete(p_id uuid, p_versao int, p_situacao text, p_valor int default null,
                                                   p_modalidade text default null, p_prazo text default null, p_obs text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.pedidos; v_val int; v_total int; v_nome text;
begin
  perform public.exige_equipe();
  select * into r from public.pedidos where id = p_id for update;
  if not found then raise exception 'nao_encontrado'; end if;
  if r.versao <> p_versao then raise exception 'conflito'; end if;
  if r.status in ('concluido','cancelado') then raise exception 'pedido_encerrado'; end if;
  if p_situacao is null or p_situacao not in ('pendente','calculado','informado','aceito','sem_cobranca') then raise exception 'frete_invalido'; end if;
  if p_situacao = 'pendente' then v_val := null;
  elsif p_situacao = 'sem_cobranca' then v_val := 0;                                       -- "sem cobrança" só por escolha explícita
  else
    if p_valor is null or p_valor <= 0 or p_valor > 100000000 then raise exception 'frete_invalido'; end if;   -- 0 não vale: use "sem cobrança"
    v_val := p_valor;
  end if;
  v_total := case when v_val is null then null else greatest(r.subtotal_centavos - r.desconto_centavos, 0) + v_val end;
  select nome into v_nome from public.equipe where user_id = auth.uid();
  update public.pedidos set frete_situacao = p_situacao, frete_centavos = v_val, total_centavos = v_total,
         frete_modalidade = nullif(left(trim(coalesce(p_modalidade, '')), 60), ''), frete_prazo = nullif(left(trim(coalesce(p_prazo, '')), 60), ''),
         frete_obs = nullif(left(trim(coalesce(p_obs, '')), 300), ''), frete_atualizado_em = now(), frete_atualizado_por = v_nome,
         versao = versao + 1, atualizado_em = now()
   where id = p_id;
  perform public.log_hist(p_id, 'frete', r.frete_situacao, p_situacao, case when v_val is null then 'Frete pendente' else 'Frete: ' || (v_val / 100.0)::numeric(12,2)::text end);
  return jsonb_build_object('versao', r.versao + 1, 'total_centavos', v_total);
end $$;

create or replace function public.atualizar_pagamento(p_id uuid, p_versao int, p_status text, p_nota text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.pedidos;
begin
  perform public.exige_equipe();
  select * into r from public.pedidos where id = p_id for update;
  if not found then raise exception 'nao_encontrado'; end if;
  if r.versao <> p_versao then raise exception 'conflito'; end if;
  if p_status is null or p_status not in ('nao_verificado','aguardando','confirmado','recusado') then raise exception 'status_invalido'; end if;
  update public.pedidos set pagamento_status = p_status, versao = versao + 1, atualizado_em = now() where id = p_id;
  perform public.log_hist(p_id, 'pagamento', r.pagamento_status, p_status, nullif(trim(coalesce(p_nota, '')), ''));
  return jsonb_build_object('versao', r.versao + 1);
end $$;

create or replace function public.adicionar_nota(p_id uuid, p_texto text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_t text := trim(coalesce(p_texto, ''));
begin
  perform public.exige_equipe();
  if length(v_t) < 2 or length(v_t) > 1000 then raise exception 'dados_invalidos'; end if;
  if not exists (select 1 from public.pedidos where id = p_id) then raise exception 'nao_encontrado'; end if;
  perform public.log_hist(p_id, 'nota', null, null, v_t);          -- nota INTERNA: nunca vai para mensagem ao cliente
end $$;

-- ---------- PERMISSÕES DAS FUNÇÕES ----------
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
grant execute on function public.contagens() to authenticated;
grant execute on function public.listar_pedidos(jsonb) to authenticated;
grant execute on function public.obter_pedido(uuid) to authenticated;
grant execute on function public.atualizar_status(uuid, int, text, text) to authenticated;
grant execute on function public.registrar_frete(uuid, int, text, int, text, text, text) to authenticated;
grant execute on function public.atualizar_pagamento(uuid, int, text, text) to authenticated;
grant execute on function public.adicionar_nota(uuid, text) to authenticated;
