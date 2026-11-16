/* EuroHub · Euroflex Divisórias — demonstração com dados ilustrativos */
'use strict';

/* ============================================================
   DADOS (salvos no navegador — localStorage)
============================================================ */
const COLS = [
  { id:'aprovado',   nome:'Aprovado'   },
  { id:'projeto',    nome:'Em projeto' },
  { id:'producao',   nome:'Produção'   },
  { id:'instalacao', nome:'Instalação' },
  { id:'concluido',  nome:'Concluído'  },
];
const COL_BADGE = { aprovado:'cyan', projeto:'gray', producao:'navy', instalacao:'amber', concluido:'green' };

const SEED = {
  pedidos: [
    { id:1048, cliente:'Cliente A', desc:'42 m² · Europrata 90 mm', linha:'Europrata 90 mm',   col:'aprovado',   nota:'Sinal recebido',         notaCor:'green' },
    { id:1047, cliente:'Cliente B', desc:'6 cabines acústicas',     linha:'Cabines acústicas', col:'aprovado',   nota:'Aguarda sinal',          notaCor:'gray'  },
    { id:1045, cliente:'Cliente C', desc:'Divisórias sanitárias',   linha:'Sanitárias',        col:'projeto',    nota:'Medição em 18/11',       notaCor:'gray'  },
    { id:1044, cliente:'Cliente D', desc:'Divisória articulável',   linha:'Articuláveis',      col:'projeto',    nota:'Projeto R01 em revisão', notaCor:'gray'  },
    { id:1041, cliente:'Cliente E', desc:'38 m² · Europrata 90 mm', linha:'Europrata 90 mm',   col:'producao',   nota:'Pronto em 22/11',        notaCor:'gray'  },
    { id:1040, cliente:'Cliente F', desc:'Vidro curvo',             linha:'Vidro curvo',       col:'producao',   nota:'Pronto em 25/11',        notaCor:'gray'  },
    { id:1037, cliente:'Cliente G', desc:'Portas industriais',      linha:'Portas industriais',col:'instalacao', nota:'Atrasado 2 dias',        notaCor:'amber', alerta:true },
    { id:1036, cliente:'Cliente H', desc:'Equipe 2',                linha:'Europrata 90 mm',   col:'instalacao', nota:'Hoje, 08:00',            notaCor:'blue'  },
    { id:1033, cliente:'Cliente I', desc:'55 m² · Europrata 90 mm', linha:'Europrata 90 mm',   col:'concluido',  nota:'Termo assinado',         notaCor:'green' },
  ],
  arquivos: [
    { doc:'Planta de layout',                 tipo:'DWG',      rev:'R02',   sit:'Aprovada',        cor:'green' },
    { doc:'Projeto executivo de divisórias',  tipo:'PDF',      rev:'R01',   sit:'Em verificação',  cor:'cyan'  },
    { doc:'Medição técnica',                  tipo:'18 fotos', rev:'12/11', sit:'Arquivada',       cor:'gray'  },
    { doc:'Memorial descritivo',              tipo:'PDF',      rev:'R01',   sit:'Arquivado',       cor:'gray'  },
    { doc:'Proposta comercial',               tipo:'PDF',      rev:'v3',    sit:'Aceita',          cor:'green' },
  ],
  checklist: [
    { t:'Vãos de porta e sentido de abertura',               ok:true  },
    { t:'Pé-direito e altura dos painéis',                   ok:true  },
    { t:'Parede B: 4,20 m no projeto × 4,12 m medido',       ok:false, diverg:true },
    { t:'Quantitativo igual ao orçamento',                   ok:true  },
    { t:'Compatível com a linha escolhida',                  ok:true  },
  ],
};

let DB;
function loadDB(){
  try { DB = JSON.parse(localStorage.getItem('eurohub-v1')) || null; } catch(e){ DB = null; }
  if (!DB || !Array.isArray(DB.pedidos)) DB = JSON.parse(JSON.stringify(SEED));
}
function saveDB(){ try { localStorage.setItem('eurohub-v1', JSON.stringify(DB)); } catch(e){} }
loadDB();

/* ============================================================
   UTILITÁRIOS
============================================================ */
const $  = (s, el) => (el||document).querySelector(s);
const $$ = (s, el) => Array.from((el||document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

function openModal(html){
  $('#modal').innerHTML = html;
  $('#modal-back').hidden = false;
}
function closeModal(){ $('#modal-back').hidden = true; }
$('#modal-back').addEventListener('click', e => { if (e.target.id === 'modal-back') closeModal(); });

/* ============================================================
   SESSÃO / LOGIN
============================================================ */
function logado(){ return sessionStorage.getItem('eurohub-login') || localStorage.getItem('eurohub-login'); }

$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#login-email').value.trim() || 'gestor@euroflex.com.br';
  (( $('#login-keep').checked ) ? localStorage : sessionStorage).setItem('eurohub-login', email);
  location.hash = '#/painel';
  render();
  toast('Bem-vindo ao EuroHub!');
});
$('#login-forgot').addEventListener('click', e => { e.preventDefault(); toast('Peça ao gestor para redefinir sua senha.'); });
$('#login-portal').addEventListener('click', e => { e.preventDefault(); toast('Portal do cliente: disponível na versão completa.'); });

$('#avatar-btn').addEventListener('click', () => {
  const m = $('#avatar-menu');
  $('#avatar-email').textContent = logado() || 'gestor@euroflex.com.br';
  m.hidden = !m.hidden;
});
document.addEventListener('click', e => {
  if (!e.target.closest('.avatar-wrap')) $('#avatar-menu').hidden = true;
});
$('#btn-sair').addEventListener('click', () => {
  sessionStorage.removeItem('eurohub-login');
  localStorage.removeItem('eurohub-login');
  location.hash = '#/login';
  render();
});

/* ============================================================
   ROTEADOR
============================================================ */
const ROTAS = {
  painel:      { titulo:'Painel do gestor',       sub:'Novembro · dados ilustrativos' },
  orcamentos:  { titulo:'Novo orçamento',         sub:'Orçamentos · rascunho · valores ilustrativos' },
  pedidos:     { titulo:'Pedidos',                sub:'' },
  projetos:    { titulo:'Projetos',               sub:'[Cliente] · Sede administrativa · Pedido #1044' },
  verificacao: { titulo:'Verificação de projeto', sub:'Projeto executivo R01 · [Cliente] · Sede administrativa' },
  producao:    { titulo:'Produção',               sub:'Ordens em andamento · dados ilustrativos' },
  instalacao:  { titulo:'Instalação',             sub:'Agenda das equipes · dados ilustrativos' },
  clientes:    { titulo:'Clientes e obras',       sub:'Carteira ativa · dados ilustrativos' },
};

function rotaAtual(){
  const h = (location.hash || '').replace(/^#\//, '');
  return ROTAS[h] ? h : (logado() ? 'painel' : 'login');
}

function render(){
  const rota = logado() ? rotaAtual() : 'login';
  const noLogin = rota === 'login';
  $('#view-login').hidden = !noLogin;
  $('#app').hidden = noLogin;
  if (noLogin) return;

  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === rota));
  $('#page-title').textContent = ROTAS[rota].titulo;
  $('#page-sub').textContent = ROTAS[rota].sub;
  $('#topbar-actions').innerHTML = '';
  VIEWS[rota]();
  $('.main').scrollTop = 0; window.scrollTo(0,0);
}
window.addEventListener('hashchange', render);

/* ============================================================
   TELA · PAINEL
============================================================ */
function viewPainel(){
  $('#topbar-actions').innerHTML = `<button class="btn btn-primary" onclick="location.hash='#/orcamentos'">Novo orçamento</button>`;

  const meses = [ ['jun',46],['jul',60],['ago',53],['set',78],['out',70],['nov',92] ];
  const recentes = [1048,1045,1041,1037,1033]
    .map(id => DB.pedidos.find(p => p.id === id)).filter(Boolean);

  const badge = p => p.alerta
    ? `<span class="badge amber">${esc(p.nota)}</span>`
    : `<span class="badge ${COL_BADGE[p.col]}">${esc(COLS.find(c=>c.id===p.col).nome)}</span>`;

  $('#content').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="kpi-label">Faturamento do mês</div><div class="kpi-value">R$ 412 mil</div></div>
      <div class="card kpi"><div class="kpi-label">m² vendidos</div><div class="kpi-value">1.860 m²</div></div>
      <div class="card kpi"><div class="kpi-label">Orçamentos enviados</div><div class="kpi-value">74</div></div>
      <div class="card kpi kpi-dark"><div class="kpi-label">Conversão</div><div class="kpi-value">31%</div></div>
    </div>
    <div class="grid-2">
      <div class="card card-pad">
        <div class="card-head"><h3>Pedidos por mês</h3></div>
        <div class="chart">
          ${meses.map(([m,v],i) => `
            <div class="bar-col">
              <div class="bar ${i===meses.length-1?'now':''}" style="height:${v}%"></div>
              <div class="bar-label ${i===meses.length-1?'now':''}">${m}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Pedidos recentes</h3><a href="#/pedidos">Ver todos</a></div>
        <table>
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Linha</th><th>Status</th></tr></thead>
          <tbody>
            ${recentes.map(p => `
              <tr>
                <td>#${p.id}</td><td>${esc(p.cliente)}</td>
                <td class="td-muted">${esc(p.linha)}</td><td>${badge(p)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ============================================================
   TELA · ORÇAMENTOS (calculadora ao vivo)
============================================================ */
const LINHAS = {
  'Europrata 90 mm':    634,
  'Europrata 60 mm':    548,
  'Divisórias sanitárias': 490,
  'Cabines acústicas':  890,
  'Divisória articulável': 760,
};
const COMPOS = {
  'Misto: vidro + painel cego': 1.00,
  'Somente vidro temperado':    1.25,
  'Somente painel cego':        0.85,
};
const PRECO_PORTA = 1800;

function calcOrcamento(){
  const m   = parseFloat(String($('#o-metragem').value).replace(',','.')) || 0;
  const pd  = parseFloat(String($('#o-pedireito').value).replace(',','.')) || 0;
  const pts = parseInt($('#o-portas').value, 10) || 0;
  const dsc = Math.min(Math.max(parseFloat(String($('#o-desc').value).replace(',','.')) || 0, 0), 40);
  const linha = $('#o-linha').value, comp = $('#o-comp').value;

  const area    = m * pd;
  const perfis  = Math.ceil(area * 0.9);
  const modulos = Math.max(Math.round(m * 1.306), pts);
  let paineis = 0, vidros = 0;
  if (comp === 'Somente vidro temperado') { vidros = modulos; }
  else if (comp === 'Somente painel cego') { paineis = modulos; }
  else { paineis = Math.ceil(modulos * 0.5625); vidros = Math.max(modulos - paineis, 0); }

  const bruto = area * LINHAS[linha] * COMPOS[comp] + pts * PRECO_PORTA;
  const total = bruto * (1 - dsc/100);

  $('#m-perfis').textContent  = perfis  + ' barras';
  $('#m-paineis').textContent = paineis + ' un';
  $('#m-vidros').textContent  = vidros  + ' un';
  $('#m-portas').textContent  = pts     + ' un';
  $('#o-total').textContent   = brl(total);
  $('#o-aviso').style.color = dsc > 10 ? '#9a6b16' : '';
  $('#o-aviso').textContent = dsc > 10
    ? 'Desconto acima do limite da tabela — enviado para aprovação do gestor.'
    : 'Desconto acima do limite da tabela pede aprovação do gestor.';
  return { m, pd, pts, dsc, linha, comp, area, perfis, paineis, vidros, total };
}

function viewOrcamentos(){
  $('#topbar-actions').innerHTML = `<button class="btn btn-outline" id="btn-rascunho">Salvar rascunho</button>`;

  $('#content').innerHTML = `
    <div class="orc-grid">
      <div class="card card-pad">
        <h3>Dados da divisória</h3>
        <label>Cliente / obra</label>
        <input id="o-cliente" value="[Cliente] · Sede administrativa">
        <div class="form-2col">
          <div><label>Linha</label>
            <select id="o-linha">${Object.keys(LINHAS).map(l=>`<option>${l}</option>`).join('')}</select></div>
          <div><label>Composição</label>
            <select id="o-comp">${Object.keys(COMPOS).map(c=>`<option>${c}</option>`).join('')}</select></div>
          <div><label>Metragem linear (m)</label><input id="o-metragem" value="24,5" inputmode="decimal"></div>
          <div><label>Pé-direito (m)</label><input id="o-pedireito" value="2,80" inputmode="decimal"></div>
          <div><label>Portas (un)</label><input id="o-portas" value="3" inputmode="numeric"></div>
          <div><label>Desconto (%)</label><input id="o-desc" value="0" inputmode="decimal"></div>
        </div>
        <label>Observações</label>
        <textarea id="o-obs" rows="3" placeholder="Acabamento, cor dos perfis, prazo combinado"></textarea>
        <p class="form-note" id="o-aviso">Desconto acima do limite da tabela pede aprovação do gestor.</p>
      </div>
      <div>
        <div class="card card-pad">
          <h3 style="margin-bottom:6px">Materiais calculados</h3>
          <div class="mat-row"><span>Perfis de alumínio</span><b id="m-perfis">—</b></div>
          <div class="mat-row"><span>Painéis cegos</span><b id="m-paineis">—</b></div>
          <div class="mat-row"><span>Vidros temperados</span><b id="m-vidros">—</b></div>
          <div class="mat-row"><span>Portas com ferragens</span><b id="m-portas">—</b></div>
        </div>
        <div class="total-panel">
          <div class="tp-label">Total do orçamento</div>
          <div class="tp-value" id="o-total">—</div>
          <div class="tp-btns">
            <button class="btn btn-cyan" id="btn-pdf">Gerar PDF</button>
            <button class="btn btn-ghost-light" id="btn-whats">Enviar no WhatsApp</button>
          </div>
          <a href="#" class="tp-link" id="btn-converter">Converter em pedido</a>
        </div>
      </div>
    </div>`;

  ['o-linha','o-comp','o-metragem','o-pedireito','o-portas','o-desc'].forEach(id =>
    $('#'+id).addEventListener('input', calcOrcamento));
  calcOrcamento();

  $('#btn-rascunho').addEventListener('click', () => toast('Rascunho salvo.'));

  $('#btn-pdf').addEventListener('click', () => {
    const o = calcOrcamento();
    const hoje = new Date().toLocaleDateString('pt-BR');
    $('#print-area').innerHTML = `
      <div class="pr-head">
        <div><div class="pr-logo">EURO<span>HUB</span></div><div>Euroflex Divisórias</div></div>
        <div style="text-align:right">Proposta comercial<br>${hoje}</div>
      </div>
      <div class="pr-title">Orçamento · ${esc($('#o-cliente').value)}</div>
      <div>${esc(o.linha)} · ${esc(o.comp)}</div>
      <table class="pr-table">
        <tr><th>Item</th><th>Quantidade</th></tr>
        <tr><td>Metragem linear × pé-direito</td><td>${String(o.m).replace('.',',')} m × ${String(o.pd).replace('.',',')} m (${o.area.toFixed(1).replace('.',',')} m²)</td></tr>
        <tr><td>Perfis de alumínio</td><td>${o.perfis} barras</td></tr>
        <tr><td>Painéis cegos</td><td>${o.paineis} un</td></tr>
        <tr><td>Vidros temperados</td><td>${o.vidros} un</td></tr>
        <tr><td>Portas com ferragens</td><td>${o.pts} un</td></tr>
        ${o.dsc ? `<tr><td>Desconto</td><td>${o.dsc}%</td></tr>` : ''}
      </table>
      <div class="pr-total">Total: ${brl(o.total)}</div>
      <div class="pr-foot">Proposta ilustrativa gerada pelo EuroHub · validade de 15 dias · valores sujeitos a medição técnica.</div>`;
    window.print();
  });

  $('#btn-whats').addEventListener('click', () => {
    const o = calcOrcamento();
    const msg = `*Euroflex Divisórias — Orçamento*\n${$('#o-cliente').value}\n`
      + `${o.linha} · ${o.comp}\n${String(o.m).replace('.',',')} m lineares · pé-direito ${String(o.pd).replace('.',',')} m · ${o.pts} porta(s)\n`
      + `*Total: ${brl(o.total)}*\n_Valores ilustrativos._`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  });

  $('#btn-converter').addEventListener('click', e => {
    e.preventDefault();
    const o = calcOrcamento();
    const id = Math.max(...DB.pedidos.map(p => p.id)) + 1;
    DB.pedidos.unshift({
      id, cliente: $('#o-cliente').value.split('·')[0].trim() || 'Novo cliente',
      desc: `${o.area.toFixed(0)} m² · ${o.linha}`, linha: o.linha,
      col:'aprovado', nota:'Aguarda sinal', notaCor:'gray',
    });
    saveDB();
    location.hash = '#/pedidos';
    toast(`Pedido #${id} criado a partir do orçamento.`);
  });
}

/* ============================================================
   TELA · PEDIDOS (kanban com arrastar e soltar)
============================================================ */
let filtroPedidos = '';

function viewPedidos(){
  ROTAS.pedidos.sub = DB.pedidos.filter(p => p.col !== 'concluido').length + ' pedidos em andamento · dados ilustrativos';
  $('#page-sub').textContent = ROTAS.pedidos.sub;

  $('#topbar-actions').innerHTML = `
    <div class="topbar-search"><span>Buscar</span>
      <input id="busca-pedidos" placeholder="Nº do pedido, cliente ou obra" value="${esc(filtroPedidos)}"></div>
    <button class="btn btn-primary" id="btn-novo-pedido">Novo pedido</button>`;

  desenhaKanban();

  $('#busca-pedidos').addEventListener('input', e => { filtroPedidos = e.target.value; desenhaKanban(); });
  $('#btn-novo-pedido').addEventListener('click', modalNovoPedido);
}

function desenhaKanban(){
  const f = filtroPedidos.trim().toLowerCase();
  const visivel = p => !f || String(p.id).includes(f)
    || p.cliente.toLowerCase().includes(f) || p.desc.toLowerCase().includes(f);

  $('#content').innerHTML = `
    <div class="kanban">
      ${COLS.map(c => {
        const itens = DB.pedidos.filter(p => p.col === c.id && visivel(p));
        return `
        <div class="kcol" data-col="${c.id}">
          <div class="kcol-head"><h4>${c.nome}</h4><span class="kcol-count">${itens.length}</span></div>
          ${itens.map(p => `
            <div class="kcard ${p.alerta?'alert':''}" draggable="true" data-id="${p.id}">
              <h5>#${p.id} · ${esc(p.cliente)}</h5>
              <p>${esc(p.desc)}</p>
              <div class="knote ${p.notaCor}">${esc(p.nota)}</div>
            </div>`).join('')}
        </div>`;
      }).join('')}
    </div>`;

  // Arrastar e soltar
  $$('.kcard').forEach(card => {
    card.addEventListener('dragstart', e => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('click', () => modalPedido(parseInt(card.dataset.id,10)));
  });
  $$('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('dragover'); });
    col.addEventListener('dragleave', () => col.classList.remove('dragover'));
    col.addEventListener('drop', e => {
      e.preventDefault(); col.classList.remove('dragover');
      const id = parseInt(e.dataTransfer.getData('text/plain'),10);
      movePedido(id, col.dataset.col);
    });
  });
}

function movePedido(id, colId){
  const p = DB.pedidos.find(x => x.id === id);
  if (!p || p.col === colId) return;
  p.col = colId;
  if (colId === 'concluido'){ p.nota = 'Termo assinado'; p.notaCor = 'green'; p.alerta = false; }
  saveDB(); desenhaKanban();
  toast(`Pedido #${id} movido para ${COLS.find(c=>c.id===colId).nome}.`);
}

function modalPedido(id){
  const p = DB.pedidos.find(x => x.id === id); if (!p) return;
  const idx = COLS.findIndex(c => c.id === p.col);
  openModal(`
    <h3>#${p.id} · ${esc(p.cliente)}</h3>
    <p class="modal-sub">${esc(p.desc)}</p>
    <p style="margin-top:10px"><span class="badge ${COL_BADGE[p.col]}">${COLS[idx].nome}</span>
       &nbsp;<span class="knote ${p.notaCor}" style="font-size:13.5px">${esc(p.nota)}</span></p>
    <div class="modal-btns">
      ${idx>0 ? `<button class="btn btn-outline" onclick="movePedido(${p.id},'${COLS[idx-1].id}');closeModal()">← ${COLS[idx-1].nome}</button>` : ''}
      ${idx<COLS.length-1 ? `<button class="btn btn-primary" onclick="movePedido(${p.id},'${COLS[idx+1].id}');closeModal()">${COLS[idx+1].nome} →</button>` : ''}
    </div>`);
}

function modalNovoPedido(){
  openModal(`
    <h3>Novo pedido</h3>
    <p class="modal-sub">O pedido entra na coluna Aprovado.</p>
    <label>Cliente / obra</label><input id="np-cliente" placeholder="Nome do cliente">
    <label>Descrição</label><input id="np-desc" placeholder="Ex.: 30 m² · Europrata 90 mm">
    <div class="modal-btns">
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="np-criar">Criar pedido</button>
    </div>`);
  $('#np-criar').addEventListener('click', () => {
    const cliente = $('#np-cliente').value.trim(), desc = $('#np-desc').value.trim();
    if (!cliente){ toast('Informe o cliente.'); return; }
    const id = Math.max(...DB.pedidos.map(p => p.id)) + 1;
    DB.pedidos.unshift({ id, cliente, desc: desc || 'A detalhar', linha:'—', col:'aprovado', nota:'Aguarda sinal', notaCor:'gray' });
    saveDB(); closeModal(); desenhaKanban();
    toast(`Pedido #${id} criado.`);
  });
}

/* ============================================================
   TELA · PROJETOS
============================================================ */
function viewProjetos(){
  $('#topbar-actions').innerHTML = `
    <div class="topbar-search"><span>Buscar</span><input placeholder="Cliente, obra ou linha"></div>
    <button class="btn btn-primary" id="btn-arquivo">Enviar arquivo</button>`;

  $('#content').innerHTML = `
    <div class="grid-2" style="grid-template-columns:7fr 5fr">
      <div class="card card-pad">
        <h3 style="margin-bottom:8px">Arquivos da obra</h3>
        <table>
          <thead><tr><th>Documento</th><th>Tipo</th><th>Revisão</th><th>Situação</th></tr></thead>
          <tbody id="tb-arquivos">
            ${DB.arquivos.map(a => `
              <tr><td>${esc(a.doc)}</td><td class="td-muted">${esc(a.tipo)}</td>
                  <td>${esc(a.rev)}</td><td><span class="badge ${a.cor}">${esc(a.sit)}</span></td></tr>`).join('')}
          </tbody>
        </table>
        <button class="btn btn-outline" style="margin-top:18px" onclick="location.hash='#/orcamentos'">Usar como base de novo orçamento</button>
      </div>
      <div class="card card-pad">
        <h3 style="margin-bottom:16px">Histórico de revisões</h3>
        <ul class="timeline">
          <li class="now"><b>Projeto executivo R01 enviado para verificação</b><small>Projetista · 14/11, 16:40</small></li>
          <li><b>Planta de layout R02 aprovada pelo cliente</b><small>Aceite digital · 13/11, 10:12</small></li>
          <li><b>Medição técnica anexada com 18 fotos</b><small>Equipe de medição · 12/11, 15:05</small></li>
          <li><b>Proposta comercial v3 aceita</b><small>Vendedor A · 08/11, 09:30</small></li>
        </ul>
      </div>
    </div>`;

  $('#btn-arquivo').addEventListener('click', () => {
    openModal(`
      <h3>Enviar arquivo</h3>
      <p class="modal-sub">O arquivo entra como "Em verificação".</p>
      <label>Nome do documento</label><input id="ar-doc" placeholder="Ex.: Detalhamento de portas">
      <label>Tipo</label>
      <select id="ar-tipo"><option>PDF</option><option>DWG</option><option>Fotos</option><option>XLSX</option></select>
      <div class="modal-btns">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="ar-ok">Enviar</button>
      </div>`);
    $('#ar-ok').addEventListener('click', () => {
      const doc = $('#ar-doc').value.trim();
      if (!doc){ toast('Informe o nome do documento.'); return; }
      DB.arquivos.splice(1, 0, { doc, tipo: $('#ar-tipo').value, rev:'R01', sit:'Em verificação', cor:'cyan' });
      saveDB(); closeModal(); viewProjetos();
      toast('Arquivo enviado para verificação.');
    });
  });
}

/* ============================================================
   TELA · VERIFICAÇÃO
============================================================ */
function viewVerificacao(){
  const total = DB.checklist.length;
  const ok = DB.checklist.filter(i => i.ok).length;
  const tudoOk = ok === total;

  $('#topbar-actions').innerHTML = `
    <button class="btn btn-outline" id="btn-devolver">Devolver ao projetista</button>
    <button class="btn btn-primary" id="btn-liberar" ${tudoOk?'':'disabled'}>Liberar para produção</button>`;

  $('#content').innerHTML = `
    <div class="card stepper">
      <div class="step done"><div class="step-n">1</div><div><b>Projetista</b><small>Enviou em 14/11</small></div></div>
      <div class="step now"><div class="step-n">2</div><div><b>Revisor técnico</b><small>${tudoOk?'Conferido':'Em andamento'}</small></div></div>
      <div class="step"><div class="step-n">3</div><div><b>Cliente</b><small>Aceite digital</small></div></div>
      <div class="step"><div class="step-n">4</div><div><b>Produção</b><small>Recebe o projeto liberado</small></div></div>
    </div>
    <div class="grid-2" style="grid-template-columns:7fr 5fr;align-items:start">
      <div class="card card-pad">
        <div class="card-head"><h3>Checklist técnico</h3><small>${ok} de ${total} conferidos</small></div>
        ${DB.checklist.map((i,idx) => `
          <label class="chk-row ${i.diverg && !i.ok ? 'diverg':''}" style="cursor:pointer">
            <input type="checkbox" data-idx="${idx}" ${i.ok?'checked':''}>
            <span>${esc(i.t)}</span>
            ${i.diverg && !i.ok ? '<span class="badge amber">Divergência</span>' : '<span class="badge green">OK</span>'}
          </label>`).join('')}
      </div>
      <div class="card card-pad">
        <h3>Divergência encontrada</h3>
        <div class="diverg-vals">
          <div class="diverg-box"><small>No projeto</small><div class="dv">4,20 m</div></div>
          <div class="diverg-box"><small>Medido na obra</small><div class="dv">4,12 m</div></div>
        </div>
        <label>Observação para o projetista</label>
        <textarea rows="4" placeholder="Descreva o ajuste necessário"></textarea>
        <a href="#/projetos" style="display:inline-block;margin-top:12px;font-size:14px;font-weight:500">Ver medição técnica e fotos</a>
      </div>
    </div>`;

  $$('.chk-row input').forEach(ch => ch.addEventListener('change', () => {
    DB.checklist[parseInt(ch.dataset.idx,10)].ok = ch.checked;
    saveDB(); viewVerificacao();
  }));
  $('#btn-devolver').addEventListener('click', () =>
    toast('Projeto devolvido ao projetista com a observação registrada.'));
  $('#btn-liberar').addEventListener('click', () => {
    movePedido(1044, 'producao');
    location.hash = '#/pedidos';
    toast('Projeto R01 liberado — pedido #1044 foi para Produção.');
  });
}

/* ============================================================
   TELAS · PRODUÇÃO / INSTALAÇÃO / CLIENTES
============================================================ */
function viewProducao(){
  const ordens = [
    { pedido:'#1041 · Cliente E', item:'38 m² · Europrata 90 mm', etapa:'Corte de perfis',      prog:70, prazo:'Pronto em 22/11' },
    { pedido:'#1040 · Cliente F', item:'Vidro curvo',             etapa:'Têmpera (terceiro)',   prog:45, prazo:'Pronto em 25/11' },
    { pedido:'#1047 · Cliente B', item:'6 cabines acústicas',     etapa:'Aguardando material',  prog:10, prazo:'Início em 24/11' },
    { pedido:'#1048 · Cliente A', item:'42 m² · Europrata 90 mm', etapa:'Fila de produção',     prog:0,  prazo:'Início em 26/11' },
  ];
  $('#content').innerHTML = `
    <div class="card card-pad">
      <h3 style="margin-bottom:8px">Ordens de produção</h3>
      <table>
        <thead><tr><th>Pedido</th><th>Item</th><th>Etapa atual</th><th>Avanço</th><th>Prazo</th></tr></thead>
        <tbody>
          ${ordens.map(o => `
            <tr><td>${o.pedido}</td><td class="td-muted">${o.item}</td><td>${o.etapa}</td>
                <td><div class="progress"><i style="width:${o.prog}%"></i></div></td>
                <td class="td-muted">${o.prazo}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function viewInstalacao(){
  const agenda = [
    { dia:'Hoje · 08:00',    pedido:'#1036 · Cliente H', equipe:'Equipe 2', obs:'Montagem iniciada',            cor:'blue'  },
    { dia:'Hoje · 13:30',    pedido:'#1037 · Cliente G', equipe:'Equipe 1', obs:'Atrasado 2 dias — priorizar',  cor:'amber' },
    { dia:'Amanhã · 08:00',  pedido:'#1036 · Cliente H', equipe:'Equipe 2', obs:'Acabamento e limpeza',         cor:'gray'  },
    { dia:'19/11 · 09:00',   pedido:'#1041 · Cliente E', equipe:'Equipe 1', obs:'Aguardando produção',          cor:'gray'  },
  ];
  $('#content').innerHTML = `
    <div class="list-cards">
      ${agenda.map(a => `
        <div class="card card-pad">
          <div class="card-head" style="margin-bottom:6px"><h3>${a.pedido}</h3><span class="badge ${a.cor==='amber'?'amber':a.cor==='blue'?'cyan':'gray'}">${a.equipe}</span></div>
          <p style="font-weight:500">${a.dia}</p>
          <p class="td-muted" style="margin-top:4px;color:var(--muted)">${a.obs}</p>
        </div>`).join('')}
    </div>`;
}

function viewClientes(){
  const clientes = [
    { nome:'Cliente A', obra:'Sede administrativa',  cidade:'Curitiba · PR',   pedidos:3, status:'Obra ativa',  cor:'cyan'  },
    { nome:'Cliente C', obra:'Clínica — 2º andar',   cidade:'São José · SC',   pedidos:1, status:'Em projeto',  cor:'gray'  },
    { nome:'Cliente E', obra:'Galpão industrial',    cidade:'Joinville · SC',  pedidos:2, status:'Produção',    cor:'navy'  },
    { nome:'Cliente G', obra:'Centro logístico',     cidade:'Itajaí · SC',     pedidos:1, status:'Instalação',  cor:'amber' },
    { nome:'Cliente I', obra:'Escritório comercial', cidade:'Blumenau · SC',   pedidos:4, status:'Concluído',   cor:'green' },
  ];
  $('#content').innerHTML = `
    <div class="card card-pad">
      <h3 style="margin-bottom:8px">Carteira de clientes</h3>
      <table>
        <thead><tr><th>Cliente</th><th>Obra</th><th>Cidade</th><th>Pedidos</th><th>Status</th></tr></thead>
        <tbody>
          ${clientes.map(c => `
            <tr><td>${c.nome}</td><td class="td-muted">${c.obra}</td><td class="td-muted">${c.cidade}</td>
                <td>${c.pedidos}</td><td><span class="badge ${c.cor}">${c.status}</span></td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ============================================================
   INICIALIZAÇÃO
============================================================ */
const VIEWS = {
  painel: viewPainel, orcamentos: viewOrcamentos, pedidos: viewPedidos,
  projetos: viewProjetos, verificacao: viewVerificacao,
  producao: viewProducao, instalacao: viewInstalacao, clientes: viewClientes,
};
window.movePedido = movePedido;
window.closeModal = closeModal;
render();
