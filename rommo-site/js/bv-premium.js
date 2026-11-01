/* BomVizinho — movimento extra: progresso de rolagem e brilho que segue o mouse nos cards */
(()=>{const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const bar=document.createElement("div");bar.id="bvp";bar.setAttribute("aria-hidden","true");document.body.appendChild(bar);
let t=0;const upd=()=>{t=0;const m=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${m>0?Math.min(1,scrollY/m):0})`};
addEventListener("scroll",()=>{if(!t)t=requestAnimationFrame(upd)},{passive:true});upd();
if(reduce||!matchMedia("(hover:hover)").matches)return;
document.addEventListener("pointermove",e=>{const c=e.target.closest&&e.target.closest(".cat,.card");if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5).toFixed(2));c.style.setProperty("--my",((e.clientY-r.top)/r.height-.5).toFixed(2))},{passive:true});
})();
