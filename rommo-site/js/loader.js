/* BomVizinho – tela de carregamento: dura no mínimo DUR ms e só sai quando a página terminar de carregar */
(()=>{const DUR=4400/* duração mínima curta para não prender a tela */,t0=Date.now(),L=document.getElementById("ld"),B=document.getElementById("ldb"),T=document.getElementById("ldp");if(!L)return;let ok=0,end=0;
const tick=setInterval(()=>{const e=Date.now()-t0,pr=Math.min(e/DUR,1),v=ok&&pr>=1?100:Math.min(pr*100,96);B.style.width=v+"%";T.textContent=Math.round(v)+"%";
 if(v>=100&&!end){end=1;clearInterval(tick);setTimeout(()=>{L.classList.add("out");document.body.classList.remove("ldg");dispatchEvent(new Event("loaderdone"));setTimeout(()=>L.remove(),700)},120)}},40);
const done=()=>{ok=1};if(document.readyState==="complete")done();else addEventListener("load",done);setTimeout(done,2500)})();
/* Loader autoral: marcas de registro, palavras do segmento e trena que se estica (Web Animations, sem travar) */
(()=>{const L=document.getElementById("ld");if(!L||!L.animate)return;const q=s=>L.querySelector(s),o={fill:"backwards",easing:"cubic-bezier(.2,.8,.2,1)"};
q(".ld-grid").animate([{transform:"translate3d(0,0,0)"},{transform:"translate3d(-64px,-64px,0)"}],{duration:6000,iterations:Infinity});
q(".ld-badge").animate([{opacity:0,transform:"translateY(14px)"},{opacity:1,transform:"none"}],{...o,duration:700});
[["k1","-16px,-16px"],["k2","16px,-16px"],["k3","-16px,16px"],["k4","16px,16px"]].forEach(([k,t])=>q("."+k).animate([{opacity:0,transform:`translate(${t})`},{opacity:1,transform:"none"}],{...o,duration:700,delay:500}));
q(".ld-name").animate([{clipPath:"inset(0 100% 0 0)",letterSpacing:".5em"},{clipPath:"inset(0 0 0 0)",letterSpacing:".24em"}],{...o,duration:1100,delay:350});
q(".ld-tag").animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{...o,duration:700,delay:1300});
q(".pg").animate([{transform:"translateY(100%)"},{transform:"none"}],{...o,duration:700,delay:100});
const W=["FERRAMENTAS","MATERIAIS DE CONSTRUÇÃO","IRRIGAÇÃO","AGROPECUÁRIA","JARDIM E CAMPO"],w=q("#ldw");let i=0;
const t=setInterval(()=>{if(!L.isConnected){clearInterval(t);return}i=(i+1)%W.length;w.textContent=W[i];w.animate([{transform:"translateY(110%)",opacity:0},{transform:"none",opacity:1}],{duration:380,easing:"cubic-bezier(.2,.8,.2,1)"})},800);
})();
