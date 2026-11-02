/* BomVizinho — página "Loja": catálogo completo com busca, categorias, ordenação e carregamento por partes */
(()=>{const $=s=>document.querySelector(s);let el,S={cat:"todos",q:"",sort:"rel",n:24},list=[],timer=0,io;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function build(){el=document.createElement("section");el.id="bvstore";el.setAttribute("aria-label","Loja");
 el.innerHTML=`<div class="bs-top"><button type="button" class="bs-back" aria-label="Voltar">‹</button><label class="bs-search"><input id="bsq" type="search" placeholder="Buscar na loja" autocomplete="off" enterkeyhint="search"></label><button type="button" class="bs-cart" aria-label="Carrinho" onclick="openCart()">${typeof ic==="function"?ic("cart"):"🛒"}</button></div>
 <div class="bs-chips" id="bsc">${CATS.map(c=>`<button type="button" data-c="${c.id}">${c.n}</button>`).join("")}</div>
 <div class="bs-bar"><span id="bsn"></span><select id="bss" aria-label="Ordenar"><option value="rel">Relevância</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="az">Nome A–Z</option></select></div>
 <div class="grid bs-grid" id="bsg"></div><div class="bs-more" id="bsm"></div>`;
 document.body.appendChild(el);
 el.querySelector(".bs-back").onclick=()=>history.back();
 $("#bsc").onclick=e=>{const b=e.target.closest("button");if(!b)return;S.cat=b.dataset.c;S.n=24;render(true)};
 $("#bsq").oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>{S.q=norm(e.target.value.trim());S.n=24;render(true)},180)};
 $("#bss").onchange=e=>{S.sort=e.target.value;S.n=24;render(true)};
 $("#bsm").onclick=e=>{if(e.target.closest("button")){S.n+=24;render()}};
 io=new IntersectionObserver(en=>{if(en[0].isIntersecting&&S.n<list.length){S.n+=24;render()}},{root:el,rootMargin:"600px"});io.observe($("#bsm"))}
function render(top){
 list=P.filter(p=>(S.cat==="todos"||p.cat===S.cat)&&(!S.q||norm(p.n+" "+cc(p.cat).n).includes(S.q)));
 if(S.sort==="menor")list.sort((a,b)=>a.p-b.p);else if(S.sort==="maior")list.sort((a,b)=>b.p-a.p);else if(S.sort==="az")list.sort((a,b)=>a.n.localeCompare(b.n,"pt-BR"));
 $("#bsg").innerHTML=list.length?list.slice(0,S.n).map(card).join(""):'<p class="empty">Nenhum produto encontrado. Tente outra busca ou categoria.</p>';
 $("#bsn").textContent=list.length.toLocaleString("pt-BR")+(list.length===1?" produto":" produtos");
 $("#bsm").innerHTML=S.n<list.length?`<button class="btn ol" type="button">Carregar mais produtos</button>`:(list.length>24?'<small>Você chegou ao fim da lista</small>':"");
 el.querySelectorAll("#bsc button").forEach(b=>b.classList.toggle("on",b.dataset.c===S.cat));
 if(top)el.scrollTo({top:0})}
window.openStore=(cat,term)=>{if(!el)build();S.cat=cat||"todos";S.q=norm(term||"");S.n=24;S.sort="rel";$("#bsq").value=term||"";$("#bss").value="rel";render(true);
 el.classList.add("on");document.body.classList.add("bvstore-open");document.body.style.overflow="hidden";
 if(!(history.state&&history.state.bvstore))history.pushState({bvstore:1},"")};
function close(){if(!el)return;el.classList.remove("on");document.body.classList.remove("bvstore-open");document.body.style.overflow=""}
addEventListener("popstate",()=>{if(el&&el.classList.contains("on"))close()});
})();
