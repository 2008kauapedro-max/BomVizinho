/* BomVizinho – tela de carregamento: dura no mínimo DUR ms e só sai quando a página terminar de carregar */
(()=>{const DUR=1200/* duração mínima curta para não prender a tela */,t0=Date.now(),L=document.getElementById("ld"),B=document.getElementById("ldb"),T=document.getElementById("ldp");if(!L)return;let ok=0,end=0;
const tick=setInterval(()=>{const e=Date.now()-t0,pr=Math.min(e/DUR,1),v=ok&&pr>=1?100:Math.min(pr*100,96);B.style.width=v+"%";T.textContent=Math.round(v)+"%";
 if(v>=100&&!end){end=1;clearInterval(tick);setTimeout(()=>{L.classList.add("out");document.body.classList.remove("ldg");dispatchEvent(new Event("loaderdone"));setTimeout(()=>L.remove(),700)},120)}},40);
const done=()=>{ok=1};if(document.readyState==="complete")done();else addEventListener("load",done);setTimeout(done,2500)})();
