/* BomVizinho — dados da loja. Confirme os dados comerciais antes de publicar. */
/* ===== CONFIGURAÇÃO ===== */
const WHATS="556195944857",LOJA="BomVizinho"; // WhatsApp comercial oficial, formato internacional sem +
// Dados da empresa (aparecem nas páginas de Sobre, Privacidade e Termos). Preencha o CNPJ quando tiver.
const EMPRESA={nome:"BomVizinho",razao:"",cnpj:"",email:"bomvizinhobve@gmail.com",tel:"(61) 9594-4857",cidade:"Planaltina - GO",insta:"@bomvizinho.bve"};
// Formas de pagamento mostradas no formulário de finalização (apague ou inclua as que quiser)
const PAGAMENTOS=["Pix","Cartão de crédito","Cartão de débito","Boleto","Dinheiro"];
const INSTAGRAM_URL="https://www.instagram.com/bomvizinho.bve/";
const MERCADO_LIVRE_LOJA_1="https://lista.mercadolivre.com.br/_CustId_73439697?item_id=MLB4986520416&category_id=MLB253383&seller_id=73439697";
const MERCADO_LIVRE_LOJA_2="https://lista.mercadolivre.com.br/_CustId_1686836728?item_id=MLB3894453987&category_id=MLB269955&seller_id=1686836728";
const WHATSAPP_CATALOGO_URL="https://wa.me/message/PHDJFZKTDJ2AD1";
// Tipos de entrega mostrados no formulário
const ENTREGAS=[{v:"Entrega",t:"Receber em casa",s:"Informe o endereço"},{v:"Retirada na loja",t:"Retirar na loja",s:"Planaltina - GO"}];
const CATS=[{id:"todos",n:"Todos",i:"grid"},{id:"eletricas",n:"Elétricas",i:"plug"},{id:"manuais",n:"Manuais",i:"wrench"},{id:"kits",n:"Kits",i:"box"},{id:"irrigacao",n:"Irrigação",i:"drop"},{id:"agro",n:"Agropecuária",i:"tractor"},{id:"jardim",n:"Jardim",i:"leaf"},{id:"construcao",n:"Construção",i:"hat"},{id:"limpeza",n:"Limpeza",i:"spray"}];
// Banners principais: imagens em assets/banner-1.jpg ... Se a arte já tiver texto, use soImagem:true
const HERO=[
 {img:"assets/bomvizinho-drill-hero.png",c:"#f5b51b",t:"Ferramentas certas. Trabalho bem feito.",p:"Encontre ferramentas elétricas e equipamentos para tirar seu próximo projeto do papel.",b:"Explorar ferramentas",cat:"eletricas"}
];
// Produtos: a foto é lida de assets/produtos/ID.png (ex.: 1.png). Para outro nome, adicione img:"assets/produtos/arquivo.png"
let P=[
{id:1,cat:"eletricas",n:"Parafusadeira Furadeira de Impacto Brushless 20V",p:999,o:1111.11,r:4.9,v:127,t:"Mais vendido",tc:"m"},
{id:2,cat:"kits",n:"Jogo de Ferramentas Completo 178 Peças com Chaves",p:919.9,o:1517.46,r:4.9,v:89},
{id:3,cat:"eletricas",n:"Esmerilhadeira Angular 4-1/2 Pol 850W 110V",p:279.9,r:4.9,v:64},
{id:4,cat:"eletricas",n:"Furadeira de Impacto 750W 220V com Maleta",p:379.9,r:4.9,v:52},
{id:5,cat:"eletricas",n:"Parafusadeira Furadeira de Impacto 38Pol 20V",p:229.9,r:4.6,v:31,t:"Novo",tc:"n"},
{id:6,cat:"jardim",n:"Kit Jardinagem Completo com Maleta 10 Peças",p:89.9,r:5,v:18,t:"Novo",tc:"n"},
{id:7,cat:"eletricas",n:"Compressor de Ar 110 Litros 10 Pés 220V",p:2899.99,r:4.8,v:23},
{id:8,cat:"limpeza",n:"Lavadora de Alta Pressão 1740PSI 1400W",p:529.9,o:588.78,r:4.7,v:41},
{id:9,cat:"manuais",n:"Chave Combinada Jogo 12 Peças Cromo Vanádio",p:149.9,o:199.9,r:4.9,v:76},
{id:10,cat:"irrigacao",n:"Sistema de Irrigação por Gotejamento 50m",p:189.9,r:4.8,v:34,t:"Novo",tc:"n"},
{id:11,cat:"agro",n:"Roçadeira a Gasolina 52cc Profissional",p:1299,o:1599,r:4.8,v:45},
{id:12,cat:"construcao",n:"Betoneira 400L 220V Monofásica",p:2599.9,r:4.7,v:28}];

