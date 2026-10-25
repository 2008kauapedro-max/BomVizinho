// Gera supabase/seed_produtos.sql a partir de js/data.js (rode: node supabase/gerar_seed.js > supabase/seed_produtos.sql)
const fs=require("fs"),vm=require("vm");
const src=fs.readFileSync(__dirname+"/../js/data.js","utf8")+"\n;({P,CATS})";
const {P,CATS}=vm.runInNewContext(src);
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
console.log("-- Gerado de js/data.js. Rode de novo sempre que mudar produtos ou preços no site.\ninsert into public.produtos (id, nome, categoria, preco_centavos, ativo) values");
console.log(P.map(p=>`  (${p.id}, ${q(p.n)}, ${q(CATS.find(c=>c.id===p.cat).n)}, ${Math.round(p.p*100)}, true)`).join(",\n"));
console.log("on conflict (id) do update set nome = excluded.nome, categoria = excluded.categoria, preco_centavos = excluded.preco_centavos, ativo = true;");
