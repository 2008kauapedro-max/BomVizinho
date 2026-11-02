/* BomVizinho — rolagem "manteiga": roda do mouse suavizada + descida animada ao clicar nos links */
(()=>{let cur=scrollY,tgt=scrollY,last=scrollY,raf=0,anim=0;
const max=()=>document.documentElement.scrollHeight-innerHeight,clamp=v=>Math.max(0,Math.min(max(),v));
const put=y=>{last=y;scrollTo(0,y)};
function tick(){raf=0;const d=tgt-cur;if(Math.abs(d)<.4){cur=tgt;put(cur);return}cur+=d*.09;put(cur);raf=requestAnimationFrame(tick)}
function stop(){anim++;}
function scrollable(el){for(;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){const s=getComputedStyle(el);if(/(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+1)return true;if(/(auto|scroll)/.test(s.overflowX)&&el.scrollWidth>el.clientWidth+1&&Math.abs(0)>1)return true}return false}
addEventListener("wheel",e=>{if(document.getElementById("ld")){e.preventDefault();return}if(e.ctrlKey||e.defaultPrevented||scrollable(e.target)||getComputedStyle(document.body).overflow==="hidden")return;
 e.preventDefault();stop();if(!raf){cur=scrollY}
 const k=e.deltaMode===1?32:e.deltaMode===2?innerHeight:1;tgt=clamp((raf?tgt:scrollY)+e.deltaY*k*1.15);if(!raf)raf=requestAnimationFrame(tick)},{passive:false});
addEventListener("scroll",()=>{if(Math.abs(scrollY-last)>3&&!raf){cur=tgt=last=scrollY}},{passive:true});
addEventListener("keydown",()=>stop());addEventListener("touchstart",()=>{stop();cancelAnimationFrame(raf);raf=0;cur=tgt=scrollY},{passive:true});
/* descida animada até um elemento (ou posição) */
window.bvScrollTo=target=>{let y;if(typeof target==="number")y=target;else{if(!target)return;const m=parseFloat(getComputedStyle(target).scrollMarginTop)||0;y=target.getBoundingClientRect().top+scrollY-m}
 y=clamp(y);const from=scrollY,dist=y-from;if(Math.abs(dist)<2)return;cancelAnimationFrame(raf);raf=0;const id=++anim,dur=Math.min(1700,Math.max(700,Math.abs(dist)*.45)),t0=performance.now(),ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
 (function f(now){if(id!==anim)return;const p=Math.min(1,(now-t0)/dur);cur=from+dist*ease(p);put(cur);if(p<1)requestAnimationFrame(f);else cur=tgt=y})(t0)};
})();
