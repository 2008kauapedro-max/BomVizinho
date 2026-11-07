/* ROMMO — DADOS DO CATÁLOGO
   Tudo que muda no dia a dia fica aqui: contato, linhas, produtos e ofertas. */

const LOJA = {
  nome: "ROMMO",
  whatsapp: "5561993148848",           // só números, com 55 + DDD
  whatsappVisivel: "(61) 99314-8848",
  instagram: "somosrommo",             // sem @
  cidade: "Planaltina - GO",
  mapa: "https://maps.app.goo.gl/hakYCaeqJ4LPmRhp7",
  referencia: "Ao lado do Retalhão Elias",
  endereco: "QA 12 MC, Lote 01 - Planaltina, GO, 73753-112",
  nomeNoMapa: "Rommo Ferramentas, Irrigação e Agropecuária",  // como aparece no Google Maps
  slogan: "Qualidade, atendimento e agilidade.",
  horario: "",                         // ex.: "Seg a sex, 8h às 18h" — vazio não aparece
};

/* As 4 linhas da marca (as mesmas dos quadradinhos da logo) */
const LINHAS = [
  { id: "irrigacao", nome: "Irrigação", cor: "#8ABA06", icone: "assets/logo/quad-1.webp", cats: ["irrigacao"] },
  { id: "ferramentas", nome: "Ferramentas", cor: "#FCC300", icone: "assets/logo/quad-2.webp", cats: ["manuais", "kits", "construcao", "limpeza"] },
  { id: "eletricas", nome: "Elétricas", cor: "#007EC6", icone: "assets/logo/quad-3.webp", cats: ["eletricas"] },
  { id: "agro", nome: "Agro", cor: "#FFFFFF", icone: "assets/logo/quad-4.webp", cats: ["agro", "jardim"] },
];

/* Produtos de exemplo — troque pelos reais.
   p        = preço · de = preço antigo (se tiver, entra nas Ofertas)
   destaque = aparece em Destaques · novo = etiqueta "Novo"
   tags     = outros nomes que o povo usa pra procurar esse produto (opcional)
   selo     = "mais-vendido" ou "ultimas" (só marque quando for verdade)
   combina  = ids de produtos que vão junto (aparecem em "Combina com")
   grupo    = produtos que são o mesmo item em tamanhos/modelos diferentes
              (ex.: coquete 12, 13 e 14 com grupo: "coquete") — aparecem juntos em "Outros modelos" */
const PRODUTOS = [
  { id: 1, cat: "eletricas", nome: "Furadeira de impacto 650W", p: 329.9, de: 389.9, tags: "furar broca perfuradora parede concreto", combina: [9, 7, 3] },
  { id: 2, cat: "eletricas", nome: "Parafusadeira de impacto 21V com bateria", p: 249.9, destaque: true, tags: "parafuso apertadeira sem fio bateria", selo: "mais-vendido", combina: [3, 9] },
  { id: 3, cat: "manuais", nome: "Jogo de chaves e bits 46 peças", p: 89.9, de: 119.9, grupo: "jogo-chaves", tags: "ponta bit phillips fenda parafuso catraca" },
  { id: 4, cat: "kits", nome: "Maleta de ferramentas 25 peças", p: 179.9, destaque: true, grupo: "kit-ferramentas", tags: "caixa de ferramentas jogo", combina: [7, 9] },
  { id: 5, cat: "kits", nome: "Kit de ferramentas 129 peças com maleta", p: 349.9, de: 459.9, grupo: "kit-ferramentas", tags: "caixa de ferramentas jogo completo" },
  { id: 6, cat: "manuais", nome: "Jogo de chaves combinadas 12 peças", p: 139.9, grupo: "jogo-chaves", tags: "chave de boca estria porca" },
  { id: 7, cat: "manuais", nome: "Trena profissional 8 m", p: 39.9, novo: true, tags: "fita metrica medir metro", selo: "mais-vendido" },
  { id: 8, cat: "construcao", nome: "Kit EPI com capacete e luvas", p: 119.9, tags: "seguranca protecao obra", combina: [9, 7] },
  { id: 9, cat: "construcao", nome: "Óculos de proteção incolor", p: 14.9, tags: "seguranca epi protecao" },
  { id: 10, cat: "irrigacao", nome: "Mangueira para jardim 30 m com engates", p: 129.9, de: 159.9, destaque: true, tags: "mangote regar molhar esguicho", selo: "mais-vendido", combina: [11, 14] },
  { id: 11, cat: "irrigacao", nome: "Kit irrigação por gotejamento", p: 189.9, novo: true, destaque: true, tags: "gotejador horta microaspersor", combina: [10, 14] },
  { id: 12, cat: "agro", nome: "Pulverizador costal 20 L", p: 219.9, de: 269.9, destaque: true, tags: "bomba costal veneno borrifador aplicador", selo: "ultimas", combina: [8, 9] },
  { id: 13, cat: "jardim", nome: "Tesoura de poda profissional", p: 49.9, tags: "podador galho", combina: [14, 15] },
  { id: 14, cat: "jardim", nome: "Kit jardinagem 3 peças", p: 39.9, novo: true, grupo: "kit-jardinagem", tags: "pazinha rastelo horta", combina: [13, 11] },
  { id: 15, cat: "jardim", nome: "Kit jardinagem com maleta 9 peças", p: 99.9, de: 129.9, grupo: "kit-jardinagem", tags: "pazinha rastelo horta" },
  { id: 16, cat: "limpeza", nome: "Kit de limpeza automotiva", p: 159.9, tags: "carro lavar polir" },
];

/* Palavras que querem dizer a mesma coisa. Vale para TODOS os produtos de uma vez:
   quem procurar qualquer palavra do grupo encontra produtos com as outras.
   Para incluir um apelido novo, é só acrescentar aqui. */
const SINONIMOS = [
  ["cachimbo", "coquete"],
  ["mangueira", "mangote"],
  ["pulverizador", "bomba costal", "borrifador"],
  ["trena", "fita metrica"],
  ["chave", "ferramenta manual"],
  ["parafusadeira", "apertadeira"],
  ["epi", "seguranca", "protecao"],
  ["gotejamento", "gotejador"],
];

/* ============ MARKETING ============ */

/* Campanha do momento: muda o título do bloco amarelo e o relógio passa a contar até "fim".
   Para voltar ao normal ("Ofertas da semana"), deixe ativa: false. */
const CAMPANHA = { ativa: true, titulo: "Esquenta Black Friday", fim: "2026-11-30T23:59:00-03:00" };

/* Cupom de quem pede pelo site: vai escrito na mensagem do WhatsApp.
   Deixe codigo: "" para desligar. */
const CUPOM = { codigo: "SITE5", texto: "5% de desconto pedindo pelo site" };

/* Prêmio da lista: mostra quanto falta para ganhar. Deixe valor: 0 para desligar.
   CONFIRMAR COM A LOJA antes de publicar o benefício. */
const META = { valor: 300, premio: "entrega grátis em Planaltina" };

/* Kits prontos: um toque coloca todos os itens na lista */
const KITS = [
  { id: "horta", nome: "Montar uma horta", desc: "Tudo pra começar a plantar em casa", itens: [11, 14, 13], cor: "#8ABA06" },
  { id: "quintal", nome: "Irrigar o quintal", desc: "Mangueira e gotejamento", itens: [10, 11], cor: "#007EC6" },
  { id: "casa", nome: "Ferramentas de casa", desc: "O básico pra resolver tudo", itens: [4, 7, 2], cor: "#FCC300" },
  { id: "obra", nome: "Segurança na obra", desc: "Proteção pra trabalhar tranquilo", itens: [8, 9, 7], cor: "#15150f" },
];

/* (Opcional) Últimas postagens do Instagram — se ficar vazio, a seção não aparece.
   Para mostrar posts reais, cole aqui a imagem e o link de cada post:
   { img: "assets/insta/post1.webp", link: "https://www.instagram.com/p/XXXX/" }
*/
const INSTAGRAM_POSTS = [];
