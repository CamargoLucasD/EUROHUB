/* EuroHub · Euroflex Divisórias — demonstração com dados ilustrativos.
   Tudo roda no navegador; os dados ficam no localStorage de quem abre a página. */
'use strict';

/* ============================================================
   ÍCONES
============================================================ */
const PATHS = {
  painel:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  orcamentos:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
  pedidos:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
  projetos:'<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  verificacao:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  producao:'<path d="M2 20h20M4 20V10l5 3v-3l5 3V6h6v14"/><path d="M17 10h.01M17 14h.01"/>',
  instalacao:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  clientes:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  printer:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  arrowUp:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
  undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${PATHS[n] || ''}</svg>`;

/* ============================================================
   UTILITÁRIOS
============================================================ */
const $  = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, d) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits:d || 0, maximumFractionDigits:d || 0 });
const brl = n => 'R$ ' + fmt(Math.round(n));
const brlK = n => n >= 1000 ? 'R$ ' + fmt(Math.round(n / 1000)) + ' mil' : brl(n);
const num = v => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : 0; };
const pad = n => String(n).padStart(2, '0');
function agora(){ const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function hoje(){ const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`; }
const clone = o => JSON.parse(JSON.stringify(o));

/* ============================================================
   CÁLCULO DO ORÇAMENTO (valores ilustrativos)
============================================================ */
const LINHAS = {
  'Europrata 90 mm': 634,
  'Europrata 60 mm': 548,
  'Divisórias sanitárias': 490,
  'Cabines acústicas': 890,
  'Divisória articulável': 760,
};
const COMPOS = {
  'Misto: vidro + painel cego': 1.00,
  'Somente vidro temperado': 1.25,
  'Somente painel cego': 0.85,
};
const PRECO_PORTA = 1800;
const LIMITE_DESCONTO = 10;

function calcula(o){
  const m = num(o.metragem), pd = num(o.pedireito);
  const pts = Math.max(0, Math.round(num(o.portas)));
  const dsc = Math.min(Math.max(num(o.desconto), 0), 40);
  const area = m * pd;
  const perfis = Math.ceil(area * 0.9);
  const modulos = Math.max(Math.round(m * 1.306), pts);
  let paineis = 0, vidros = 0;
  if (o.comp === 'Somente vidro temperado') vidros = modulos;
  else if (o.comp === 'Somente painel cego') paineis = modulos;
  else { paineis = Math.ceil(modulos * 0.5625); vidros = Math.max(modulos - paineis, 0); }
  const bruto = area * (LINHAS[o.linha] || 600) * (COMPOS[o.comp] || 1) + pts * PRECO_PORTA;
  return { m, pd, pts, dsc, area, perfis, paineis, vidros, bruto, total: bruto * (1 - dsc / 100) };
}

/* ============================================================
   DADOS DE DEMONSTRAÇÃO
============================================================ */
const COLS = [
  { id:'aprovado',   nome:'Aprovado'   },
  { id:'projeto',    nome:'Em projeto' },
  { id:'producao',   nome:'Produção'   },
  { id:'instalacao', nome:'Instalação' },
  { id:'concluido',  nome:'Concluído'  },
];
const COL_BADGE = { aprovado:'cyan', projeto:'gray', producao:'navy', instalacao:'amber', concluido:'green' };
const colNome = id => (COLS.find(c => c.id === id) || {}).nome || id;

const EQUIPE = { VA:'Vendedor A', VB:'Vendedor B', VC:'Vendedor C' };

const ORC_STATUS = {
  rascunho:   { nome:'Rascunho',       cor:'gray'  },
  enviado:    { nome:'Enviado',        cor:'cyan'  },
  negociacao: { nome:'Em negociação',  cor:'amber' },
  aprovado:   { nome:'Aprovado',       cor:'green' },
  recusado:   { nome:'Recusado',       cor:'red'   },
};

function orcSeed(id, cliente, obra, linha, comp, metragem, pedireito, portas, desconto, status, data, vend){
  const o = { id, cliente, obra, linha, comp, metragem, pedireito, portas, desconto, obs:'', status, data, vendedor:vend };
  o.total = calcula(o).total;
  return o;
}

function seed(){
  const h = (t, quem, quando) => ({ t, quem, quando });
  return {
    pedidos: [
      { id:1048, cliente:'Cliente A', obra:'Sede administrativa', cidade:'Curitiba · PR',  desc:'42 m² · Europrata 90 mm', linha:'Europrata 90 mm',       col:'aprovado',   nota:'Sinal recebido',         notaCor:'green', valor:31400, resp:'VA',
        hist:[ h('Sinal de 50% recebido','Financeiro','15/11, 11:20'), h('Pedido criado a partir do ORC-2279','Vendedor A','14/11, 17:02') ] },
      { id:1047, cliente:'Cliente B', obra:'Coworking',           cidade:'Joinville · SC', desc:'6 cabines acústicas',     linha:'Cabines acústicas',     col:'aprovado',   nota:'Aguarda sinal',          notaCor:'gray',  valor:74000, resp:'VB',
        hist:[ h('Pedido criado a partir do ORC-2277','Vendedor B','13/11, 10:45') ] },
      { id:1045, cliente:'Cliente C', obra:'Clínica · 2º andar',  cidade:'São José · SC',  desc:'Divisórias sanitárias',   linha:'Divisórias sanitárias', col:'projeto',    nota:'Medição em 18/11',       notaCor:'gray',  valor:18900, resp:'VA',
        hist:[ h('Medição técnica agendada para 18/11','Equipe de medição','12/11, 09:10'), h('Pedido aprovado','Vendedor A','10/11, 16:30') ] },
      { id:1044, cliente:'[Cliente]', obra:'Sede administrativa', cidade:'Curitiba · PR',  desc:'Divisória articulável',   linha:'Divisória articulável', col:'projeto',    nota:'Projeto R01 em revisão', notaCor:'gray',  valor:39700, resp:'VC',
        hist:[ h('Projeto executivo R01 enviado para verificação','Projetista','14/11, 16:40'), h('Planta de layout R02 aprovada pelo cliente','Aceite digital','13/11, 10:12'), h('Proposta comercial v3 aceita','Vendedor A','08/11, 09:30') ] },
      { id:1041, cliente:'Cliente E', obra:'Galpão industrial',   cidade:'Joinville · SC', desc:'38 m² · Europrata 90 mm', linha:'Europrata 90 mm',       col:'producao',   nota:'Pronto em 22/11',        notaCor:'gray',  valor:28600, resp:'VB',
        hist:[ h('Corte de perfis iniciado','Produção','14/11, 07:30'), h('Projeto liberado para produção','Revisor técnico','11/11, 15:00') ] },
      { id:1040, cliente:'Cliente F', obra:'Showroom',            cidade:'Blumenau · SC',  desc:'Vidro curvo',             linha:'Vidro curvo',           col:'producao',   nota:'Pronto em 25/11',        notaCor:'gray',  valor:46200, resp:'VA',
        hist:[ h('Vidros enviados para têmpera','Produção','13/11, 14:15') ] },
      { id:1037, cliente:'Cliente G', obra:'Centro logístico',    cidade:'Itajaí · SC',    desc:'Portas industriais',      linha:'Portas industriais',    col:'instalacao', nota:'Atrasado 2 dias',        notaCor:'amber', valor:52800, resp:'VC', alerta:true,
        hist:[ h('Instalação reagendada: falta de acesso à obra','Equipe 1','14/11, 08:40'), h('Material entregue na obra','Logística','12/11, 13:00') ] },
      { id:1036, cliente:'Cliente H', obra:'Escritório regional', cidade:'Curitiba · PR',  desc:'Equipe 2',                linha:'Europrata 90 mm',       col:'instalacao', nota:'Hoje, 08:00',            notaCor:'blue',  valor:35100, resp:'VB',
        hist:[ h('Equipe 2 escalada para a instalação','Coordenação','15/11, 17:30') ] },
      { id:1033, cliente:'Cliente I', obra:'Escritório comercial',cidade:'Blumenau · SC',  desc:'55 m² · Europrata 90 mm', linha:'Europrata 90 mm',       col:'concluido',  nota:'Termo assinado',         notaCor:'green', valor:41200, resp:'VA',
        hist:[ h('Termo de entrega assinado','Cliente I','11/11, 18:05') ] },
    ],
    orcamentos: [
      orcSeed('ORC-2291','Cliente J','Escritório central','Europrata 90 mm','Misto: vidro + painel cego','14','2,7','2','0','enviado','15/11','Vendedor A'),
      orcSeed('ORC-2290','Cliente K','Clínica odontológica','Divisórias sanitárias','Somente painel cego','18','2,1','6','5','aprovado','14/11','Vendedor B'),
      orcSeed('ORC-2288','Cliente L','Estúdio de gravação','Cabines acústicas','Somente painel cego','22','2,6','4','12','negociacao','13/11','Vendedor C'),
      orcSeed('ORC-2285','Cliente M','Loja térrea','Europrata 60 mm','Somente vidro temperado','9,5','2,8','1','0','recusado','11/11','Vendedor A'),
      orcSeed('ORC-2284','[Cliente]','Sede administrativa','Europrata 90 mm','Misto: vidro + painel cego','24,5','2,80','3','0','rascunho','12/11','Vendedor A'),
      orcSeed('ORC-2281','Cliente N','Sala de reuniões','Divisória articulável','Misto: vidro + painel cego','11','2,7','1','3','aprovado','09/11','Vendedor B'),
      orcSeed('ORC-2279','Cliente A','Sede administrativa','Europrata 90 mm','Misto: vidro + painel cego','15','2,8','2','0','aprovado','07/11','Vendedor A'),
    ],
    arquivos: [
      { doc:'Planta de layout',                tipo:'DWG',      rev:'R02',   sit:'Aprovada',       cor:'green' },
      { doc:'Projeto executivo de divisórias', tipo:'PDF',      rev:'R01',   sit:'Em verificação', cor:'cyan'  },
      { doc:'Medição técnica',                 tipo:'18 fotos', rev:'12/11', sit:'Arquivada',      cor:'gray'  },
      { doc:'Memorial descritivo',             tipo:'PDF',      rev:'R01',   sit:'Arquivado',      cor:'gray'  },
      { doc:'Proposta comercial',              tipo:'PDF',      rev:'v3',    sit:'Aceita',         cor:'green' },
    ],
    histProjeto: [
      { t:'Projeto executivo R01 enviado para verificação', quem:'Projetista', quando:'14/11, 16:40' },
      { t:'Planta de layout R02 aprovada pelo cliente',     quem:'Aceite digital', quando:'13/11, 10:12' },
      { t:'Medição técnica anexada com 18 fotos',           quem:'Equipe de medição', quando:'12/11, 15:05' },
      { t:'Proposta comercial v3 aceita',                   quem:'Vendedor A', quando:'08/11, 09:30' },
    ],
    checklist: [
      { t:'Vãos de porta e sentido de abertura',         ok:true  },
      { t:'Pé-direito e altura dos painéis',             ok:true  },
      { t:'Parede B: 4,20 m no projeto × 4,12 m medido', ok:false, diverg:true },
      { t:'Quantitativo igual ao orçamento',             ok:true  },
      { t:'Compatível com a linha escolhida',            ok:true  },
    ],
    verif: { status:'andamento', obs:'' },
    notifLidas: [],
  };
}

const KEY = 'eurohub-v2';
let DB;
function loadDB(){
  try { DB = JSON.parse(localStorage.getItem(KEY)); } catch (e) { DB = null; }
  if (!DB || !Array.isArray(DB.pedidos) || !Array.isArray(DB.orcamentos)) DB = seed();
}
function saveDB(){ try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
loadDB();

/* ============================================================
   SESSÃO
============================================================ */
function getStore(k){ try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } }
const logado = () => getStore('eurohub-login');
function usuario(){
  const email = logado() || 'gestor@euroflex.com.br';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'gestor';
  const nome = base.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const parts = nome.split(' ');
  const ini = ((parts[0] || 'G')[0] + (parts[1] ? parts[1][0] : (parts[0] || 'GE')[1] || '')).toUpperCase();
  return { email, nome, ini };
}

/* ============================================================
   TOAST / MODAL / DRAWER / POPOVERS
============================================================ */
function toast(msg, icon){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = ico(icon || 'check') + `<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 3400);
}

function openModal(html, onReady){
  $('#modal').innerHTML = html;
  $('#modal-back').hidden = false;
  const f = $('#modal input, #modal textarea, #modal select'); if (f) setTimeout(() => f.focus(), 30);
  if (onReady) onReady($('#modal'));
}
function closeModal(){ $('#modal-back').hidden = true; $('#modal').innerHTML = ''; }
$('#modal-back').addEventListener('click', e => {
  if (e.target.id === 'modal-back' || e.target.closest('[data-close]')) closeModal();
});
function confirmar(titulo, texto, rotulo, acao, perigo){
  openModal(`
    <h3>${esc(titulo)}</h3><p class="modal-sub">${esc(texto)}</p>
    <div class="modal-btns">
      <button class="btn btn-outline" data-close>Cancelar</button>
      <button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" id="cf-ok">${esc(rotulo)}</button>
    </div>`, m => $('#cf-ok', m).addEventListener('click', () => { closeModal(); acao(); }));
}

function openDrawer(html, bind){
  $('#drawer-root').innerHTML = `<div class="drawer-back" data-close></div><aside class="drawer" role="dialog" aria-modal="true">${html}</aside>`;
  $$('#drawer-root [data-close]').forEach(b => b.addEventListener('click', closeDrawer));
  if (bind) bind($('#drawer-root .drawer'));
}
function closeDrawer(){ $('#drawer-root').innerHTML = ''; }

function closePops(){ $('#notif-pop').hidden = true; $('#avatar-pop').hidden = true; }
document.addEventListener('click', e => { if (!e.target.closest('.pop-wrap')) closePops(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#modal-back').hidden) closeModal();
  else if ($('#drawer-root').innerHTML) closeDrawer();
  else closePops();
  $('#app').classList.remove('nav-open');
});

/* ============================================================
   LOGIN
============================================================ */
$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#login-email'), senha = $('#login-senha');
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const okSenha = senha.value.length > 0;
  email.classList.toggle('invalid', !okEmail); $('#err-email').hidden = okEmail;
  senha.classList.toggle('invalid', !okSenha); $('#err-senha').hidden = okSenha;
  if (!okEmail || !okSenha) return;

  const btn = $('#login-btn');
  btn.classList.add('loading'); btn.innerHTML = '<span class="spinner"></span> Entrando…';
  setTimeout(() => {
    try { ($('#login-keep').checked ? localStorage : sessionStorage).setItem('eurohub-login', email.value.trim().toLowerCase()); } catch (err) {}
    btn.classList.remove('loading'); btn.textContent = 'Entrar';
    senha.value = '';
    location.hash = '#/painel';
    render();
    toast(`Bem-vindo, ${usuario().nome}!`);
  }, 650);
});
$('#login-forgot').addEventListener('click', e => { e.preventDefault(); toast('Solicite ao gestor a redefinição da sua senha.', 'info'); });
$('#login-portal').addEventListener('click', e => { e.preventDefault(); toast('O portal do cliente faz parte da próxima etapa do projeto.', 'info'); });

/* ============================================================
   TOPO: MENU, NOTIFICAÇÕES, CONTA
============================================================ */
$('#menu-btn').innerHTML = ico('menu');
$('#menu-btn').addEventListener('click', () => $('#app').classList.toggle('nav-open'));
$('#app').addEventListener('click', e => { if (e.target.id === 'app') $('#app').classList.remove('nav-open'); });

$('#btn-reset').innerHTML = ico('refresh') + 'Restaurar dados da demonstração';
$('#btn-sair').innerHTML = ico('logout') + 'Sair';

$('#avatar-btn').addEventListener('click', () => {
  const was = $('#avatar-pop').hidden; closePops(); $('#avatar-pop').hidden = !was;
});
$('#btn-sair').addEventListener('click', () => {
  try { sessionStorage.removeItem('eurohub-login'); localStorage.removeItem('eurohub-login'); } catch (e) {}
  closePops(); location.hash = '#/login'; render();
});
$('#btn-reset').addEventListener('click', () => {
  closePops();
  confirmar('Restaurar demonstração', 'Os pedidos, orçamentos e verificações voltam ao estado original. Deseja continuar?',
    'Restaurar', () => { DB = seed(); saveDB(); render(); toast('Dados da demonstração restaurados.', 'refresh'); }, true);
});

function notificacoes(){
  const lista = [];
  DB.pedidos.filter(p => p.alerta).forEach(p => lista.push({
    id:'atraso-' + p.id, icon:'alert', cor:'amber', t:`Pedido #${p.id} com instalação atrasada`, s:`${p.cliente} · ${p.nota}`, go:() => abrirPedido(p.id) }));
  if (DB.verif.status === 'andamento') lista.push({
    id:'verif-1044', icon:'verificacao', cor:'cyan', t:'Projeto executivo R01 aguarda verificação', s:'Pedido #1044 · enviado em 14/11', go:() => { location.hash = '#/verificacao'; } });
  DB.orcamentos.filter(o => o.status === 'negociacao' && num(o.desconto) > LIMITE_DESCONTO).forEach(o => lista.push({
    id:'desc-' + o.id, icon:'orcamentos', cor:'red', t:`${o.id} pede aprovação de desconto`, s:`${o.cliente} · ${fmt(num(o.desconto),0)}% de desconto`, go:() => { location.hash = '#/orcamentos/' + o.id; } }));
  DB.orcamentos.filter(o => o.status === 'aprovado').slice(0, 1).forEach(o => lista.push({
    id:'aprov-' + o.id, icon:'check', cor:'green', t:`${o.id} aprovado pelo cliente`, s:`${o.cliente} · ${brl(o.total)}`, go:() => { location.hash = '#/orcamentos/' + o.id; } }));
  return lista;
}
function renderNotif(){
  const lista = notificacoes();
  const naoLidas = lista.filter(n => !DB.notifLidas.includes(n.id)).length;
  $('#notif-btn').innerHTML = ico('bell') + (naoLidas ? `<span class="dot-count">${naoLidas}</span>` : '');
  $('#notif-pop').innerHTML = `
    <div class="pop-head"><span>Notificações</span>${naoLidas ? '<button class="link-btn" id="notif-all">Marcar como lidas</button>' : '<small>Tudo em dia</small>'}</div>
    ${lista.length ? lista.map((n, i) => `
      <button class="notif-item ${DB.notifLidas.includes(n.id) ? '' : 'unread'}" data-i="${i}">
        <span class="n-ico alert-ico ${n.cor}">${ico(n.icon)}</span>
        <span><b>${esc(n.t)}</b><small>${esc(n.s)}</small></span>
      </button>`).join('') : `<div class="empty">${ico('inbox')}<div>Nenhuma notificação.</div></div>`}`;
  $$('#notif-pop .notif-item').forEach(b => b.addEventListener('click', () => {
    const n = lista[+b.dataset.i];
    if (!DB.notifLidas.includes(n.id)) DB.notifLidas.push(n.id);
    saveDB(); closePops(); renderNotif(); n.go();
  }));
  const all = $('#notif-all');
  if (all) all.addEventListener('click', e => {
    e.stopPropagation(); lista.forEach(n => { if (!DB.notifLidas.includes(n.id)) DB.notifLidas.push(n.id); });
    saveDB(); renderNotif(); $('#notif-pop').hidden = false;
  });
}
$('#notif-btn').addEventListener('click', () => {
  const was = $('#notif-pop').hidden; closePops(); $('#notif-pop').hidden = !was;
});

/* ============================================================
   NAVEGAÇÃO
============================================================ */
const NAV = [
  ['painel','Painel'], ['orcamentos','Orçamentos'], ['pedidos','Pedidos'], ['projetos','Projetos'],
  ['verificacao','Verificação'], ['producao','Produção'], ['instalacao','Instalação'], ['clientes','Clientes e obras'],
];
function renderNav(ativo){
  const andamento = DB.pedidos.filter(p => p.col !== 'concluido').length;
  const counts = {
    pedidos: andamento ? `<span class="nav-count">${andamento}</span>` : '',
    verificacao: DB.verif.status === 'andamento' ? '<span class="nav-count warn">1</span>' : '',
  };
  $('#nav').innerHTML = NAV.map(([id, nome]) =>
    `<a href="#/${id}" class="${id === ativo ? 'active' : ''}" ${id === ativo ? 'aria-current="page"' : ''}>${ico(id)}<span>${nome}</span>${counts[id] || ''}</a>`).join('');
  $$('#nav a').forEach(a => a.addEventListener('click', () => $('#app').classList.remove('nav-open')));
}

function setHeader(titulo, sub, crumbs){
  $('#page-title').textContent = titulo;
  $('#page-sub').textContent = sub || '';
  $('#page-sub').hidden = !sub;
  const c = $('#crumbs');
  if (crumbs){ c.hidden = false; c.innerHTML = crumbs; } else { c.hidden = true; c.innerHTML = ''; }
  $('#topbar-actions').innerHTML = '';
}
const searchField = (id, label, ph, val) => `
  <div class="field-top"><span>${label}</span>
    <div class="search">${ico('search')}<input id="${id}" placeholder="${ph}" value="${esc(val || '')}"></div></div>`;

function rota(){
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/');
  return { r: parts[0] || '', p: decodeURIComponent(parts[1] || '') };
}

function render(){
  const { r, p } = rota();
  if (!logado()){
    $('#view-login').hidden = false; $('#app').hidden = true;
    document.title = 'Entrar · EuroHub';
    return;
  }
  const route = VIEWS[r] ? r : 'painel';
  if (!VIEWS[r] && location.hash !== '#/painel'){ history.replaceState(null, '', '#/painel'); }
  $('#view-login').hidden = true; $('#app').hidden = false;
  closeDrawer(); closePops(); closeModal();
  window.onbeforeunload = null;

  const u = usuario();
  $('#avatar-btn').textContent = u.ini; $('#side-avatar').textContent = u.ini;
  $('#side-name').textContent = u.nome; $('#pop-name').textContent = u.nome; $('#pop-email').textContent = u.email;

  renderNav(route);
  renderNotif();
  const content = $('#content');
  content.style.animation = 'none'; void content.offsetWidth; content.style.animation = '';
  VIEWS[route](p);
  document.title = $('#page-title').textContent + ' · EuroHub';
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

/* ============================================================
   PAINEL
============================================================ */
const MESES = [ ['jun','junho',18], ['jul','julho',24], ['ago','agosto',21], ['set','setembro',31], ['out','outubro',28], ['nov','novembro',37] ];
const AGENDA = [
  { dia:'Hoje',  data:'16/11', hora:'08:00', pedido:1036, cliente:'Cliente H', obra:'Escritório regional', equipe:'Equipe 2', pessoas:['RM','JS'], obs:'Montagem iniciada', cor:'cyan' },
  { dia:'Hoje',  data:'16/11', hora:'13:30', pedido:1037, cliente:'Cliente G', obra:'Centro logístico',    equipe:'Equipe 1', pessoas:['AL','PT','DC'], obs:'Atrasado 2 dias · priorizar', cor:'amber' },
  { dia:'Amanhã',data:'17/11', hora:'08:00', pedido:1036, cliente:'Cliente H', obra:'Escritório regional', equipe:'Equipe 2', pessoas:['RM','JS'], obs:'Acabamento e limpeza', cor:'gray' },
  { dia:'Quinta',data:'19/11', hora:'09:00', pedido:1041, cliente:'Cliente E', obra:'Galpão industrial',   equipe:'Equipe 1', pessoas:['AL','PT'], obs:'Depende da produção (pronto em 22/11)', cor:'gray' },
  { dia:'Sexta', data:'20/11', hora:'08:00', pedido:1033, cliente:'Cliente I', obra:'Escritório comercial',equipe:'Equipe 3', pessoas:['MV'], obs:'Visita de pós-venda', cor:'gray' },
];

function badgePedido(p){
  return p.alerta ? `<span class="badge amber">${esc(p.nota)}</span>` : `<span class="badge ${COL_BADGE[p.col]}">${colNome(p.col)}</span>`;
}

function viewPainel(){
  setHeader('Painel do gestor', 'Novembro · dados ilustrativos');
  $('#topbar-actions').innerHTML = `<button class="btn btn-primary" id="tb-novo">${ico('plus')}Novo orçamento</button>`;
  $('#tb-novo').addEventListener('click', () => { location.hash = '#/orcamentos/novo'; });

  const max = 40, ticks = [0, 10, 20, 30, 40];
  const ultimo = MESES.length - 1;
  const recentes = COLS.map(c => DB.pedidos.filter(p => p.col === c.id).sort((a, b) => b.id - a.id)[0])
    .filter(Boolean).sort((a, b) => b.id - a.id);

  const atencao = [];
  DB.pedidos.filter(p => p.alerta).forEach(p => atencao.push({ icon:'alert', cor:'amber', t:`Pedido #${p.id} · ${p.cliente}`, s:`${p.desc} · ${p.nota.toLowerCase()}`, go:'pedido:' + p.id }));
  if (DB.verif.status === 'andamento') atencao.push({ icon:'verificacao', cor:'cyan', t:'Projeto R01 aguarda verificação', s:'Pedido #1044 · divergência de 8 cm na parede B', go:'#/verificacao' });
  DB.orcamentos.filter(o => o.status === 'negociacao' && num(o.desconto) > LIMITE_DESCONTO).forEach(o =>
    atencao.push({ icon:'orcamentos', cor:'red', t:`${o.id} pede aprovação de desconto`, s:`${o.cliente} · ${fmt(num(o.desconto))}% acima do limite de ${LIMITE_DESCONTO}%`, go:'#/orcamentos/' + o.id }));
  DB.orcamentos.filter(o => o.status === 'rascunho').forEach(o =>
    atencao.push({ icon:'clock', cor:'cyan', t:`${o.id} ainda em rascunho`, s:`${o.cliente} · ${o.obra} · ${brl(o.total)}`, go:'#/orcamentos/' + o.id }));

  $('#content').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="kpi-label">Faturamento do mês</div><div class="kpi-value num">R$ 412 mil</div>
        <div class="kpi-delta"><b class="up">▲ 14%</b> vs. outubro</div></div>
      <div class="card kpi"><div class="kpi-label">m² vendidos</div><div class="kpi-value num">1.860 m²</div>
        <div class="kpi-delta"><b class="up">▲ 9%</b> vs. outubro</div></div>
      <div class="card kpi"><div class="kpi-label">Orçamentos enviados</div><div class="kpi-value num">74</div>
        <div class="kpi-delta"><b class="down">▼ 3%</b> vs. outubro</div></div>
      <div class="card kpi kpi-dark"><div class="kpi-label">Conversão</div><div class="kpi-value num">31%</div>
        <div class="kpi-delta"><b class="up">▲ 2 p.p.</b> vs. outubro</div></div>
    </div>

    <div class="grid-2">
      <div class="card card-pad">
        <div class="card-head"><h3>Pedidos por mês</h3><small>Últimos 6 meses</small></div>
        <div class="chart-wrap" role="img" aria-label="Pedidos por mês: ${MESES.map(m => m[1] + ' ' + m[2]).join(', ')}">
          <div class="chart-grid">${ticks.map(t => `<div style="top:${(1 - t / max) * 100}%"><span>${t}</span></div>`).join('')}</div>
          <div class="chart">
            ${MESES.map(([m, nome, v], i) => {
              const prev = i ? MESES[i - 1][2] : null;
              const dv = prev ? Math.round((v - prev) / prev * 100) : null;
              return `
              <div class="bar-col">
                <div class="bar ${i === ultimo ? 'now' : ''}" style="height:0%" data-h="${v / max * 100}">
                  ${i === ultimo ? `<span class="bar-val">${v}</span>` : ''}
                </div>
                <div class="tip"><b>${v} pedidos</b>${nome}${dv !== null ? ` · ${dv >= 0 ? '+' : ''}${dv}% vs. ${MESES[i - 1][0]}` : ''}</div>
              </div>`; }).join('')}
          </div>
        </div>
        <div class="chart-x">${MESES.map(([m], i) => `<span class="${i === ultimo ? 'now' : ''}">${m}</span>`).join('')}</div>
      </div>

      <div class="card card-pad">
        <div class="card-head"><h3>Pedidos recentes</h3><a href="#/pedidos">Ver todos</a></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Linha</th><th>Status</th></tr></thead>
          <tbody>${recentes.map(p => `
            <tr class="clickable" data-pedido="${p.id}"><td>#${p.id}</td><td>${esc(p.cliente)}</td>
              <td class="td-muted">${esc(p.linha)}</td><td>${badgePedido(p)}</td></tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>

    <div class="grid-half section-gap">
      <div class="card card-pad">
        <div class="card-head"><h3>Próximas instalações</h3><a href="#/instalacao">Ver agenda</a></div>
        <ul class="mini-list">${AGENDA.slice(0, 4).map(a => `
          <li><div class="mini-date"><b>${a.data.split('/')[0]}</b><small>nov</small></div>
            <div class="mini-body"><b>#${a.pedido} · ${esc(a.cliente)}</b><small>${a.hora} · ${a.equipe} · ${esc(a.obs)}</small></div>
            <span class="badge ${a.cor}">${a.dia}</span></li>`).join('')}
        </ul>
      </div>
      <div class="card card-pad">
        <div class="card-head"><h3>Precisa da sua atenção</h3><small>${atencao.length} ${atencao.length === 1 ? 'item' : 'itens'}</small></div>
        ${atencao.length ? `<ul class="mini-list">${atencao.map((a, i) => `
          <li class="clickable" data-go="${esc(a.go)}" style="cursor:pointer">
            <span class="alert-ico ${a.cor}">${ico(a.icon)}</span>
            <div class="mini-body"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div>
            ${ico('chevron')}</li>`).join('')}</ul>`
          : `<div class="empty">${ico('check')}<div>Tudo em dia por aqui.</div></div>`}
      </div>
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() =>
    $$('.bar[data-h]').forEach(b => { b.style.height = b.dataset.h + '%'; })));
  $$('[data-pedido]').forEach(r => r.addEventListener('click', () => abrirPedido(+r.dataset.pedido)));
  $$('[data-go]').forEach(li => li.addEventListener('click', () => {
    const g = li.dataset.go;
    if (g.startsWith('pedido:')) abrirPedido(+g.split(':')[1]); else location.hash = g;
  }));
}

/* ============================================================
   ORÇAMENTOS — LISTA
============================================================ */
let filtroOrc = { status:'todos', busca:'' };

function viewOrcamentos(param){
  if (param) return viewOrcEditor(param);
  setHeader('Orçamentos', 'Propostas comerciais · dados ilustrativos');
  $('#topbar-actions').innerHTML = searchField('busca-orc', 'Buscar', 'Nº, cliente ou obra', filtroOrc.busca)
    + `<button class="btn btn-primary" id="tb-novo">${ico('plus')}Novo orçamento</button>`;
  $('#tb-novo').addEventListener('click', () => { location.hash = '#/orcamentos/novo'; });
  $('#busca-orc').addEventListener('input', e => { filtroOrc.busca = e.target.value; desenhaListaOrc(); });

  const os = DB.orcamentos;
  const aberto = os.filter(o => ['enviado', 'negociacao', 'rascunho'].includes(o.status));
  const aprov = os.filter(o => o.status === 'aprovado');
  const decididos = os.filter(o => ['aprovado', 'recusado'].includes(o.status)).length;
  const ticket = os.length ? os.reduce((s, o) => s + o.total, 0) / os.length : 0;

  $('#content').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="kpi-label">Em aberto</div><div class="kpi-value num">${brlK(aberto.reduce((s, o) => s + o.total, 0))}</div>
        <div class="kpi-delta">${aberto.length} ${aberto.length === 1 ? 'proposta' : 'propostas'}</div></div>
      <div class="card kpi"><div class="kpi-label">Aprovados</div><div class="kpi-value num">${brlK(aprov.reduce((s, o) => s + o.total, 0))}</div>
        <div class="kpi-delta">${aprov.length} ${aprov.length === 1 ? 'proposta' : 'propostas'}</div></div>
      <div class="card kpi"><div class="kpi-label">Ticket médio</div><div class="kpi-value num">${brlK(ticket)}</div>
        <div class="kpi-delta">por proposta</div></div>
      <div class="card kpi kpi-dark"><div class="kpi-label">Taxa de aprovação</div><div class="kpi-value num">${decididos ? Math.round(aprov.length / decididos * 100) : 0}%</div>
        <div class="kpi-delta">das propostas decididas</div></div>
    </div>
    <div class="card card-pad">
      <div class="toolbar"><div class="chips" id="orc-chips"></div></div>
      <div id="orc-lista"></div>
    </div>`;
  desenhaListaOrc();
}

function desenhaListaOrc(){
  const counts = { todos: DB.orcamentos.length };
  Object.keys(ORC_STATUS).forEach(k => { counts[k] = DB.orcamentos.filter(o => o.status === k).length; });
  $('#orc-chips').innerHTML = [['todos', 'Todos']].concat(Object.keys(ORC_STATUS).map(k => [k, ORC_STATUS[k].nome]))
    .map(([k, n]) => `<button class="chip ${filtroOrc.status === k ? 'active' : ''}" data-st="${k}">${n} <span class="c">${counts[k]}</span></button>`).join('');
  $$('#orc-chips .chip').forEach(c => c.addEventListener('click', () => { filtroOrc.status = c.dataset.st; desenhaListaOrc(); }));

  const f = filtroOrc.busca.trim().toLowerCase();
  const lista = DB.orcamentos.filter(o =>
    (filtroOrc.status === 'todos' || o.status === filtroOrc.status) &&
    (!f || [o.id, o.cliente, o.obra, o.linha].join(' ').toLowerCase().includes(f)));

  $('#orc-lista').innerHTML = lista.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>Nº</th><th>Cliente / obra</th><th>Linha</th><th class="r">Valor</th><th>Status</th><th>Atualizado</th><th>Vendedor</th></tr></thead>
      <tbody>${lista.map(o => `
        <tr class="clickable" data-orc="${esc(o.id)}">
          <td>${esc(o.id)}</td>
          <td>${esc(o.cliente)}<br><small>${esc(o.obra)}</small></td>
          <td class="td-muted">${esc(o.linha)}</td>
          <td class="r num">${brl(o.total)}</td>
          <td><span class="badge ${ORC_STATUS[o.status].cor}">${ORC_STATUS[o.status].nome}</span></td>
          <td class="td-muted">${esc(o.data)}</td>
          <td class="td-muted">${esc(o.vendedor)}</td>
        </tr>`).join('')}
      </tbody></table></div>`
    : `<div class="empty">${ico('inbox')}<div>Nenhum orçamento encontrado com esses filtros.</div></div>`;
  $$('[data-orc]').forEach(r => r.addEventListener('click', () => { location.hash = '#/orcamentos/' + r.dataset.orc; }));
}

/* ============================================================
   ORÇAMENTOS — EDITOR (calculadora ao vivo)
============================================================ */
function proximoOrcId(){
  const n = Math.max(...DB.orcamentos.map(o => parseInt(o.id.replace(/\D/g, ''), 10) || 0), 2290) + 1;
  return 'ORC-' + n;
}

function viewOrcEditor(param){
  const novo = param === 'novo';
  let orc = novo ? null : DB.orcamentos.find(o => o.id === param);
  if (!novo && !orc){ location.hash = '#/orcamentos'; return; }
  const dados = orc ? clone(orc) : {
    id:null, cliente:'', obra:'', linha:'Europrata 90 mm', comp:'Misto: vidro + painel cego',
    metragem:'', pedireito:'2,80', portas:'0', desconto:'0', obs:'', status:'rascunho', vendedor:'Vendedor A' };

  const st = ORC_STATUS[dados.status];
  setHeader(novo ? 'Novo orçamento' : `Orçamento ${dados.id}`,
    novo ? 'Orçamentos · rascunho · valores ilustrativos' : `${dados.cliente} · ${dados.obra} · valores ilustrativos`,
    `<a href="#/orcamentos">Orçamentos</a>${ico('chevron')}<span>${novo ? 'Novo' : esc(dados.id)}</span>`);
  $('#topbar-actions').innerHTML = (novo ? '' : `<span class="badge ${st.cor}" style="align-self:center">${st.nome}</span>`)
    + `<button class="btn btn-outline" id="btn-salvar">${ico('save')}Salvar rascunho</button>`;

  const linhaOpts = Object.keys(LINHAS).map(l => `<option ${l === dados.linha ? 'selected' : ''}>${l}</option>`).join('');
  const compOpts = Object.keys(COMPOS).map(c => `<option ${c === dados.comp ? 'selected' : ''}>${c}</option>`).join('');

  $('#content').innerHTML = `
    <div class="grid-75">
      <div class="card card-pad">
        <h3>Dados da divisória</h3>
        <div class="form-2col">
          <div><label for="o-cliente">Cliente</label><input id="o-cliente" value="${esc(dados.cliente)}" placeholder="Nome do cliente"></div>
          <div><label for="o-obra">Obra</label><input id="o-obra" value="${esc(dados.obra)}" placeholder="Ex.: Sede administrativa"></div>
          <div><label for="o-linha">Linha</label><select id="o-linha">${linhaOpts}</select></div>
          <div><label for="o-comp">Composição</label><select id="o-comp">${compOpts}</select></div>
          <div><label for="o-metragem">Metragem linear</label><div class="input-suffix"><input id="o-metragem" value="${esc(dados.metragem)}" inputmode="decimal" placeholder="0,0"><em>m</em></div></div>
          <div><label for="o-pedireito">Pé-direito</label><div class="input-suffix"><input id="o-pedireito" value="${esc(dados.pedireito)}" inputmode="decimal"><em>m</em></div></div>
          <div><label for="o-portas">Portas</label><div class="input-suffix"><input id="o-portas" value="${esc(dados.portas)}" inputmode="numeric"><em>un</em></div></div>
          <div><label for="o-desc">Desconto</label><div class="input-suffix"><input id="o-desc" value="${esc(dados.desconto)}" inputmode="decimal"><em>%</em></div></div>
        </div>
        <label for="o-obs">Observações</label>
        <textarea id="o-obs" rows="3" placeholder="Acabamento, cor dos perfis, prazo combinado">${esc(dados.obs)}</textarea>
        <p class="form-note" id="o-aviso"></p>
      </div>
      <div>
        <div class="card card-pad">
          <h3 style="margin-bottom:6px">Materiais calculados</h3>
          <div class="mat-row"><span>Perfis de alumínio</span><b class="num" id="m-perfis">—</b></div>
          <div class="mat-row"><span>Painéis cegos</span><b class="num" id="m-paineis">—</b></div>
          <div class="mat-row"><span>Vidros temperados</span><b class="num" id="m-vidros">—</b></div>
          <div class="mat-row"><span>Portas com ferragens</span><b class="num" id="m-portas">—</b></div>
          <div class="mat-meta"><span id="m-area"></span><span id="m-bruto"></span></div>
        </div>
        <div class="total-panel">
          <div class="tp-label">Total do orçamento</div>
          <div class="tp-value num" id="o-total">—</div>
          <div class="tp-sub">Validade de 15 dias · 50% de sinal e 50% na entrega</div>
          <div class="tp-btns">
            <button class="btn btn-cyan" id="btn-pdf">${ico('printer')}Gerar PDF</button>
            <button class="btn btn-ghost-light" id="btn-whats">${ico('send')}Enviar no WhatsApp</button>
          </div>
          <button class="tp-link" id="btn-converter">${dados.pedido ? `Ver pedido #${dados.pedido}` : 'Converter em pedido'}</button>
        </div>
      </div>
    </div>`;

  const ler = () => ({
    cliente: $('#o-cliente').value.trim(), obra: $('#o-obra').value.trim(),
    linha: $('#o-linha').value, comp: $('#o-comp').value,
    metragem: $('#o-metragem').value.trim(), pedireito: $('#o-pedireito').value.trim(),
    portas: $('#o-portas').value.trim(), desconto: $('#o-desc').value.trim(), obs: $('#o-obs').value,
  });
  let sujo = false;

  function atualiza(){
    const c = calcula(ler());
    $('#m-perfis').textContent = c.perfis + ' barras';
    $('#m-paineis').textContent = c.paineis + ' un';
    $('#m-vidros').textContent = c.vidros + ' un';
    $('#m-portas').textContent = c.pts + ' un';
    $('#m-area').textContent = `Área: ${fmt(c.area, 1)} m²`;
    $('#m-bruto').textContent = c.dsc ? `Sem desconto: ${brl(c.bruto)}` : '';
    $('#o-total').textContent = brl(c.total);
    const aviso = $('#o-aviso');
    const acima = c.dsc > LIMITE_DESCONTO;
    aviso.className = 'form-note' + (acima ? ' warn' : '');
    aviso.innerHTML = acima
      ? `${ico('alert')}Desconto de ${fmt(c.dsc)}% acima do limite de ${LIMITE_DESCONTO}% — precisa de aprovação do gestor.`
      : `${ico('info')}Desconto acima de ${LIMITE_DESCONTO}% pede aprovação do gestor.`;
    return c;
  }
  ['o-cliente','o-obra','o-linha','o-comp','o-metragem','o-pedireito','o-portas','o-desc','o-obs'].forEach(id =>
    $('#' + id).addEventListener('input', () => { sujo = true; atualiza(); }));
  atualiza();

  function valida(){
    const d = ler(); let ok = true;
    [['o-cliente', d.cliente], ['o-metragem', num(d.metragem) > 0 ? 'ok' : '']].forEach(([id, v]) => {
      $('#' + id).classList.toggle('invalid', !v); if (!v) ok = false;
    });
    if (!ok) toast('Preencha o cliente e a metragem linear.', 'alert');
    return ok;
  }
  function salvar(statusNovo){
    const d = ler(), c = calcula(d);
    if (!orc){
      orc = Object.assign({ id: proximoOrcId(), status:'rascunho', vendedor: usuario().nome }, d);
      DB.orcamentos.unshift(orc);
    } else Object.assign(orc, d);
    orc.total = c.total; orc.data = hoje();
    if (statusNovo) orc.status = statusNovo;
    saveDB(); sujo = false;
    return orc;
  }

  $('#btn-salvar').addEventListener('click', () => {
    if (!valida()) return;
    const eraNovo = !orc; const o = salvar();
    toast(`${o.id} salvo.`, 'save');
    if (eraNovo) history.replaceState(null, '', '#/orcamentos/' + o.id), render();
  });

  $('#btn-pdf').addEventListener('click', () => {
    if (!valida()) return;
    const o = salvar(); const c = calcula(o);
    $('#print-area').innerHTML = `
      <div class="pr-head">
        <div><div class="pr-logo">EURO<span>HUB</span></div><div>Euroflex Divisórias</div></div>
        <div class="pr-meta"><b>Proposta comercial ${esc(o.id)}</b><br>Emitida em ${new Date().toLocaleDateString('pt-BR')}<br>Responsável: ${esc(o.vendedor)}</div>
      </div>
      <div class="pr-title">${esc(o.cliente)} · ${esc(o.obra || 'Obra')}</div>
      <div>${esc(o.linha)} · ${esc(o.comp)}</div>
      <table class="pr-table">
        <tr><th>Item</th><th>Quantidade</th></tr>
        <tr><td>Metragem linear × pé-direito</td><td>${fmt(c.m, 2)} m × ${fmt(c.pd, 2)} m (${fmt(c.area, 1)} m²)</td></tr>
        <tr><td>Perfis de alumínio</td><td>${c.perfis} barras</td></tr>
        <tr><td>Painéis cegos</td><td>${c.paineis} un</td></tr>
        <tr><td>Vidros temperados</td><td>${c.vidros} un</td></tr>
        <tr><td>Portas com ferragens</td><td>${c.pts} un</td></tr>
        ${c.dsc ? `<tr><td>Desconto</td><td>${fmt(c.dsc, 1)}%</td></tr>` : ''}
      </table>
      <div class="pr-total">Total: ${brl(c.total)}</div>
      ${o.obs ? `<p class="pr-terms"><b>Observações:</b> ${esc(o.obs)}</p>` : ''}
      <div class="pr-terms"><b>Condições:</b> validade de 15 dias · 50% de sinal na aprovação e 50% na entrega ·
        prazo de produção confirmado após a medição técnica · valores sujeitos à conferência em obra.</div>
      <div class="pr-sign"><div>Euroflex Divisórias</div><div>${esc(o.cliente)}</div></div>
      <div class="pr-foot">Documento de demonstração gerado pelo EuroHub · valores ilustrativos.</div>`;
    window.print();
  });

  $('#btn-whats').addEventListener('click', () => {
    if (!valida()) return;
    const o = salvar(); const c = calcula(o);
    if (o.status === 'rascunho') { o.status = 'enviado'; saveDB(); }
    const msg = `*Euroflex Divisórias — Proposta ${o.id}*\n${o.cliente}${o.obra ? ' · ' + o.obra : ''}\n`
      + `${o.linha} · ${o.comp}\n${fmt(c.m, 1)} m lineares · pé-direito ${fmt(c.pd, 2)} m · ${c.pts} porta(s)\n`
      + `*Total: ${brl(c.total)}*\nValidade de 15 dias.`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    toast(`${o.id} marcado como enviado.`, 'send');
    render();
  });

  $('#btn-converter').addEventListener('click', () => {
    if (orc && orc.pedido){ location.hash = '#/pedidos'; setTimeout(() => abrirPedido(orc.pedido), 50); return; }
    if (!valida()) return;
    const c = calcula(ler());
    const go = () => {
      const o = salvar('aprovado');
      const id = Math.max(...DB.pedidos.map(p => p.id)) + 1;
      DB.pedidos.unshift({
        id, cliente:o.cliente, obra:o.obra || '—', cidade:'—', desc:`${fmt(c.area)} m² · ${o.linha}`, linha:o.linha,
        col:'aprovado', nota:'Aguarda sinal', notaCor:'gray', valor:Math.round(c.total), resp:'VA',
        hist:[{ t:`Pedido criado a partir do ${o.id}`, quem:usuario().nome, quando:agora() }],
      });
      o.pedido = id; saveDB();
      location.hash = '#/pedidos';
      toast(`Pedido #${id} criado a partir do ${o.id}.`);
    };
    if (c.dsc > LIMITE_DESCONTO)
      confirmar('Aprovar desconto', `O desconto de ${fmt(c.dsc)}% está acima do limite de ${LIMITE_DESCONTO}%. Como gestor, você aprova e converte em pedido?`, 'Aprovar e converter', go);
    else go();
  });

  window.onbeforeunload = () => (sujo ? true : undefined);
}

/* ============================================================
   PEDIDOS — KANBAN
============================================================ */
let filtroPed = '';

function viewPedidos(){
  const andamento = DB.pedidos.filter(p => p.col !== 'concluido');
  setHeader('Pedidos', `${andamento.length} pedidos em andamento · ${brlK(andamento.reduce((s, p) => s + (p.valor || 0), 0))} em carteira · dados ilustrativos`);
  $('#topbar-actions').innerHTML = searchField('busca-ped', 'Buscar', 'Nº do pedido, cliente ou obra', filtroPed)
    + `<button class="btn btn-primary" id="tb-novo">${ico('plus')}Novo pedido</button>`;
  $('#busca-ped').addEventListener('input', e => { filtroPed = e.target.value; desenhaKanban(); });
  $('#tb-novo').addEventListener('click', modalNovoPedido);
  desenhaKanban();
}

function desenhaKanban(){
  const f = filtroPed.trim().toLowerCase();
  const vis = p => !f || [p.id, p.cliente, p.obra, p.desc, p.linha].join(' ').toLowerCase().includes(f);
  $('#content').innerHTML = `<div class="kanban">${COLS.map(c => {
    const itens = DB.pedidos.filter(p => p.col === c.id && vis(p)).sort((a, b) => b.id - a.id);
    const soma = itens.reduce((s, p) => s + (p.valor || 0), 0);
    return `
      <section class="kcol" data-col="${c.id}" aria-label="${c.nome}">
        <div class="kcol-head"><h4>${c.nome}</h4><span class="kcol-count">${itens.length}</span></div>
        <div class="kcol-sum num">${itens.length ? brlK(soma) : '&nbsp;'}</div>
        ${itens.map(p => `
          <article class="kcard ${p.alerta ? 'alert' : ''}" draggable="true" data-id="${p.id}" tabindex="0">
            <h5>#${p.id} · ${esc(p.cliente)}</h5>
            <p>${esc(p.desc)}</p>
            <div class="knote ${p.notaCor}">${esc(p.nota)}</div>
            <div class="kcard-foot"><span class="kval num">${brl(p.valor || 0)}</span>
              <span class="avatar sm" title="${esc(EQUIPE[p.resp] || '')}">${esc(p.resp || '')}</span></div>
          </article>`).join('') || `<div class="kcol-empty">${f ? 'Nenhum resultado' : 'Sem pedidos'}</div>`}
      </section>`; }).join('')}</div>`;

  $$('.kcard').forEach(card => {
    card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.dataset.id); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('click', () => abrirPedido(+card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') abrirPedido(+card.dataset.id); });
  });
  $$('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('dragover'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('dragover'); });
    col.addEventListener('drop', e => {
      e.preventDefault(); col.classList.remove('dragover');
      moverPedido(+e.dataTransfer.getData('text/plain'), col.dataset.col);
    });
  });
}

function moverPedido(id, colId, silencioso){
  const p = DB.pedidos.find(x => x.id === id);
  if (!p || p.col === colId) return;
  p.col = colId;
  const notas = {
    aprovado:['Aguarda sinal','gray'], projeto:['Em projeto','gray'], producao:['Na fila de produção','gray'],
    instalacao:['Instalação a agendar','blue'], concluido:['Termo assinado','green'],
  };
  p.nota = notas[colId][0]; p.notaCor = notas[colId][1]; p.alerta = false;
  p.hist = p.hist || [];
  p.hist.unshift({ t:`Movido para ${colNome(colId)}`, quem:usuario().nome, quando:agora() });
  saveDB();
  if (rota().r === 'pedidos') desenhaKanban();
  renderNav(rota().r || 'painel'); renderNotif();
  if (!silencioso) toast(`Pedido #${id} movido para ${colNome(colId)}.`);
}

function abrirPedido(id){
  const p = DB.pedidos.find(x => x.id === id); if (!p) return;
  const idx = COLS.findIndex(c => c.id === p.col);
  const orc = DB.orcamentos.find(o => o.pedido === id);
  openDrawer(`
    <div class="drawer-head">
      <div><h3>#${p.id} · ${esc(p.cliente)}</h3><p>${esc(p.obra || '')}${p.cidade && p.cidade !== '—' ? ' · ' + esc(p.cidade) : ''}</p>
        <div style="margin-top:10px">${badgePedido(p)}</div></div>
      <button class="x-btn" data-close aria-label="Fechar">${ico('x')}</button>
    </div>
    <div class="drawer-body">
      <div class="stages">${COLS.map((c, i) => `<div class="stage ${i < idx ? 'done' : i === idx ? 'now' : ''}"><i></i>${c.nome}</div>`).join('')}</div>
      <div class="info-grid">
        <div><small>Produto</small><b>${esc(p.desc)}</b></div>
        <div><small>Linha</small><b>${esc(p.linha)}</b></div>
        <div><small>Valor</small><b class="num">${brl(p.valor || 0)}</b></div>
        <div><small>Responsável</small><b>${esc(EQUIPE[p.resp] || '—')}</b></div>
        <div><small>Situação</small><b>${esc(p.nota)}</b></div>
        <div><small>Origem</small><b>${orc ? `<a href="#/orcamentos/${esc(orc.id)}">${esc(orc.id)}</a>` : 'Pedido direto'}</b></div>
      </div>
      <div class="sub-title">Histórico</div>
      <ul class="timeline">${(p.hist || []).map((h, i) => `<li class="${i === 0 ? 'now' : ''}"><b>${esc(h.t)}</b><small>${esc(h.quem)} · ${esc(h.quando)}</small></li>`).join('')
        || '<li><b>Sem registros</b></li>'}</ul>
    </div>
    <div class="drawer-foot">
      ${idx > 0 ? `<button class="btn btn-outline" data-mv="${COLS[idx - 1].id}">${ico('undo')}Voltar etapa</button>` : ''}
      ${idx < COLS.length - 1 ? `<button class="btn btn-primary" data-mv="${COLS[idx + 1].id}">Avançar para ${COLS[idx + 1].nome}${ico('chevron')}</button>` : ''}
    </div>`, d => {
    $$('[data-mv]', d).forEach(b => b.addEventListener('click', () => { moverPedido(id, b.dataset.mv); abrirPedido(id); }));
    $$('a', d).forEach(a => a.addEventListener('click', closeDrawer));
  });
}

function modalNovoPedido(){
  openModal(`
    <h3>Novo pedido</h3>
    <p class="modal-sub">O pedido entra na coluna Aprovado, aguardando o sinal.</p>
    <div class="form-2col">
      <div><label for="np-cliente">Cliente</label><input id="np-cliente" placeholder="Nome do cliente"></div>
      <div><label for="np-obra">Obra</label><input id="np-obra" placeholder="Ex.: Escritório"></div>
    </div>
    <label for="np-desc">Descrição</label><input id="np-desc" placeholder="Ex.: 30 m² · Europrata 90 mm">
    <div class="form-2col">
      <div><label for="np-linha">Linha</label><select id="np-linha">${Object.keys(LINHAS).map(l => `<option>${l}</option>`).join('')}</select></div>
      <div><label for="np-valor">Valor (R$)</label><input id="np-valor" inputmode="numeric" placeholder="0"></div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-outline" data-close>Cancelar</button>
      <button class="btn btn-primary" id="np-criar">Criar pedido</button>
    </div>`, m => $('#np-criar', m).addEventListener('click', () => {
    const cliente = $('#np-cliente').value.trim();
    $('#np-cliente').classList.toggle('invalid', !cliente);
    if (!cliente) return;
    const id = Math.max(...DB.pedidos.map(p => p.id)) + 1;
    DB.pedidos.unshift({
      id, cliente, obra:$('#np-obra').value.trim() || '—', cidade:'—', desc:$('#np-desc').value.trim() || 'A detalhar',
      linha:$('#np-linha').value, col:'aprovado', nota:'Aguarda sinal', notaCor:'gray',
      valor:Math.round(num(String($('#np-valor').value).replace(/\./g, ''))), resp:'VA',
      hist:[{ t:'Pedido criado', quem:usuario().nome, quando:agora() }],
    });
    saveDB(); closeModal(); viewPedidos(); renderNav('pedidos');
    toast(`Pedido #${id} criado.`);
  }));
}

/* ============================================================
   PROJETOS
============================================================ */
let filtroProj = '';
function viewProjetos(){
  setHeader('Projetos', '[Cliente] · Sede administrativa · Pedido #1044');
  $('#topbar-actions').innerHTML = searchField('busca-proj', 'Buscar', 'Documento ou tipo', filtroProj)
    + `<button class="btn btn-primary" id="btn-arquivo">${ico('upload')}Enviar arquivo</button>`;
  $('#busca-proj').addEventListener('input', e => { filtroProj = e.target.value; desenhaArquivos(); });

  $('#content').innerHTML = `
    <div class="grid-75">
      <div class="card card-pad">
        <div class="card-head"><h3>Arquivos da obra</h3><small id="arq-count"></small></div>
        <div id="arq-tabela"></div>
        <button class="btn btn-outline" style="margin-top:18px" id="btn-base">Usar como base de novo orçamento</button>
      </div>
      <div class="card card-pad">
        <h3 style="margin-bottom:16px">Histórico de revisões</h3>
        <ul class="timeline">${DB.histProjeto.map((h, i) => `<li class="${i === 0 ? 'now' : ''}"><b>${esc(h.t)}</b><small>${esc(h.quem)} · ${esc(h.quando)}</small></li>`).join('')}</ul>
      </div>
    </div>`;
  desenhaArquivos();

  $('#btn-base').addEventListener('click', () => { location.hash = '#/orcamentos/ORC-2284'; });
  $('#btn-arquivo').addEventListener('click', () => openModal(`
    <h3>Enviar arquivo</h3>
    <p class="modal-sub">O arquivo entra na obra como "Em verificação" e aparece no histórico.</p>
    <label for="ar-doc">Nome do documento</label><input id="ar-doc" placeholder="Ex.: Detalhamento de portas">
    <div class="form-2col">
      <div><label for="ar-tipo">Tipo</label><select id="ar-tipo"><option>PDF</option><option>DWG</option><option>Fotos</option><option>XLSX</option></select></div>
      <div><label for="ar-rev">Revisão</label><input id="ar-rev" value="R01"></div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-outline" data-close>Cancelar</button>
      <button class="btn btn-primary" id="ar-ok">${ico('upload')}Enviar</button>
    </div>`, m => $('#ar-ok', m).addEventListener('click', () => {
    const doc = $('#ar-doc').value.trim();
    $('#ar-doc').classList.toggle('invalid', !doc);
    if (!doc) return;
    const rev = $('#ar-rev').value.trim() || 'R01';
    DB.arquivos.unshift({ doc, tipo:$('#ar-tipo').value, rev, sit:'Em verificação', cor:'cyan' });
    DB.histProjeto.unshift({ t:`${doc} ${rev} enviado para verificação`, quem:usuario().nome, quando:agora() });
    saveDB(); closeModal(); viewProjetos();
    toast('Arquivo enviado para verificação.', 'upload');
  })));
}
function desenhaArquivos(){
  const f = filtroProj.trim().toLowerCase();
  const lista = DB.arquivos.filter(a => !f || (a.doc + ' ' + a.tipo).toLowerCase().includes(f));
  $('#arq-count').textContent = `${lista.length} ${lista.length === 1 ? 'documento' : 'documentos'}`;
  $('#arq-tabela').innerHTML = lista.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>Documento</th><th>Tipo</th><th>Revisão</th><th>Situação</th></tr></thead>
      <tbody>${lista.map(a => `
        <tr><td><div class="doc-cell"><span class="file-ico">${ico('file')}</span>${esc(a.doc)}</div></td>
          <td class="td-muted">${esc(a.tipo)}</td><td>${esc(a.rev)}</td>
          <td><span class="badge ${a.cor}">${esc(a.sit)}</span></td></tr>`).join('')}
      </tbody></table></div>`
    : `<div class="empty">${ico('inbox')}<div>Nenhum documento encontrado.</div></div>`;
}

/* ============================================================
   VERIFICAÇÃO
============================================================ */
function viewVerificacao(){
  const v = DB.verif;
  const total = DB.checklist.length, ok = DB.checklist.filter(i => i.ok).length;
  const tudoOk = ok === total;
  const diverg = DB.checklist.find(i => i.diverg);
  setHeader('Verificação de projeto', 'Projeto executivo R01 · [Cliente] · Sede administrativa');

  if (v.status === 'andamento'){
    $('#topbar-actions').innerHTML = `
      <button class="btn btn-outline" id="btn-devolver">${ico('undo')}Devolver ao projetista</button>
      <button class="btn btn-primary" id="btn-liberar" ${tudoOk ? '' : 'disabled title="Confira todos os itens do checklist"'}>Liberar para produção</button>`;
  }

  const etapa = { andamento:2, devolvido:1, liberado:4 }[v.status];
  const passo = (n, titulo, sub) => {
    const cls = n < etapa ? 'done' : n === etapa ? 'now' : '';
    return `<div class="step ${cls}"><div class="step-n">${n < etapa ? ico('check') : n}</div><div><b>${titulo}</b><small>${sub}</small></div></div>`;
  };

  $('#content').innerHTML = `
    <div class="card stepper">
      ${passo(1, 'Projetista', v.status === 'devolvido' ? 'Ajustando o projeto' : 'Enviou em 14/11')}
      ${passo(2, 'Revisor técnico', v.status === 'andamento' ? 'Em andamento' : v.status === 'devolvido' ? 'Devolvido com observação' : 'Conferido')}
      ${passo(3, 'Cliente', 'Aceite digital')}
      ${passo(4, 'Produção', v.status === 'liberado' ? 'Projeto recebido' : 'Recebe o projeto liberado')}
    </div>
    <div class="grid-75">
      <div class="card card-pad">
        <div class="card-head"><h3>Checklist técnico</h3><small>${ok} de ${total} conferidos</small></div>
        ${DB.checklist.map((i, idx) => `
          <label class="chk-row ${i.diverg && !i.ok ? 'diverg' : ''}">
            <input type="checkbox" data-idx="${idx}" ${i.ok ? 'checked' : ''} ${v.status !== 'andamento' ? 'disabled' : ''}>
            <span>${esc(i.t)}</span>
            ${i.diverg && !i.ok ? '<span class="badge amber">Divergência</span>' : i.ok ? '<span class="badge green">OK</span>' : '<span class="badge gray">Pendente</span>'}
          </label>`).join('')}
      </div>
      <div class="card card-pad">
        ${v.status === 'liberado' ? `
          <h3>Projeto liberado</h3>
          <div class="resolved">${ico('check')}<span>Checklist completo. O pedido #1044 foi enviado para a produção.</span></div>
          <button class="btn btn-outline" style="margin-top:16px" id="btn-ver-ped">Ver pedido #1044</button>`
        : v.status === 'devolvido' ? `
          <h3>Devolvido ao projetista</h3>
          <p class="modal-sub" style="margin-top:8px">Observação enviada:</p>
          <div class="diverg-box" style="margin-top:8px;font-size:14px;line-height:1.5">${esc(v.obs)}</div>
          <button class="btn btn-primary" style="margin-top:16px" id="btn-reenviar">Simular reenvio do projetista (R02)</button>`
        : diverg && !diverg.ok ? `
          <h3>Divergência encontrada</h3>
          <div class="diverg-vals">
            <div class="diverg-box"><small>No projeto</small><div class="dv num">4,20 m</div></div>
            <div class="diverg-box"><small>Medido na obra</small><div class="dv num">4,12 m</div></div>
          </div>
          <div class="diverg-diff">Diferença de 8 cm na parede B</div>
          <label for="v-obs">Observação para o projetista</label>
          <textarea id="v-obs" rows="4" placeholder="Descreva o ajuste necessário">${esc(v.obs)}</textarea>
          <a href="#/projetos" style="display:inline-block;margin-top:12px;font-size:14px;font-weight:500">Ver medição técnica e fotos</a>`
        : `
          <h3>Sem divergências</h3>
          <div class="resolved">${ico('check')}<span>Todos os itens conferidos. O projeto pode ser liberado para produção.</span></div>`}
      </div>
    </div>`;

  $$('.chk-row input').forEach(ch => ch.addEventListener('change', () => {
    DB.checklist[+ch.dataset.idx].ok = ch.checked; saveDB(); viewVerificacao();
  }));
  const obs = $('#v-obs');
  if (obs) obs.addEventListener('input', () => { v.obs = obs.value; saveDB(); });

  const dev = $('#btn-devolver');
  if (dev) dev.addEventListener('click', () => {
    if (!v.obs.trim()){
      if (obs){ obs.classList.add('invalid'); obs.focus(); }
      toast('Escreva a observação para o projetista antes de devolver.', 'alert');
      return;
    }
    v.status = 'devolvido'; saveDB();
    DB.histProjeto.unshift({ t:'Projeto executivo R01 devolvido ao projetista', quem:usuario().nome, quando:agora() });
    saveDB(); render(); toast('Projeto devolvido ao projetista.', 'undo');
  });
  const lib = $('#btn-liberar');
  if (lib) lib.addEventListener('click', () => {
    v.status = 'liberado';
    const a = DB.arquivos.find(x => x.doc === 'Projeto executivo de divisórias');
    if (a){ a.sit = 'Aprovado'; a.cor = 'green'; }
    DB.histProjeto.unshift({ t:'Projeto executivo liberado para produção', quem:usuario().nome, quando:agora() });
    saveDB();
    moverPedido(1044, 'producao', true);
    render(); toast('Projeto liberado. Pedido #1044 foi para a produção.');
  });
  const rv = $('#btn-reenviar');
  if (rv) rv.addEventListener('click', () => {
    v.status = 'andamento'; v.obs = '';
    DB.checklist.forEach(i => { i.ok = true; });
    DB.histProjeto.unshift({ t:'Projeto executivo R02 reenviado com a parede B corrigida', quem:'Projetista', quando:agora() });
    saveDB(); render(); toast('Projetista reenviou o projeto corrigido (R02).', 'file');
  });
  const vp = $('#btn-ver-ped');
  if (vp) vp.addEventListener('click', () => { location.hash = '#/pedidos'; setTimeout(() => abrirPedido(1044), 50); });
}

/* ============================================================
   PRODUÇÃO
============================================================ */
const ORDENS = {
  1041:{ etapa:'Corte de perfis',     prog:70, prazo:'22/11' },
  1040:{ etapa:'Têmpera (terceiro)',  prog:45, prazo:'25/11' },
  1047:{ etapa:'Aguardando sinal',    prog:0,  prazo:'A definir' },
  1048:{ etapa:'Compra de material',  prog:10, prazo:'28/11' },
};
function viewProducao(){
  setHeader('Produção', 'Ordens em andamento · dados ilustrativos');
  const ativos = DB.pedidos.filter(p => p.col === 'producao');
  const fila = DB.pedidos.filter(p => p.col === 'aprovado');
  const linha = (p, fila) => {
    const o = ORDENS[p.id] || { etapa: fila ? 'Aguardando projeto' : 'Fila de produção', prog: fila ? 0 : 5, prazo:'A programar' };
    return `<tr class="clickable" data-pedido="${p.id}"><td>#${p.id} · ${esc(p.cliente)}</td><td class="td-muted">${esc(p.desc)}</td><td>${esc(o.etapa)}</td>
      <td><div class="prog-cell"><div class="progress"><i style="width:${o.prog}%"></i></div><small class="num">${o.prog}%</small></div></td>
      <td class="td-muted">${esc(o.prazo)}</td></tr>`;
  };
  $('#content').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="kpi-label">Em produção</div><div class="kpi-value num">${ativos.length}</div><div class="kpi-delta">ordens abertas</div></div>
      <div class="card kpi"><div class="kpi-label">Na fila</div><div class="kpi-value num">${fila.length}</div><div class="kpi-delta">pedidos aprovados</div></div>
      <div class="card kpi"><div class="kpi-label">Prazo médio</div><div class="kpi-value num">6 dias</div><div class="kpi-delta">do projeto liberado à expedição</div></div>
      <div class="card kpi kpi-dark"><div class="kpi-label">Entregas no prazo</div><div class="kpi-value num">94%</div><div class="kpi-delta">últimos 30 dias</div></div>
    </div>
    <div class="card card-pad">
      <div class="card-head"><h3>Ordens de produção</h3><small>Clique para ver o pedido</small></div>
      ${ativos.length + fila.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Pedido</th><th>Item</th><th>Etapa atual</th><th>Avanço</th><th>Previsão</th></tr></thead>
        <tbody>${ativos.map(p => linha(p, false)).join('')}${fila.map(p => linha(p, true)).join('')}</tbody>
      </table></div>` : `<div class="empty">${ico('inbox')}<div>Nenhuma ordem em andamento.</div></div>`}
    </div>`;
  $$('[data-pedido]').forEach(r => r.addEventListener('click', () => abrirPedido(+r.dataset.pedido)));
}

/* ============================================================
   INSTALAÇÃO
============================================================ */
function viewInstalacao(){
  setHeader('Instalação', 'Agenda das equipes · dados ilustrativos');
  const dias = [];
  AGENDA.forEach(a => { let d = dias.find(x => x.data === a.data); if (!d){ d = { data:a.data, dia:a.dia, itens:[] }; dias.push(d); } d.itens.push(a); });
  $('#content').innerHTML = dias.map(d => `
    <div class="day-group">
      <div class="day-title">${d.dia} · ${d.data}</div>
      <div class="card">${d.itens.map(a => `
        <div class="agenda-row clickable" data-pedido="${a.pedido}" style="cursor:pointer">
          <div class="agenda-time num">${a.hora}</div>
          <div><b>#${a.pedido} · ${esc(a.cliente)} · ${esc(a.obra)}</b>
            <small>${a.cor === 'amber' ? `<span class="knote amber">${esc(a.obs)}</span>` : esc(a.obs)}</small></div>
          <div class="team"><div class="avatars">${a.pessoas.map(x => `<span class="avatar sm">${x}</span>`).join('')}</div>${a.equipe}</div>
        </div>`).join('')}
      </div>
    </div>`).join('');
  $$('[data-pedido]').forEach(r => r.addEventListener('click', () => abrirPedido(+r.dataset.pedido)));
}

/* ============================================================
   CLIENTES E OBRAS
============================================================ */
let filtroCli = '';
function viewClientes(){
  setHeader('Clientes e obras', 'Carteira ativa · dados ilustrativos');
  $('#topbar-actions').innerHTML = searchField('busca-cli', 'Buscar', 'Cliente, obra ou cidade', filtroCli);
  $('#busca-cli').addEventListener('input', e => { filtroCli = e.target.value; desenhaClientes(); });
  $('#content').innerHTML = `<div class="card card-pad"><div class="card-head"><h3>Carteira de clientes</h3><small id="cli-count"></small></div><div id="cli-tabela"></div></div>`;
  desenhaClientes();
}
function desenhaClientes(){
  const mapa = {};
  DB.pedidos.forEach(p => {
    const c = mapa[p.cliente] || (mapa[p.cliente] = { nome:p.cliente, obras:new Set(), cidade:p.cidade, pedidos:[], valor:0 });
    if (p.obra && p.obra !== '—') c.obras.add(p.obra);
    if (c.cidade === '—' && p.cidade) c.cidade = p.cidade;
    c.pedidos.push(p); c.valor += p.valor || 0;
  });
  const f = filtroCli.trim().toLowerCase();
  const lista = Object.values(mapa)
    .filter(c => !f || [c.nome, c.cidade, ...c.obras].join(' ').toLowerCase().includes(f))
    .sort((a, b) => b.valor - a.valor);
  $('#cli-count').textContent = `${lista.length} ${lista.length === 1 ? 'cliente' : 'clientes'}`;
  $('#cli-tabela').innerHTML = lista.length ? `
    <div class="table-wrap"><table>
      <thead><tr><th>Cliente</th><th>Obra</th><th>Cidade</th><th class="r">Pedidos</th><th class="r">Valor total</th><th>Situação</th></tr></thead>
      <tbody>${lista.map(c => {
        const ativo = c.pedidos.find(p => p.col !== 'concluido');
        const ref = ativo || c.pedidos[0];
        return `<tr class="clickable" data-pedido="${ref.id}">
          <td>${esc(c.nome)}</td><td class="td-muted">${esc([...c.obras].join(', ') || '—')}</td><td class="td-muted">${esc(c.cidade || '—')}</td>
          <td class="r num">${c.pedidos.length}</td><td class="r num">${brl(c.valor)}</td>
          <td>${ativo ? badgePedido(ativo) : '<span class="badge green">Concluído</span>'}</td></tr>`; }).join('')}
      </tbody></table></div>`
    : `<div class="empty">${ico('inbox')}<div>Nenhum cliente encontrado.</div></div>`;
  $$('#cli-tabela [data-pedido]').forEach(r => r.addEventListener('click', () => abrirPedido(+r.dataset.pedido)));
}

/* ============================================================
   INICIALIZAÇÃO
============================================================ */
const VIEWS = {
  painel:viewPainel, orcamentos:viewOrcamentos, pedidos:viewPedidos, projetos:viewProjetos,
  verificacao:viewVerificacao, producao:viewProducao, instalacao:viewInstalacao, clientes:viewClientes,
};
render();
