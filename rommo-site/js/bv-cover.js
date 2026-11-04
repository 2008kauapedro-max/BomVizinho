/* BomVizinho — capa em tela cheia que encolhe até virar o hero (e volta ao subir) + menu lateral */
(()=>{const $=s=>document.querySelector(s),hero=$("#hero");if(!hero)return;
const c=document.createElement("div");c.id="bvcover";
c.innerHTML='<div class="bvc-img"></div><div class="bvc-ui"><a class="bvc-logo" href="#" aria-label="BomVizinho"><img src="assets/bomvizinho-icon-256.png" alt=""><span>BomVizinho</span></a><button class="bvc-burger" type="button" aria-label="Abrir menu"><i></i><i></i><i></i></button><div class="bvc-mid"><p>FERRAMENTAS & EQUIPAMENTOS</p><h2>Ferramentas certas.<br>Trabalho bem feito.</h2></div><div class="bvc-hint"><span class="bvc-m">Arraste para cima</span><span class="bvc-d">Role para baixo</span><i class="bvc-arrow"></i></div></div>';
document.body.appendChild(c);
const im=c.querySelector(".bvc-img"),ui=c.querySelector(".bvc-ui");
const pic=()=>{im.style.backgroundImage=`url("${matchMedia("(max-width:760px)").matches?"assets/herocelular.webp":"assets/bomvizinho-drill-hero.webp"}")`};pic();
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
/* encolhimento ligado à rolagem — só clip-path/opacity (sem recalcular layout a cada quadro) */
let D=600,fr=0,M=null;const ease=p=>p*p*(3-2*p);
function measure(){const st=$(".experience-stage");if(!st)return;const r=st.getBoundingClientRect();M={t:r.top+scrollY,l:r.left,w:r.width,h:r.height}}
function size(){pic();D=Math.round(Math.min(innerHeight*.85,760));hero.style.paddingTop=D+"px";measure();upd()}
function upd(){fr=0;if(!M)measure();if(!M)return;const y=scrollY,p=Math.min(1,Math.max(0,y/D));
 if(p>=1){if(c.style.display!=="none")c.style.display="none";return}if(c.style.display!=="block")c.style.display="block";
 const e=ease(p),vw=innerWidth,vh=innerHeight,top=M.t-y,
  T=Math.max(0,top)*e,L=M.l*e,R=Math.max(0,vw-M.l-M.w)*e,B=Math.max(0,vh-top-M.h)*e;
 im.style.clipPath=`inset(${T.toFixed(1)}px ${R.toFixed(1)}px ${B.toFixed(1)}px ${L.toFixed(1)}px round ${(28*e).toFixed(1)}px)`;
 im.style.opacity=p>.86?Math.max(0,1-(p-.86)/.14):1;
 ui.style.opacity=Math.max(0,1-p*3.2);ui.style.pointerEvents=p>.25?"none":"auto"}
addEventListener("scroll",()=>{if(!fr)fr=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",()=>{size()});
size();addEventListener("load",size);
/* abertura sempre no topo: sem restaurar rolagem antiga e sem capa "desatualizada" */
try{history.scrollRestoration="manual"}catch(e){}
const top=()=>{if(!/^#\//.test(location.hash))scrollTo(0,0)};if(location.hash&&!/^#\//.test(location.hash)){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}top();
/* trava de abertura: até a pessoa interagir de verdade, a página fica no topo */
let touched=false;["wheel","touchstart","keydown","pointerdown"].forEach(e=>addEventListener(e,()=>{if(!document.getElementById("ld"))touched=true},{passive:true,capture:true}));
const t0=Date.now(),guard=setInterval(()=>{if(touched||Date.now()-t0>20000){clearInterval(guard);return}if(scrollY>0&&!/^#\//.test(location.hash))scrollTo(0,0)},80);
const refresh=()=>{size()};[0,300,1000,2500,4800,6500].forEach(t=>setTimeout(refresh,t));
addEventListener("pageshow",refresh);
new ResizeObserver(()=>{if(!fr)fr=requestAnimationFrame(upd)}).observe(document.body);
const mo=new MutationObserver(()=>{if(!document.getElementById("ld")){mo.disconnect();const top=()=>{if(!/^#\//.test(location.hash))scrollTo(0,0)};if(location.hash&&!/^#\//.test(location.hash)){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}top();refresh()}});mo.observe(document.body,{childList:true});
})();
