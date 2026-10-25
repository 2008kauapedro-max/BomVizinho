"""Testes ponta a ponta do site + painel. Usam um SERVIDOR SIMULADO (mock) que replica as regras do banco
(supabase/schema.sql). As regras SQL em si são testadas com tests/sql_testes.sql direto no Supabase.
Rodar:  python3 tests/e2e.py   (precisa de: pip install playwright && playwright install chromium)"""
import asyncio,json,os,re,shutil,subprocess,sys,uuid,datetime
from playwright.async_api import async_playwright
RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));TMP="/tmp/rommo_e2e"
shutil.rmtree(TMP,ignore_errors=True);shutil.copytree(RAIZ,TMP,ignore=shutil.ignore_patterns("tests","*.zip"))
URL="https://teste.supabase.co"
open(f"{TMP}/js/config.js","w").write(f'window.ROMMO_CONFIG={{SUPABASE_URL:"{URL}",SUPABASE_ANON_KEY:"eyJteste"}};')
PROD={p["id"]:p for p in json.loads(subprocess.check_output(["node","-e",f'const vm=require("vm"),fs=require("fs");const r=vm.runInNewContext(fs.readFileSync("{TMP}/js/data.js","utf8")+";({{P}})");console.log(JSON.stringify(r.P.map(p=>({{id:p.id,nome:p.n,preco:Math.round(p.p*100)}}))))']))}
OK=("recebido","em_analise"),("recebido","aguardando_cliente"),("em_analise","aguardando_cliente"),("em_analise","confirmado"),("aguardando_cliente","em_analise"),("aguardando_cliente","confirmado"),("confirmado","em_separacao"),("confirmado","aguardando_cliente"),("em_separacao","pronto"),("em_separacao","confirmado"),("pronto","despachado"),("pronto","em_separacao"),("despachado","concluido"),("cancelado","em_analise")
class Back:
    def __init__(s):s.pedidos=[];s.seq=0;s.perder_resposta=0;s.falhar=0;s.staff=True;s.reqs=[]
    def novo(s,nome="Cliente Teste",tel="61999998888",tipo="Entrega",itens=None,**kw):
        s.seq+=1;itens=itens or [(3,2)];sub=sum(PROD[i]["preco"]*q for i,q in itens)
        p=dict(id=str(uuid.uuid4()),codigo=f"2610-{s.seq:04d}",criado_em=datetime.datetime.utcnow().isoformat()+"Z",atualizado_em=datetime.datetime.utcnow().isoformat()+"Z",versao=1,visto_em=None,status="recebido",cliente_nome=nome,cliente_tel=tel,entrega_tipo=tipo,
          cep="73751565",rua="Rua A",numero="1",complemento=None,bairro="Centro",cidade="Planaltina",uf="GO",pagamento_forma="Pix",pagamento_troco=None,pagamento_status="nao_verificado",subtotal_centavos=sub,desconto_centavos=0,
          frete_situacao="pendente" if tipo=="Entrega" else "sem_cobranca",frete_centavos=None if tipo=="Entrega" else 0,frete_modalidade=None,frete_prazo=None,frete_obs=None,frete_atualizado_em=None,frete_atualizado_por=None,total_centavos=None if tipo=="Entrega" else sub,
          _chave=str(uuid.uuid4()),_itens=[dict(id=n,produto_id=i,nome=PROD[i]["nome"],preco_unit_centavos=PROD[i]["preco"],quantidade=q,subtotal_centavos=PROD[i]["preco"]*q,obs=None) for n,(i,q) in enumerate(itens)],
          _hist=[dict(id=1,criado_em=datetime.datetime.utcnow().isoformat()+"Z",usuario_nome="cliente",tipo="status",de=None,para="recebido",detalhe="Pedido criado")])
        p.update(kw);s.pedidos.append(p);return p
    def pub(s,p):return {k:v for k,v in p.items() if not k.startswith("_")}
    def rpc(s,fn,a):
        if fn=="criar_pedido":
            d=a["p"]
            for p in s.pedidos:
                if p["_chave"]==d["chave"]:return 200,dict(id=p["id"],codigo=p["codigo"],duplicado=True)
            if not d["cliente"]["nome"] or len(d["cliente"]["tel"])<10:return 400,dict(message="dados_invalidos")
            sub=0
            for it in d["itens"]:
                pr=PROD.get(it["produto_id"])
                if not pr:return 400,dict(message="produto_invalido")
                if it["preco"]!=pr["preco"]:return 400,dict(message="preco_desatualizado")
                sub+=pr["preco"]*it["qtd"]
            e=d["entrega"];p=s.novo(d["cliente"]["nome"],d["cliente"]["tel"],e["tipo"],[(i["produto_id"],i["qtd"]) for i in d["itens"]],pagamento_forma=d["pagamento"]["forma"],_chave=d["chave"])
            if e["tipo"]=="Entrega":p.update(cep=e["cep"],rua=e["rua"],numero=e["numero"],bairro=e["bairro"],cidade=e["cidade"],uf=e["uf"])
            return 200,dict(id=p["id"],codigo=p["codigo"],duplicado=False,subtotal_centavos=sub)
        if not s.staff:return 403,dict(message="nao_autorizado")
        if fn=="contagens":
            P=s.pedidos;pst={}
            for p in P:pst[p["status"]]=pst.get(p["status"],0)+1
            fp=[p for p in P if p["frete_situacao"]=="pendente" and p["status"] not in("cancelado","concluido")]
            ac=[p for p in P if p["status"] in("recebido","em_analise","aguardando_cliente") or p in fp]
            return 200,dict(total=len(P),novos=len([p for p in P if not p["visto_em"]]),frete_pendente=len(fp),acao=len(ac),por_status=pst)
        if fn=="listar_pedidos":
            L=list(s.pedidos);b=(a.get("busca") or "").lower();dg=re.sub(r"\D","",b)
            if a.get("status"):L=[p for p in L if p["status"]==a["status"]]
            if a.get("acao"):L=[p for p in L if p["status"] in("recebido","em_analise","aguardando_cliente") or (p["frete_situacao"]=="pendente" and p["status"] not in("cancelado","concluido"))]
            if b:L=[p for p in L if b in p["codigo"].lower() or b in p["cliente_nome"].lower() or (len(dg)>=4 and dg in p["cliente_tel"])]
            L.sort(key=lambda p:p["criado_em"]+p["codigo"],reverse=a.get("ordem")!="asc");t=a.get("tamanho",20);pg=a.get("pagina",1);tot=len(L);L=L[(pg-1)*t:pg*t]
            return 200,dict(total=tot,pagina=pg,tamanho=t,itens=[dict(id=p["id"],codigo=p["codigo"],criado_em=p["criado_em"],status=p["status"],cliente_nome=p["cliente_nome"],visto=bool(p["visto_em"]),subtotal_centavos=p["subtotal_centavos"],frete_situacao=p["frete_situacao"],frete_centavos=p["frete_centavos"],total_centavos=p["total_centavos"],pagamento_forma=p["pagamento_forma"],entrega_tipo=p["entrega_tipo"],qtd_produtos=len(p["_itens"]),qtd_unidades=sum(i["quantidade"] for i in p["_itens"])) for p in L])
        p=next((x for x in s.pedidos if x["id"]==a.get("p_id")),None)
        if not p:return 400,dict(message="nao_encontrado")
        if fn=="obter_pedido":
            if not p["visto_em"]:p["visto_em"]=datetime.datetime.utcnow().isoformat()+"Z"
            return 200,dict(pedido=s.pub(p),itens=p["_itens"],historico=list(reversed(p["_hist"])))
        if fn=="adicionar_nota":p["_hist"].append(dict(id=len(p["_hist"])+1,criado_em=datetime.datetime.utcnow().isoformat()+"Z",usuario_nome="Equipe",tipo="nota",detalhe=a["p_texto"]));return 200,None
        if p["versao"]!=a["p_versao"]:return 400,dict(message="conflito")
        def h(t,de,para,det):p["_hist"].append(dict(id=len(p["_hist"])+1,criado_em=datetime.datetime.utcnow().isoformat()+"Z",usuario_nome="Equipe",tipo=t,de=de,para=para,detalhe=det));p["versao"]+=1
        if fn=="atualizar_status":
            n=a["p_novo"];nota=(a.get("p_nota") or "").strip()
            if p["status"]=="concluido":return 400,dict(message="transicao_invalida")
            if not(n=="cancelado" or (p["status"],n) in OK) and len(nota)<10:return 400,dict(message="transicao_invalida")
            if (n=="cancelado" or p["status"]=="cancelado") and len(nota)<5:return 400,dict(message="justificativa_obrigatoria")
            if n=="confirmado" and p["frete_situacao"] not in("aceito","sem_cobranca") and len(nota)<10:return 400,dict(message="frete_nao_confirmado")
            if n=="concluido" and len(nota)<10 and not any(x["para"]=="despachado" for x in p["_hist"]):return 400,dict(message="sem_despacho")
            h("status",p["status"],n,nota or None);p["status"]=n;return 200,dict(versao=p["versao"])
        if fn=="registrar_frete":
            s_=a["p_situacao"];v=a.get("p_valor")
            if s_=="pendente":v=None
            elif s_=="sem_cobranca":v=0
            elif not v or v<=0:return 400,dict(message="frete_invalido")
            p.update(frete_situacao=s_,frete_centavos=v,total_centavos=None if v is None else p["subtotal_centavos"]+v,frete_prazo=a.get("p_prazo") or None);h("frete","x",s_,None);return 200,dict(versao=p["versao"])
        if fn=="atualizar_pagamento":p["pagamento_status"]=a["p_status"];h("pagamento","x",a["p_status"],None);return 200,dict(versao=p["versao"])
        return 404,dict(message="fn")
async def instala(ctx,B,tok_ok="tok"):
    async def handler(route):
        r=route.request;path=r.url.replace(URL,"");B.reqs.append((r.method,path))
        if B.falhar>0:B.falhar-=1;return await route.abort()
        if path.startswith("/auth/v1/token"):
            d=json.loads(r.post_data)
            if d.get("password")=="senha-teste-123" or d.get("refresh_token"):return await route.fulfill(status=200,content_type="application/json",body=json.dumps(dict(access_token=tok_ok,refresh_token="r",expires_in=3600,user=dict(id="u1",email="ana@rommo.test"))))
            return await route.fulfill(status=400,content_type="application/json",body=json.dumps(dict(error_description="Invalid login credentials")))
        if path.startswith("/auth/v1/logout"):return await route.fulfill(status=204,body="")
        if path.startswith("/rest/v1/rpc/"):
            fn=path.split("/")[-1];a=json.loads(r.post_data or "{}")
            if fn!="criar_pedido" and r.headers.get("authorization")!=f"Bearer {tok_ok}":return await route.fulfill(status=401,content_type="application/json",body=json.dumps(dict(message="JWT expired")))
            st,body=B.rpc(fn,a)
            if fn=="criar_pedido" and B.perder_resposta>0:B.perder_resposta-=1;return await route.abort()   # salvou, mas a resposta se perdeu
            return await route.fulfill(status=st,content_type="application/json",body=json.dumps(body))
        await route.fulfill(status=404,body="")
    await ctx.route(URL+"/**",handler)
R=[]
def ck(nome,cond,extra=""):R.append(bool(cond));print(("PASS  " if cond else "FALHOU ")+nome+(f"  [{extra}]" if extra and not cond else ""))
async def preenche(pg):
    await pg.fill("#f-nome","Pedro Kaua");await pg.fill("#f-tel","61993148800");await pg.fill("#f-cep","73751565");await pg.fill("#f-rua","Rua Teste");await pg.fill("#f-num","10");await pg.fill("#f-bairro","Setor Norte");await pg.fill("#f-cidade","Planaltina");await pg.fill("#f-uf","GO")
    await pg.click('label.op:has(input[value="Cartão de crédito"])')
async def loja(b,B,w=1300):
    ctx=await b.new_context(viewport={"width":w,"height":900});await ctx.add_init_script("window.__w=[];window.open=u=>{window.__w.push(u)}");await instala(ctx,B)
    pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));await pg.goto(f"file://{TMP}/index.html");await pg.wait_for_timeout(5900);return pg,errs
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();B=Back()
    print("\n=== SITE: checkout integrado ===")
    pg,errs=await loja(b,B)
    await pg.evaluate("add(3);add(3);add(11);closeAll();openCheckout()");await pg.wait_for_timeout(300)
    n0=len(B.reqs);await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(200)
    ck("dados incompletos: bloqueado no navegador, sem requisição",len(B.reqs)==n0 and await pg.evaluate("document.querySelectorAll('#ckf label.bad').length")>0)
    await preenche(pg)
    B.perder_resposta=1;await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(600)
    ck("falha de rede após salvar: erro claro, nada de falso 'recebido'",await pg.evaluate("!document.getElementById('ckerr').hidden && document.querySelector('.ok2')===null"))
    ck("   botão volta a ficar disponível para tentar de novo",await pg.evaluate("!document.getElementById('ckgo').disabled"))
    await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(600)
    ck("novo envio com a MESMA chave: pedido NÃO duplicado (1 pedido no banco)",len(B.pedidos)==1,f"{len(B.pedidos)} pedidos")
    ck("tela de confirmação mostra o código real do servidor",await pg.evaluate("document.querySelector('.ok2 h2')?.textContent==='Pedido registrado'") and B.pedidos[0]["codigo"] in await pg.evaluate("document.querySelector('.ok2').textContent"))
    msg=await pg.evaluate("ckMsg")
    ck("mensagem: 'pendente de cálculo pela equipe' e sem 'a combinar'","pendente de cálculo pela equipe" in msg and "combinar" not in msg.lower(),msg)
    ck("mensagem inclui o código do pedido",B.pedidos[0]["codigo"] in msg)
    ck("WhatsApp NÃO foi aberto automaticamente (só por ação do usuário)",await pg.evaluate("window.__w.length")==0)
    ck("pedido gravado com itens/quantidades/valores corretos",B.pedidos[0]["subtotal_centavos"]==PROD[3]["preco"]*2+PROD[11]["preco"])
    ck("sem erros de JavaScript na loja",not errs,str(errs))
    # preço manipulado no navegador
    await pg.evaluate("closeCheckout();cart=[];save();add(3);closeAll();P.find(p=>p.id===3).p=1;openCheckout()");await pg.wait_for_timeout(300);await preenche(pg)
    n=len(B.pedidos);await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(500)
    ck("preço alterado no navegador: servidor recusa e nenhum pedido é criado",len(B.pedidos)==n and "preço" in (await pg.inner_text("#ckerr")).lower())
    # falha total de rede, depois sucesso
    await pg.reload();await pg.wait_for_timeout(5900);await pg.evaluate("add(4);closeAll();openCheckout()");await pg.wait_for_timeout(300);await preenche(pg)
    B.falhar=1;n=len(B.pedidos);await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(500)
    ck("sem conexão: mensagem de erro e dados mantidos no formulário",len(B.pedidos)==n and await pg.input_value("#f-nome")=="Pedro Kaua")
    await pg.evaluate("ckEnviar()");await pg.wait_for_timeout(500)
    ck("nova tentativa grava o pedido",len(B.pedidos)==n+1)
    await pg.evaluate("closeCheckout()");ck("carrinho esvazia só depois de concluir",await pg.evaluate("cart.length")==0)
    await pg.close()
    print("\n=== SITE: regressão (fluxos antigos) ===")
    pg,errs=await loja(b,B)
    ck("catálogo carrega",await pg.evaluate("document.querySelectorAll('#grid .card').length")==12)
    await pg.evaluate("setCat('irrigacao')");ck("filtro de categoria",await pg.evaluate("document.querySelectorAll('#grid .card').length")==1)
    await pg.evaluate("setCat('todos')");await pg.fill("#q","betoneira");ck("busca",await pg.evaluate("document.querySelectorAll('#grid .card').length")==1);await pg.fill("#q","")
    await pg.evaluate("add(1)");ck("adicionar ao carrinho abre o aviso",await pg.evaluate("document.getElementById('md').classList.contains('on')"))
    await pg.evaluate("closeAll();comprar(2)");await pg.wait_for_timeout(300);ck("'Comprar agora' abre a finalização com 2 itens",await pg.evaluate("document.getElementById('ck').classList.contains('on')&&document.querySelectorAll('.ri').length")==2)
    await pg.evaluate("closeCheckout()");await pg.evaluate("abrePg('privacidade')");ck("página de privacidade abre",await pg.evaluate("document.getElementById('pgv').classList.contains('on')"));await pg.evaluate("fechaPg()")
    await pg.evaluate("abrePg('como-comprar')");ck("página 'Como comprar' abre",await pg.evaluate("document.querySelector('#pgc h1').textContent")=="Como comprar");await pg.evaluate("fechaPg()")
    await pg.evaluate("cart=[];add(6);document.querySelector('#its textarea').value='</textarea><img src=x onerror=window.__x=1>';document.querySelector('#its textarea').dispatchEvent(new Event('input'));drawCart();closeAll()")
    ck("observação do carrinho com HTML não executa (XSS)",await pg.evaluate("window.__x")is None)
    ck("sem erros de JavaScript",not errs,str(errs));await pg.close()
    # ---------- ADMIN ----------
    async def admin(w=1300,logado=True,B_=None):
        ctx=await b.new_context(viewport={"width":w,"height":900});await instala(ctx,B_);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append(m.text) if m.type=="error" and "Content Security" in m.text else None)
        await pg.goto(f"file://{TMP}/admin/index.html");await pg.wait_for_timeout(400)
        if logado:
            await pg.fill('input[type=email]',"ana@rommo.test");await pg.fill('input[type=password]',"senha-teste-123");await pg.click("text=Entrar");await pg.wait_for_selector(".main",timeout=5000)
        return pg,errs
    print("\n=== PAINEL: acesso ===")
    B2=Back();pg,errs=await admin(logado=False,B_=B2)
    ck("sem login: só aparece a tela de acesso (nenhum dado de pedido)",await pg.locator(".login").count()==1 and await pg.locator(".main").count()==0)
    await pg.fill('input[type=email]',"ana@rommo.test");await pg.fill('input[type=password]',"errada");await pg.click("text=Entrar");await pg.wait_for_timeout(400)
    ck("senha errada: mensagem genérica, sem revelar detalhes",await pg.inner_text(".err")=="E-mail ou senha incorretos.")
    ck("nenhuma chamada de pedidos antes do login",not any("/rpc/listar" in p or "/rpc/obter" in p for _,p in B2.reqs))
    await pg.fill('input[type=password]',"senha-teste-123");await pg.click("text=Entrar");await pg.wait_for_selector(".main")
    ck("login correto abre o painel",await pg.locator(".main").count()==1)
    ck("painel vazio: estado vazio explicativo",await pg.locator(".vazio").count()>=1 and "Nenhum pedido ainda" in await pg.inner_text(".main"))
    await pg.click("text=Sair");await pg.wait_for_timeout(300)
    ck("logout: volta ao login e limpa a sessão",await pg.locator(".login").count()==1 and await pg.evaluate("sessionStorage.getItem('rommo_admin_sessao')")is None)
    await pg.close()
    print("\n=== PAINEL: lista, busca, filtros, paginação ===")
    B3=Back()
    for i in range(23):B3.novo(f"Cliente {i:02d}",f"6199900{i:04d}",itens=[(3,1)])
    B3.novo("Maria Silva","61988776655",tipo="Retirada na loja",itens=[(2,1)]);B3.pedidos[-1]["status"]="confirmado"
    pg,errs=await admin(B_=B3)
    ck("dashboard reflete os dados reais (24 pedidos, 24 novos)","24" in await pg.inner_text(".cards"),await pg.inner_text(".cards"))
    await pg.goto(f"file://{TMP}/admin/index.html#/pedidos");await pg.wait_for_selector(".row:not(.h)")
    ck("lista paginada: 20 por página",await pg.locator(".row:not(.h)").count()==20)
    await pg.click("text=Próxima");await pg.wait_for_timeout(300);ck("página 2 mostra o restante (4)",await pg.locator(".row:not(.h)").count()==4)
    await pg.fill('input[type=search]',"maria");await pg.wait_for_timeout(900);ck("busca por nome",await pg.locator(".row:not(.h)").count()==1)
    await pg.fill('input[type=search]',"9887");await pg.wait_for_timeout(900);ck("busca por telefone (sem expor o telefone na lista)",await pg.locator(".row:not(.h)").count()==1 and "6198877" not in await pg.inner_text(".main"))
    await pg.fill('input[type=search]',B3.pedidos[0]["codigo"]);await pg.wait_for_timeout(900);ck("busca por número do pedido",await pg.locator(".row:not(.h)").count()==1)
    await pg.fill('input[type=search]',"");await pg.wait_for_timeout(700);await pg.select_option('select[aria-label="Status"]',"confirmado");await pg.wait_for_timeout(500);ck("filtro por status",await pg.locator(".row:not(.h)").count()==1)
    await pg.fill('input[type=search]',"zzzz");await pg.select_option('select[aria-label="Status"]',"");await pg.wait_for_timeout(900);ck("busca sem resultado: estado vazio",await pg.locator(".vazio").count()==1)
    await pg.close()
    print("\n=== PAINEL: detalhe, frete, status, histórico ===")
    B4=Back();o=B4.novo("Pedro Kauã","61993148800",itens=[(3,2),(11,1),(7,1)],numero="GO",uf="G0")
    pg,errs=await admin(B_=B4);await pg.goto(f"file://{TMP}/admin/index.html#/pedido/{o['id']}");await pg.wait_for_selector("text=Resumo financeiro")
    t=await pg.inner_text(".main")
    ck("seções A–H presentes",all(x in t for x in["Cliente","Entrega","Produtos","Pagamento","Frete","Resumo financeiro","Observações internas e histórico"]))
    ck("produtos: 3 tipos e 4 unidades em destaque","3 tipo(s)" in t and "4 unidade(s)" in t)
    ck("frete pendente: texto claro e total aguardando frete","Pendente de cálculo pela equipe" in t and "Aguardando definição do frete" in t and "combinar" not in t.lower())
    ck("endereço malformado é destacado para conferência",await pg.locator("dd.warn").count()>=2 and "incompleto" in t)
    ck("pagamento escolhido NÃO aparece como aprovado","Não verificado" in t and "Pagamento confirmado" not in t.split("Atualizar situação")[0])
    ck("mensagem ao cliente usa o texto de frete em verificação","Estamos verificando o valor e o prazo de entrega" in t)
    href=await pg.get_attribute("a.btn.wa","href");ck("link do WhatsApp com telefone normalizado (55+DDD)",href.startswith("https://api.whatsapp.com/send?phone=5561993148800&text="))
    await pg.click("text=Iniciar análise");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(500)
    ck("mudança de status salva e aparece no histórico","Em análise" in await pg.inner_text(".main") and B4.pedidos[0]["status"]=="em_analise")
    await pg.click("text=Confirmar pedido");await pg.wait_for_selector("dialog")
    ck("confirmar sem frete aceito exige justificativa",await pg.locator("dialog textarea").count()==1);await pg.click("dialog >> text=Confirmar mesmo assim");await pg.wait_for_timeout(200)
    ck("   justificativa vazia é recusada",B4.pedidos[0]["status"]=="em_analise");await pg.click("dialog >> text=Voltar")
    await pg.select_option('select[aria-label="Situação do frete"]',"calculado");await pg.click("text=Salvar frete");await pg.wait_for_timeout(300)
    ck("frete calculado sem valor é recusado",B4.pedidos[0]["frete_situacao"]=="pendente")
    await pg.fill('input[aria-label="Valor do frete"]',"85,50");await pg.fill('input[aria-label="Prazo"]',"2 dias úteis");await pg.click("text=Salvar frete");await pg.wait_for_timeout(600)
    ck("frete registrado: total = produtos + frete (em centavos exatos)",B4.pedidos[0]["frete_centavos"]==8550 and B4.pedidos[0]["total_centavos"]==B4.pedidos[0]["subtotal_centavos"]+8550)
    t=await pg.inner_text(".main");ck("total final exibido e mensagem muda para informar o frete","R$ 85,50" in t and "Podemos confirmar o pedido" in t)
    await pg.select_option('select[aria-label="Situação do frete"]',"aceito");await pg.click("text=Salvar frete");await pg.wait_for_timeout(500)
    await pg.fill('textarea[aria-label="Nota interna"]',"Cliente pediu entrega à tarde");await pg.click("text=Salvar nota");await pg.wait_for_timeout(500)
    t=await pg.inner_text(".main");ck("nota interna aparece só no histórico (marcada como interna)","NOTA INTERNA" in t)
    ck("nota interna NÃO entra na mensagem ao cliente","entrega à tarde" not in await pg.inner_text(".msgbox"))
    await pg.click("text=Confirmar pedido");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(500);ck("com frete aceito, confirma sem justificativa",B4.pedidos[0]["status"]=="confirmado")
    for etapa,st in[("Iniciar separação","em_separacao"),("Marcar como pronto","pronto")]:
        await pg.click(f"text={etapa}");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(450)
    ck("fluxo até 'pronto' registrado",B4.pedidos[0]["status"]=="pronto")
    B4.pedidos[0]["status"]="em_separacao";B4.pedidos[0]["versao"]+=0
    await pg.click("text=Alterar manualmente");await pg.select_option('select[aria-label="Novo status"]',"concluido");await pg.fill('dialog textarea',"curto");await pg.click("dialog >> text=Alterar");await pg.wait_for_timeout(200)
    ck("salto de status com justificativa curta é recusado",B4.pedidos[0]["status"]=="em_separacao");await pg.click("dialog >> text=Voltar")
    B4.pedidos[0]["status"]="pronto";await pg.reload();await pg.wait_for_selector("text=Resumo financeiro")
    await pg.click("text=Registrar despacho");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(450)
    await pg.click("text=Concluir pedido");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(450);ck("despachado → concluído",B4.pedidos[0]["status"]=="concluido")
    ck("pedido concluído: sem botões de cancelar nem de avançar",await pg.locator("text=Cancelar pedido").count()==0)
    o2=B4.novo("Outro Cliente","61977776666");await pg.goto(f"file://{TMP}/admin/index.html#/pedido/{o2['id']}");await pg.wait_for_selector("text=Resumo financeiro")
    await pg.click("text=Cancelar pedido");await pg.click("dialog >> text=Cancelar pedido");await pg.wait_for_timeout(200)
    ck("cancelar exige motivo",o2["status"]=="recebido");await pg.fill("dialog textarea","Cliente desistiu");await pg.click("dialog >> text=Cancelar pedido");await pg.wait_for_timeout(500)
    ck("cancelamento registrado com motivo",o2["status"]=="cancelado" and "Cliente desistiu" in await pg.inner_text(".main"))
    o3=B4.novo("Concorrência","61966665555");await pg.goto(f"file://{TMP}/admin/index.html#/pedido/{o3['id']}");await pg.wait_for_selector("text=Resumo financeiro")
    o3["versao"]+=1   # outro funcionário alterou enquanto esta tela estava aberta
    await pg.click("text=Iniciar análise");await pg.click("dialog >> text=Confirmar");await pg.wait_for_timeout(600)
    ck("edição simultânea: conflito detectado, nada sobrescrito e tela recarregada",o3["status"]=="recebido" and await pg.locator(".toast").count()>=1)
    ck("sem erros de JavaScript/CSP no painel",not errs,str(errs));await pg.close()
    print("\n=== PAINEL: segurança e resiliência ===")
    B5=Back();x=B5.novo('<img src=x onerror="window.__xss=1">',"61955554444");pg,errs=await admin(B_=B5)
    await pg.goto(f"file://{TMP}/admin/index.html#/pedidos");await pg.wait_for_selector(".row:not(.h)")
    ck("lista: HTML no nome aparece como texto, sem executar",await pg.evaluate("window.__xss")is None and "<img src=x" in await pg.inner_text(".row:not(.h)"))
    await pg.click(".row:not(.h)");await pg.wait_for_selector("text=Resumo financeiro");ck("detalhe: idem (XSS bloqueado)",await pg.evaluate("window.__xss")is None)
    await pg.evaluate("sessionStorage.clear()");await pg.reload();await pg.wait_for_timeout(500);ck("sem sessão (token removido): volta ao login",await pg.locator(".login").count()==1)
    pg2,_=await admin(B_=B5);B5.staff=False;await pg2.goto(f"file://{TMP}/admin/index.html#/pedidos");await pg2.wait_for_timeout(700)
    ck("usuário logado mas SEM permissão da equipe: acesso negado e sessão encerrada","não tem acesso" in await pg2.inner_text(".login") and await pg2.evaluate("sessionStorage.getItem('rommo_admin_sessao')")is None);B5.staff=True
    pg3,_=await admin(B_=B5);b0=await pg3.evaluate("document.title");B5.novo("Chegou agora","61944443333")
    await pg3.evaluate("document.dispatchEvent(new Event('visibilitychange'))");await pg3.wait_for_timeout(900)
    ck("pedido novo chega sem recarregar a página (toast + contador)",await pg3.locator(".toast").count()==1 and "novo(s) pedido(s)" in await pg3.inner_text(".toast"))
    await pg3.evaluate("document.dispatchEvent(new Event('visibilitychange'))");await pg3.wait_for_timeout(700)
    ck("sem notificação duplicada para o mesmo pedido",await pg3.locator(".toast").count()==1)
    B5.falhar=3;await pg3.evaluate("document.dispatchEvent(new Event('visibilitychange'))");await pg3.wait_for_timeout(600)
    ck("perda de conexão: indicador 'Sem conexão'","Sem conexão" in await pg3.inner_text("#live"))
    await pg3.evaluate("document.dispatchEvent(new Event('visibilitychange'))");await pg3.wait_for_timeout(600)
    ck("conexão volta: indicador normaliza","Atualização automática" in await pg3.inner_text("#live"))
    print("\n=== PAINEL: celular ===")
    pg4,e4=await admin(w=390,B_=B3);await pg4.screenshot(path="/tmp/painel_mobile.png");ck("layout móvel: barra superior e sem rolagem lateral",await pg4.locator(".mbar").is_visible() and await pg4.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
    pg5,_=await admin(w=1300,B_=B4);await pg5.goto(f"file://{TMP}/admin/index.html#/pedido/{B4.pedidos[0]['id']}");await pg5.wait_for_selector("text=Resumo financeiro");await pg5.screenshot(path="/tmp/painel_detalhe.png",full_page=True)
    await b.close()
  ok=sum(R);print(f"\n{ok}/{len(R)} verificações passaram");sys.exit(0 if ok==len(R) else 1)
asyncio.run(main())
