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
  slogan: "Qualidade, atendimento e agilidade.",
  horario: "",                         // ex.: "Seg a sex, 8h às 18h" — vazio não aparece
};

/* As 4 linhas da marca (as mesmas dos quadradinhos da logo) */
const LINHAS = [
  { id: "irrigacao", nome: "Irrigação", cor: "#8ABA06", tinta: "#0b1400", icone: "assets/logo/icone-1.webp", foto: "assets/fotos/irrigacao-campo.webp", frase: "Gotejamento, aspersores e mangueiras", cats: ["irrigacao"] },
  { id: "ferramentas", nome: "Ferramentas", cor: "#FCC300", tinta: "#1a1300", icone: "assets/logo/icone-2.webp", foto: "assets/fotos/ferramentas.webp", frase: "Manuais, kits e construção", cats: ["manuais", "kits", "construcao", "limpeza"] },
  { id: "eletricas", nome: "Elétricas e motores", cor: "#007EC6", tinta: "#ffffff", icone: "assets/logo/icone-3.webp", foto: "assets/fotos/linha-eletrica.webp", frase: "Furadeiras, parafusadeiras e bombas", cats: ["eletricas"] },
  { id: "agro", nome: "Agro e jardim", cor: "#FFFFFF", tinta: "#000000", icone: "assets/logo/icone-4.webp", foto: "assets/fotos/irrigacao-campo.webp", frase: "Roçadeiras e cuidado com a terra", cats: ["agro", "jardim"] },
];

/* Produtos de exemplo — troque pelos reais.
   p = preço, de = preço antigo (se tiver, o produto entra nas Ofertas), destaque = aparece em "Mais procurados" */
const PRODUTOS = [
  { id: 1, cat: "eletricas", nome: "Furadeira de impacto 650W", p: 329.9, de: 389.9 },
  { id: 2, cat: "eletricas", nome: "Parafusadeira de impacto 21V com bateria", p: 249.9, destaque: true },
  { id: 3, cat: "manuais", nome: "Jogo de chaves e bits 46 peças", p: 89.9, de: 119.9 },
  { id: 4, cat: "kits", nome: "Maleta de ferramentas 25 peças", p: 179.9, destaque: true },
  { id: 5, cat: "kits", nome: "Kit de ferramentas 129 peças com maleta", p: 349.9, de: 459.9 },
  { id: 6, cat: "manuais", nome: "Jogo de chaves combinadas 12 peças", p: 139.9 },
  { id: 7, cat: "manuais", nome: "Trena profissional 8 m", p: 39.9, novo: true },
  { id: 8, cat: "construcao", nome: "Kit EPI com capacete e luvas", p: 119.9 },
  { id: 9, cat: "construcao", nome: "Óculos de proteção incolor", p: 14.9 },
  { id: 10, cat: "irrigacao", nome: "Mangueira para jardim 30 m com engates", p: 129.9, de: 159.9, destaque: true },
  { id: 11, cat: "irrigacao", nome: "Kit irrigação por gotejamento", p: 189.9, novo: true, destaque: true },
  { id: 12, cat: "agro", nome: "Pulverizador costal 20 L", p: 219.9, de: 269.9, destaque: true },
  { id: 13, cat: "jardim", nome: "Tesoura de poda profissional", p: 49.9 },
  { id: 14, cat: "jardim", nome: "Kit jardinagem 3 peças", p: 39.9, novo: true },
  { id: 15, cat: "jardim", nome: "Kit jardinagem com maleta 9 peças", p: 99.9, de: 129.9 },
  { id: 16, cat: "limpeza", nome: "Kit de limpeza automotiva", p: 159.9 },
];

/* Últimas postagens do Instagram.
   Para mostrar posts reais, cole aqui a imagem e o link de cada post:
   { img: "assets/insta/post1.webp", link: "https://www.instagram.com/p/XXXX/" }
   Enquanto estiver vazio, o site mostra uma vitrine com fotos dos produtos chamando para o perfil. */
const INSTAGRAM_POSTS = [];
