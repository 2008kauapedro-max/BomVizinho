/* BomVizinho — capa em tela cheia que encolhe até virar o hero (e volta ao subir) + menu lateral */
(()=>{const $=s=>document.querySelector(s),hero=$("#hero");if(!hero)return;
const c=document.createElement("div");c.id="bvcover";
c.innerHTML='<div class="bvc-img"></div><div class="bvc-ui"><a class="bvc-logo" href="#" aria-label="BomVizinho"><img src="assets/bomvizinho-icon-256.png" alt=""><span>BomVizinho</span></a><button class="bvc-burger" type="button" aria-label="Abrir menu"><i></i><i></i><i></i></button><div class="bvc-mid"><p>FERRAMENTAS & EQUIPAMENTOS</p><h2>Ferramentas certas.<br>Trabalho bem feito.</h2></div><div class="bvc-hint"><span class="bvc-m">Arraste para cima</span><span class="bvc-d">Role para baixo</span><i class="bvc-arrow"></i></div></div>';
document.body.appendChild(c);
const im=c.querySelector(".bvc-img"),ui=c.querySelector(".bvc-ui");
im.style.backgroundImage='url("assets/bomvizinho-drill-hero.webp")';
c.querySelector(".bvc-arrow").animate([{transform:"translateY(0) rotate(45deg)",opacity:.3},{transform:"translateY(9px) rotate(45deg)",opacity:1},{transform:"translateY(0) rotate(45deg)",opacity:.3}],{duration:1600,iterations:Infinity});
/* menu lateral */
const m=document.createElement("aside");m.id="bvmenu";m.setAttribute("aria-hidden","true");
const cats=(typeof CATS!=="undefined"?CATS.slice(1):[]).map(k=>`<a href="#" data-cat="${k.id}">${k.n}</a>`).join("");
m.innerHTML=`<div class="bvm-h"><b>Menu</b><button type="button" aria-label="Fechar menu">×</button></div><nav><a href="#" data-go="cats">Categorias</a>${cats}<hr><a href="#" data-go="ofertas">Ofertas</a><a href="#" data-go="produtos">Todos os produtos</a><a href="#" data-go="loja">Contato e loja</a><a href="#" data-wa="1">WhatsApp</a></nav>`;
const sh=document.createElement("div");sh.id="bvmenu-sh";document.body.append(sh,m);
const open=v=>{m.classList.toggle("on",v);sh.classList.toggle("on",v);m.setAttribute("aria-hidden",String(!v))};
document.addEventListener("click",e=>{const t=e.target;
 if(t.closest(".bvc-burger,.bvh-burger")){open(true);return}
 if(t.closest("#bvmenu-sh,.bvm-h button")){open(false);return}
 const a=t.closest("#bvmenu a");if(a){e.preventDefault();open(false);
  if(a.dataset.cat)setCat(a.dataset.cat);else if(a.dataset.go)go(a.dataset.go);else if(a.dataset.wa)wa("Olá! Vim pelo site da BomVizinho.")}
 if(t.closest(".bvc-logo")){e.preventDefault();scrollTo(0,0)}});
/* botão de menu no cabeçalho */
const act=$(".act");if(act){const b=document.createElement("button");b.className="bvh-burger";b.type="button";b.setAttribute("aria-label","Abrir menu");b.innerHTML="<i></i><i></i><i></i>";act.appendChild(b)}
/* encolhimento ligado à rolagem */
let D=600,fr=0;const ease=p=>p*p*(3-2*p);
function size(){D=Math.round(Math.min(innerHeight*.85,760));hero.style.paddingTop=D+"px";upd()}
function upd(){fr=0;const st=$(".experience-stage");if(!st)return;const p=Math.min(1,Math.max(0,scrollY/D));
 if(p>=1){c.style.display="none";return}c.style.display="block";
 const r=st.getBoundingClientRect(),e=ease(p),vw=innerWidth,vh=innerHeight,
  T=r.top*e,L=r.left*e,R=Math.max(0,(vw-r.right)*e),B=Math.max(0,(vh-r.bottom)*e);
 im.style.cssText+=`;top:${T}px;left:${L}px;width:${vw-L-R}px;height:${vh-T-B}px;border-radius:${28*e}px`;
 ui.style.opacity=Math.max(0,1-p*3.2);ui.style.pointerEvents=p>.25?"none":"auto"}
addEventListener("scroll",()=>{if(!fr)fr=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",size);
size();addEventListener("load",size);
})();
