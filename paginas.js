/* ROMMO – telas internas (Sobre, Privacidade, Termos, Como comprar) e links do rodapé que abrem o WhatsApp */
const DATA_ATUAL="outubro de 2026";
const TITULO=document.title;
const cnpjTxt=()=>EMPRESA.cnpj?` (CNPJ ${EMPRESA.cnpj})`:"";
const contatoTxt=()=>`<div class="box"><b>${EMPRESA.nome}</b>${cnpjTxt()}<br>${EMPRESA.cidade}<br>WhatsApp/telefone: ${EMPRESA.tel}<br>E-mail: ${EMPRESA.email}</div>`;

/* mensagens do rodapé */
function centralWA(){wa(`Olá! Gostaria de falar com a central de atendimento da ${LOJA}.\n\n• Assunto: `)}
function trocasWA(){wa(`*TROCA / DEVOLUÇÃO – ${LOJA}*\n━━━━━━━━━━━━━━━\n\nOlá! Preciso de ajuda com uma troca ou devolução.\n\n• Nome: \n• Número do pedido / data da compra: \n• Produto: \n• Motivo: \n\nAguardo o retorno. Obrigado!`)}

const PG={
sobre:{t:"Sobre a ROMMO",s:"Ferramentas, irrigação e agropecuária com qualidade, atendimento e agilidade.",h:()=>`
<h2>Quem somos</h2>
<p>A ${EMPRESA.nome} é uma loja de ferramentas, irrigação e agropecuária em ${EMPRESA.cidade}. Atendemos profissionais, produtores rurais e quem precisa da ferramenta certa para o dia a dia, com produtos de marcas selecionadas e atendimento direto com a nossa equipe.</p>
<h2>O que você encontra aqui</h2>
<div class="sbt"><div><b>Ferramentas</b><span>Elétricas, manuais e kits completos.</span></div><div><b>Irrigação</b><span>Sistemas e acessórios para o campo e o jardim.</span></div><div><b>Agropecuária</b><span>Equipamentos para a produção rural e construção.</span></div></div>
<h2>Como trabalhamos</h2>
<p>Você escolhe os produtos no site, informa seus dados de entrega e envia o pedido para o nosso WhatsApp. A nossa equipe confirma disponibilidade, valores e forma de pagamento com você e finaliza o pedido.</p>
<h2>Fale com a gente</h2>${contatoTxt()}`},

"como-comprar":{t:"Como comprar",s:"Passo a passo simples: do carrinho até a confirmação no WhatsApp.",h:()=>`
<ol class="stp c" style="padding:0">
<li><div><b>Escolha seus produtos</b><span>Navegue pelas categorias, use a busca no topo ou veja as ofertas da semana. Clique no botão <strong>Comprar</strong> do produto que você quer.</span></div></li>
<li><div><b>Continue comprando ou vá ao carrinho</b><span>Depois de adicionar, aparece um aviso. Toque em <strong>Continuar comprando</strong> para escolher mais itens ou em <strong>Ir para o carrinho</strong> para revisar.</span></div></li>
<li><div><b>Ajuste a quantidade e deixe observações</b><span>No carrinho use os botões <strong>+</strong> e <strong>−</strong> para mudar a quantidade. Em cada produto há um campo de observação (voltagem, cor, detalhes) que vai junto com o pedido.</span></div></li>
<li><div><b>Informe seus dados, entrega e pagamento</b><span>Clique em <strong>Continuar para entrega e pagamento</strong>. Preencha nome, telefone e endereço (ao digitar o CEP, o endereço é preenchido sozinho) e escolha a forma de pagamento. Se preferir, escolha retirar na loja.</span></div></li>
<li><div><b>Envie o pedido pelo WhatsApp</b><span>Clique em <strong>Enviar pedido pelo WhatsApp</strong>. Abrirá uma conversa com a nossa equipe já com o pedido completo e organizado. É só enviar a mensagem.</span></div></li>
<li><div><b>Confirmação com a equipe</b><span>Nossa equipe confere a disponibilidade, confirma valores, frete e forma de pagamento e finaliza o seu pedido com você pelo próprio WhatsApp.</span></div></li>
</ol>
<div class="box">Ficou com dúvida em algum passo? Chame a nossa equipe: <a href="#" onclick="centralWA();return false">falar no WhatsApp</a>.</div>`},

privacidade:{t:"Política de privacidade",s:"Como a "+EMPRESA.nome+" trata os seus dados pessoais, de acordo com a LGPD (Lei nº 13.709/2018).",h:()=>`
<p class="meta">Última atualização: ${DATA_ATUAL}</p>
<h2>1. Quem é o responsável</h2><p>${EMPRESA.nome}${cnpjTxt()}, de ${EMPRESA.cidade}, é a responsável pelo tratamento dos dados coletados neste site. Contato: ${EMPRESA.email} ou WhatsApp ${EMPRESA.tel}.</p>
<h2>2. Quais dados coletamos</h2><ul><li>Dados de identificação e contato: nome, telefone e e-mail (opcional).</li><li>Dados de entrega: CEP, endereço, número, complemento, bairro, cidade e ponto de referência.</li><li>Dados do pedido: produtos, quantidades, observações, forma de pagamento escolhida e valor total.</li></ul>
<p>Não coletamos números de cartão, senhas nem dados bancários neste site. O pagamento é combinado diretamente com a nossa equipe.</p>
<h2>3. Para que usamos os dados</h2><ul><li>Processar, confirmar e entregar o seu pedido.</li><li>Entrar em contato sobre o pedido, valores, frete, prazos, trocas e devoluções.</li><li>Cumprir obrigações legais e fiscais.</li><li>Melhorar o nosso atendimento.</li></ul>
<h2>4. Como os dados chegam até nós</h2><p>Ao finalizar a compra, as informações preenchidas são enviadas por você mesmo ao nosso WhatsApp, em uma mensagem. O uso do WhatsApp segue os termos e a política de privacidade da própria plataforma.</p>
<h2>5. Armazenamento no seu aparelho</h2><p>Este site guarda no seu navegador (armazenamento local) o conteúdo do carrinho e, para facilitar próximas compras, os dados que você preenche no formulário de finalização. Essas informações ficam somente no seu aparelho, e você pode apagá-las limpando os dados do navegador. O site não usa cookies de publicidade.</p>
<h2>6. Consulta de CEP</h2><p>Ao digitar o CEP, o site consulta o serviço público ViaCEP para preencher o endereço automaticamente. Nessa consulta é enviado apenas o CEP informado.</p>
<h2>7. Compartilhamento</h2><p>Não vendemos os seus dados. Eles podem ser compartilhados apenas quando necessário para concluir o pedido (por exemplo, com transportadoras ou entregadores) ou para cumprir a lei.</p>
<h2>8. Por quanto tempo guardamos</h2><p>Mantemos os dados pelo tempo necessário para atender o pedido e cumprir obrigações legais, fiscais e de garantia.</p>
<h2>9. Seus direitos</h2><p>Você pode, a qualquer momento, solicitar confirmação do tratamento, acesso, correção, anonimização, portabilidade ou exclusão dos seus dados, e revogar consentimentos, entrando em contato pelos canais abaixo.</p>
<h2>10. Segurança</h2><p>Adotamos medidas razoáveis para proteger as informações. Nenhum sistema é totalmente imune a riscos, por isso recomendamos cuidado ao compartilhar dados em qualquer ambiente digital.</p>
<h2>11. Alterações</h2><p>Esta política pode ser atualizada. A data da última atualização está sempre no topo desta página.</p>
<h2>12. Contato</h2>${contatoTxt()}`},

termos:{t:"Termos de uso",s:"Regras para navegar e fazer pedidos no site da "+EMPRESA.nome+".",h:()=>`
<p class="meta">Última atualização: ${DATA_ATUAL}</p>
<h2>1. Aceitação</h2><p>Ao acessar e usar este site, você concorda com estes Termos de Uso e com a nossa <a href="#/privacidade">Política de privacidade</a>. Se não concordar, não utilize o site.</p>
<h2>2. Como funciona o pedido</h2><p>O site funciona como uma vitrine. Ao finalizar, o pedido é enviado para o nosso WhatsApp. O pedido só é considerado concluído depois da confirmação da nossa equipe, que verifica disponibilidade, valores, frete e forma de pagamento com você.</p>
<h2>3. Produtos, preços e estoque</h2><p>Buscamos manter preços e informações atualizados, mas podem ocorrer divergências, alterações de preço ou falta de estoque. Nesses casos, a equipe entra em contato para ajustar ou cancelar o item. As imagens são ilustrativas e podem variar do produto entregue.</p>
<h2>4. Entrega, frete e retirada</h2><p>O valor e o prazo da entrega são informados e confirmados pela equipe no atendimento, conforme o endereço. Também é possível retirar o pedido na loja, quando disponível.</p>
<h2>5. Pagamento</h2><p>A forma de pagamento escolhida no formulário é uma preferência e será confirmada com a equipe. Condições (como parcelamento ou descontos) valem somente se confirmadas no atendimento.</p>
<h2>6. Trocas, devoluções e arrependimento</h2><p>Seguimos o Código de Defesa do Consumidor. Em compras feitas à distância, você pode desistir da compra em até 7 dias após o recebimento. Para trocas, devoluções ou problemas com o produto (garantia legal), fale com a nossa equipe pelo WhatsApp, informando o pedido e o motivo. Os produtos devem estar nas condições previstas em lei.</p>
<h2>7. Responsabilidades do usuário</h2><p>Você se compromete a informar dados verdadeiros e completos e a usar o site de forma lícita, sem tentar prejudicar seu funcionamento.</p>
<h2>8. Propriedade intelectual</h2><p>Marcas, logotipos, textos e imagens do site pertencem à ${EMPRESA.nome} ou a seus parceiros e não podem ser copiados sem autorização.</p>
<h2>9. Alterações</h2><p>Estes termos podem ser atualizados a qualquer momento. A versão vigente é sempre a publicada nesta página.</p>
<h2>10. Foro</h2><p>Fica eleito o foro do domicílio do consumidor para resolver questões relacionadas a estes termos, conforme a legislação consumerista.</p>
<h2>11. Contato</h2>${contatoTxt()}`}
};

const pgv=document.getElementById("pgv"),pgc=document.getElementById("pgc");
function trava(){const ck=document.getElementById("ck");document.body.classList.toggle("pgl",pgv.classList.contains("on")||ck.classList.contains("on"))}
function renderPg(){
 const m=location.hash.match(/^#\/([\w-]+)/),id=m&&PG[m[1]]?m[1]:null;
 if(id){const p=PG[id];
  pgc.innerHTML=`<div class="pgh"><div class="w"><h1>${p.t}</h1><p>${p.s||""}</p></div></div><article class="w pga">${p.h()}</article>
  <div class="w pgf"><button class="btn" onclick="fechaPg()">Voltar à loja</button><button class="btn wa" onclick="centralWA()">Falar no WhatsApp</button></div>`;
  pgv.scrollTop=0;pgv.classList.add("on");pgv.setAttribute("aria-hidden","false");document.title=p.t+" | "+EMPRESA.nome;
 }else{pgv.classList.remove("on");pgv.setAttribute("aria-hidden","true");document.title=TITULO}
 trava();
}
function abrePg(id){try{history.pushState({pg:id},"","#/"+id)}catch(e){location.hash="/"+id}renderPg()}
function fechaPg(){if(history.state&&history.state.pg){history.back();return}try{history.replaceState(null,"",location.pathname+location.search)}catch(e){location.hash=""}renderPg()}
document.addEventListener("click",e=>{const a=e.target.closest('a[href^="#/"]');if(a){e.preventDefault();abrePg(a.getAttribute("href").slice(2))}});
addEventListener("popstate",renderPg);addEventListener("hashchange",renderPg);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pgv.classList.contains("on"))fechaPg()});
renderPg();
