# Catálogo ROMMO

Site estático (sem banco de dados). Publicado na Vercel pelo projeto **rommo**, a partir desta pasta.

- **Produtos, preços, ofertas, WhatsApp e Instagram:** `js/data.js`
  - `de:` (preço antigo) coloca o produto nas Ofertas da semana
  - `destaque: true` coloca em Mais procurados; `novo: true` mostra a etiqueta Novo
  - fotos em `assets/produtos/ID.webp` (quadradas, fundo branco)
  - `tags:` outros nomes que o povo usa (ex.: "cachimbo coquete") — a busca encontra por eles
  - `grupo:` mesmo produto em tamanhos/modelos diferentes (ex.: coquete 12, 13, 14) — aparecem em "Outros modelos"
- **Sinônimos para todos os produtos de uma vez:** lista `SINONIMOS` em `js/data.js`
- **Busca:** primeiro o que bate com o que foi digitado; depois "Relacionados" (mesmo grupo, mesma categoria, palavras em comum)
- **Página do produto:** embaixo mostra "Outros modelos" e "Você também pode gostar"
- **Posts do Instagram (opcional):** lista `INSTAGRAM_POSTS` em `js/data.js` — vazia, a seção não aparece
- **Visual:** `css/app.css` · **Comportamento:** `js/app.js`
