/* ROMMO – DADOS DA LOJA: edite aqui o WhatsApp, categorias, banners e produtos */
/* ===== CONFIGURAÇÃO ===== */
const WHATS="5561993148848",LOJA="ROMMO";
// Dados da empresa (aparecem nas páginas de Sobre, Privacidade e Termos). Preencha o CNPJ quando tiver.
const EMPRESA={nome:"ROMMO",razao:"",cnpj:"",email:"contato@rommo.com.br",tel:"(61) 99314-8848",cidade:"Planaltina - GO",insta:"@somosrommo"};
// Formas de pagamento mostradas no formulário de finalização (apague ou inclua as que quiser)
const PAGAMENTOS=["Pix","Cartão de crédito","Cartão de débito","Boleto","Dinheiro"];
// Tipos de entrega mostrados no formulário
const ENTREGAS=[{v:"Entrega",t:"Receber em casa",s:"Informe o endereço"},{v:"Retirada na loja",t:"Retirar na loja",s:"Planaltina - GO"}];
const CATS=[{id:"todos",n:"Todos",i:"grid"},{id:"eletricas",n:"Elétricas",i:"plug"},{id:"manuais",n:"Manuais",i:"wrench"},{id:"kits",n:"Kits",i:"box"},{id:"irrigacao",n:"Irrigação",i:"drop"},{id:"agro",n:"Agropecuária",i:"tractor"},{id:"jardim",n:"Jardim",i:"leaf"},{id:"construcao",n:"Construção",i:"hat"},{id:"limpeza",n:"Limpeza",i:"spray"}];
// Banners principais: imagens em assets/banner-1.jpg ... Se a arte já tiver texto, use soImagem:true
const HERO=[
 {img:"assets/banner-1.jpg",c:"#1d8a33",t:"Ferramentas profissionais para o seu trabalho",p:"Das melhores marcas, com atendimento rápido em Planaltina-GO e região.",b:"Ver produtos",cat:"todos"},
 {img:"assets/banner-2.jpg",c:"#2b7fe0",t:"Irrigação e agro para o campo render mais",p:"Gotejamento, roçadeiras e tudo para a sua produção.",b:"Ver irrigação",cat:"irrigacao"},
 {img:"assets/banner-3.jpg",c:"#f5a800",t:"Linha elétrica com preços especiais",p:"Furadeiras, parafusadeiras e esmerilhadeiras.",b:"Ver ofertas",cat:"eletricas"}];
// Produtos: a foto é lida de assets/produtos/ID.png (ex.: 1.png). Para outro nome, adicione img:"assets/produtos/arquivo.png"
const P=[
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

