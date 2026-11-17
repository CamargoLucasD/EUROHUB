/* EuroHub — área de Projetos (arquitetos e projetistas).
   Depende de app.js. Unidade de desenho: milímetros. Eixo Y do modelo cresce para baixo;
   para o usuário, Y é mostrado como no CAD (para cima), ou seja Y_tela = -y_modelo.
   Arquivos enviados ficam só no navegador de quem enviou (IndexedDB). */
'use strict';

Object.assign(PATHS, {
  pointer:'<path d="M4 4l7 17 2.5-7.5L21 11z"/>',
  wall:'<path d="M5 19 19 5"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/>',
  door:'<path d="M3 21h18"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M14 12h.01"/>',
  eraser:'<path d="m7 21-4-4a2 2 0 0 1 0-2.8L13.2 4a2 2 0 0 1 2.8 0L21 9a2 2 0 0 1 0 2.8L11 21z"/><path d="M22 21H7M5 11l9 9"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  comment:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  plan:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9V3M12 12v9"/>',
  elev:'<path d="M3 21h18"/><rect x="4" y="5" width="7" height="16"/><rect x="13" y="5" width="7" height="16"/><path d="M4 15h7"/>',
  fit:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  split:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M12 2v20"/>',
  flip:'<path d="M12 3v18"/><path d="M16 7l4 5-4 5M8 7l-4 5 4 5"/>',
});

/* ============================================================
   CONSTANTES E UTILITÁRIOS
============================================================ */
const FASES = [
  { id:'levantamento', nome:'Levantamento',      desc:'Medição e briefing' },
  { id:'estudo',       nome:'Estudo preliminar', desc:'Layout e conceito' },
  { id:'executivo',    nome:'Projeto executivo', desc:'Detalhamento' },
  { id:'verificacao',  nome:'Verificação',       desc:'Revisão técnica' },
  { id:'aprovado',     nome:'Aprovado',          desc:'Liberado para produção' },
];
const FASE_COR = { levantamento:'gray', estudo:'cyan', executivo:'navy', verificacao:'amber', aprovado:'green' };
const faseNome = id => (FASES.find(f => f.id === id) || {}).nome || id;

const TIPOS_PAREDE = {
  misto:     { nome:'Divisória mista',     cor:'#132a63', esp:90  },
  vidro:     { nome:'Divisória de vidro',  cor:'#1ba6cf', esp:60  },
  cego:      { nome:'Painel cego',         cor:'#56658f', esp:90  },
  alvenaria: { nome:'Alvenaria existente', cor:'#a3abb8', esp:150 },
};
const TIPOS_MODULO = { vidro:'Vidro', cego:'Painel cego', misto:'Misto (cego + vidro)' };
const ELEV_PADRAO = { modMax:1200, travessa:1100, rodape:100, portaAlt:2100 };
const DESC_PERFIL = 40, PERFIL = 40, BARRA = 6000;
const SIT_ARQ = {
  elaboracao:  { nome:'Em elaboração',  cor:'gray'  },
  verificacao: { nome:'Em verificação', cor:'cyan'  },
  aprovado:    { nome:'Aprovado',       cor:'green' },
  arquivado:   { nome:'Arquivado',      cor:'gray'  },
};
const GEN_EXT = { planta:'SVG', executivo:'PDF', memorial:'PDF', proposta:'PDF', medicao:'FOTOS' };
const LIMITE_UPLOAD = 25 * 1024 * 1024;

const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const projetoPorId = id => DB.projetos.find(p => p.id === id);
const projetoDoPedido = id => DB.projetos.find(p => p.pedido === id);
const r1 = n => Math.round(n * 10) / 10;
const fmm = n => fmt(Math.round(n));                                  /* 26.700 */
const cotaTxt = n => String(Math.round(n));                           /* 4200 (padrão de desenho) */
const dec = n => String(r1(n)).replace('.', ',');                     /* 4200 ou 4200,5 */
const numPlano = v => { const x = parseFloat(String(v).trim().replace(/\s/g, '').replace(',', '.')); return isFinite(x) ? x : NaN; };
function fmtBytes(n){ if (!n) return '—'; if (n < 1024) return n + ' B'; if (n < 1048576) return fmt(n / 1024) + ' KB'; return fmt(n / 1048576, 1) + ' MB'; }
function proximaRev(r){
  const m = /^(\D*)(\d+)$/.exec(r || '');
  if (!m) return 'R01';
  return m[1] + String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0');
}
function extDe(ver){ return ver.ext ? ver.ext.toUpperCase() : (GEN_EXT[ver.gen] || 'ARQ'); }
function extClasse(ver){
  if (ver.gen === 'medicao') return 'fot';
  if (ver.gen === 'planta') return 'svg';
  const e = (ver.ext || (GEN_EXT[ver.gen] || '')).toLowerCase();
  if (e === 'pdf') return 'pdf';
  if (['dwg','dxf','skp','rvt','ifc'].includes(e)) return 'dwg';
  if (['png','jpg','jpeg','gif','webp','svg','bmp'].includes(e)) return 'img';
  if (['xls','xlsx','csv','ods'].includes(e)) return 'xls';
  return '';
}
function categoriaDeExt(e){
  e = (e || '').toLowerCase();
  if (['dwg','dxf','skp','rvt','ifc'].includes(e)) return 'Planta';
  if (['png','jpg','jpeg','gif','webp','heic','bmp'].includes(e)) return 'Foto';
  if (e === 'svg') return 'Imagem';
  if (['xls','xlsx','csv','ods'].includes(e)) return 'Planilha';
  if (e === 'pdf') return 'Documento';
  return 'Outro';
}
function registrar(proj, t, quem){
  proj.hist.unshift({ t, quem: quem || usuario().nome, quando: agora() });
  proj.atualizado = hoje();
}
function baixarBlob(blob, nome){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ============================================================
   ARMAZENAMENTO DE ARQUIVOS (IndexedDB, com reserva em memória)
============================================================ */
const FileStore = (() => {
  let dbp = null; const mem = {};
  function abrir(){
    if (!dbp) dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('eurohub-arquivos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('blobs');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  async function tx(modo, fn){
    const db = await abrir();
    return new Promise((res, rej) => {
      const t = db.transaction('blobs', modo); const st = t.objectStore('blobs');
      const rq = fn(st);
      t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error);
    });
  }
  const limite = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tempo')), ms))]);
  return {
    async put(id, blob){ mem[id] = blob; limite(tx('readwrite', st => st.put(blob, id)), 4000).catch(() => {}); },
    async get(id){ if (mem[id]) return mem[id]; try { return (await limite(tx('readonly', st => st.get(id)), 3000)) || null; } catch (e) { return null; } },
    async clear(){ Object.keys(mem).forEach(k => delete mem[k]); limite(tx('readwrite', st => st.clear()), 3000).catch(() => {}); },
  };
})();

const seletorArquivo = document.createElement('input');
seletorArquivo.type = 'file'; seletorArquivo.hidden = true;
document.body.appendChild(seletorArquivo);
function pedirArquivos(multiplos, cb){
  seletorArquivo.multiple = !!multiplos; seletorArquivo.value = '';
  seletorArquivo.onchange = () => { const fs = Array.from(seletorArquivo.files || []); if (fs.length) cb(fs); };
  seletorArquivo.click();
}

/* ============================================================
   GEOMETRIA DA PLANTA (milímetros)
============================================================ */
const wallLen = w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
const anguloCAD = w => { let a = Math.atan2(-(w.y2 - w.y1), w.x2 - w.x1) * 180 / Math.PI; if (a < 0) a += 360; return a; };
function letras(plan){
  const m = {}; let i = 0;
  plan.walls.forEach(w => { if (w.tipo !== 'alvenaria') m[w.id] = String.fromCharCode(65 + (i++ % 26)); });
  return m;
}
function totaisPlanta(plan){
  const t = { total:0, porTipo:{}, portas:plan.doors.length };
  plan.walls.forEach(w => {
    if (w.tipo === 'alvenaria') return;
    const l = wallLen(w); t.total += l; t.porTipo[w.tipo] = (t.porTipo[w.tipo] || 0) + l;
  });
  return t;
}
function bounds(plan){
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  plan.walls.forEach(w => { x1 = Math.min(x1, w.x1, w.x2); y1 = Math.min(y1, w.y1, w.y2); x2 = Math.max(x2, w.x1, w.x2); y2 = Math.max(y2, w.y1, w.y2); });
  if (!isFinite(x1)) return { x:0, y:-8000, w:12000, h:8000 };
  return { x:x1, y:y1, w:Math.max(x2 - x1, 1000), h:Math.max(y2 - y1, 1000) };
}
function projSeg(p, w){
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy;
  let t = L2 ? ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return { t, d: Math.hypot(p.x - (w.x1 + t * dx), p.y - (w.y1 + t * dy)), x:w.x1 + t * dx, y:w.y1 + t * dy };
}
function doorGeo(plan, d){
  const w = plan.walls.find(x => x.id === d.wall); if (!w) return null;
  const L = wallLen(w); if (!L) return null;
  const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L, lado = d.lado || 1, nx = -uy * lado, ny = ux * lado, dw = d.w || 800;
  const cx = w.x1 + ux * L * d.t, cy = w.y1 + uy * L * d.t;
  const p0 = { x:cx - ux * dw / 2, y:cy - uy * dw / 2 }, p1 = { x:cx + ux * dw / 2, y:cy + uy * dw / 2 };
  const piv = d.inv ? p1 : p0, out = d.inv ? p0 : p1;
  const q = { x:piv.x + nx * dw, y:piv.y + ny * dw };
  const sweep = (lado * (d.inv ? -1 : 1)) > 0 ? 1 : 0;
  return { w, L, cx, cy, p0, p1, piv, out, q, dw, sweep };
}

/* Cota alinhada estilo CAD. off > 0 fica do lado oposto à abertura padrão das portas. */
function cotaSVG(x1, y1, x2, y2, off, txt, fs, cor, bg, tag){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return '';
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = uy, ny = -ux, s = off >= 0 ? 1 : -1;
  const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
  const g = fs * 0.3, ov = fs * 0.45, sw = r1(fs * 0.075), t = fs * 0.38;
  const ln = (a, b, c, d, w) => `<line x1="${r1(a)}" y1="${r1(b)}" x2="${r1(c)}" y2="${r1(d)}" stroke="${cor}" stroke-width="${w || sw}"/>`;
  let o = ln(x1 + nx * g * s, y1 + ny * g * s, ax + nx * ov * s, ay + ny * ov * s)
        + ln(x2 + nx * g * s, y2 + ny * g * s, bx + nx * ov * s, by + ny * ov * s)
        + ln(ax - ux * ov * 0.6, ay - uy * ov * 0.6, bx + ux * ov * 0.6, by + uy * ov * 0.6);
  const kx = (ux + nx * s) / Math.SQRT2 * t, ky = (uy + ny * s) / Math.SQRT2 * t;
  o += ln(ax - kx, ay - ky, ax + kx, ay + ky, r1(fs * 0.16)) + ln(bx - kx, by - ky, bx + kx, by + ky, r1(fs * 0.16));
  let ang = Math.atan2(uy, ux) * 180 / Math.PI; if (ang >= 89.99) ang -= 180; if (ang < -90.01) ang += 180;
  const mx = (ax + bx) / 2 + nx * fs * 0.62 * s, my = (ay + by) / 2 + ny * fs * 0.62 * s;
  o += `<text transform="translate(${r1(mx)} ${r1(my)}) rotate(${r1(ang)})" font-size="${r1(fs)}" fill="${cor}" text-anchor="middle" dominant-baseline="middle" stroke="${bg}" stroke-width="${r1(fs * 0.28)}" paint-order="stroke">${txt}</text>`;
  if (tag){
    const tx = ax - ux * fs * 1.5, ty = ay - uy * fs * 1.5;
    o += `<circle cx="${r1(tx)}" cy="${r1(ty)}" r="${r1(fs * 0.8)}" fill="${bg}" stroke="${cor}" stroke-width="${r1(fs * 0.1)}"/>`
      + `<text x="${r1(tx)}" y="${r1(ty)}" font-size="${r1(fs * 0.95)}" font-weight="700" fill="${cor}" text-anchor="middle" dominant-baseline="central">${tag}</text>`;
  }
  return o;
}

/* Montantes e batentes vistos de cima: um trecho curto sobre a parede em cada limite de módulo. */
function montantesPlanta(plan, w, minimo){
  const L = wallLen(w); if (L < 1 || w.tipo === 'alvenaria') return [];
  const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L, larg = Math.max(PERFIL, minimo || 0);
  const mods = modulosParede(plan, w, elevCfg({}, w)), out = [];
  for (let i = 0; i <= mods.length; i++){
    const x = i === mods.length ? L : mods[i].x, c = Math.min(Math.max(x, larg / 2), L - larg / 2);
    const esq = mods[i - 1], dir = mods[i];
    out.push({ x1:w.x1 + ux * (c - larg / 2), y1:w.y1 + uy * (c - larg / 2), x2:w.x1 + ux * (c + larg / 2), y2:w.y1 + uy * (c + larg / 2),
               porta:!!((esq && esq.tipo === 'porta') || (dir && dir.tipo === 'porta')) });
  }
  return out;
}
function planMarkup(plan, o){
  o = o || {};
  const L = letras(plan), fs = o.fs || 240, bgc = o.bgc || '#fff';
  const ln = (w, extra) => `<line x1="${r1(w.x1)}" y1="${r1(w.y1)}" x2="${r1(w.x2)}" y2="${r1(w.y2)}" ${extra}/>`;
  let s = '';
  const sel = o.sel && o.sel.kind === 'wall' ? plan.walls.find(x => x.id === o.sel.id) : null;
  if (sel) s += ln(sel, `stroke="#53d4f0" stroke-opacity=".45" stroke-width="${TIPOS_PAREDE[sel.tipo].esp + fs * 0.9}" stroke-linecap="round"`);
  const ordem = plan.walls.filter(w => w.tipo === 'alvenaria').concat(plan.walls.filter(w => w.tipo !== 'alvenaria'));
  ordem.forEach(w => {
    const t = TIPOS_PAREDE[w.tipo] || TIPOS_PAREDE.misto;
    s += ln(w, `stroke="${t.cor}" stroke-width="${t.esp}" stroke-linecap="square"`);
    if (w.tipo === 'vidro') s += ln(w, `stroke="#fff" stroke-width="${t.esp * 0.35}"`);
    if (w.tipo === 'misto') s += ln(w, `stroke="#53d4f0" stroke-width="${t.esp * 0.3}" stroke-dasharray="300 300"`);
  });
  plan.doors.forEach(d => {
    const g = doorGeo(plan, d); if (!g) return;
    const esp = (TIPOS_PAREDE[g.w.tipo] || { esp:90 }).esp;
    const on = o.sel && o.sel.kind === 'door' && o.sel.id === d.id, cor = on ? '#0b8fb3' : '#132a63';
    s += `<line x1="${r1(g.p0.x)}" y1="${r1(g.p0.y)}" x2="${r1(g.p1.x)}" y2="${r1(g.p1.y)}" stroke="${bgc}" stroke-width="${esp + 30}"/>`
      + `<path d="M${r1(g.out.x)} ${r1(g.out.y)} A${g.dw} ${g.dw} 0 0 ${g.sweep} ${r1(g.q.x)} ${r1(g.q.y)}" fill="none" stroke="${on ? '#0b8fb3' : '#7b8596'}" stroke-width="${r1(Math.max(g.dw / 70, fs * 0.06))}" stroke-dasharray="${r1(g.dw / 14)} ${r1(g.dw / 20)}"/>`
      + `<line x1="${r1(g.piv.x)}" y1="${r1(g.piv.y)}" x2="${r1(g.q.x)}" y2="${r1(g.q.y)}" stroke="${cor}" stroke-width="40"/>`;
  });
  if (o.perfis || (o.labels && o.perfis !== false)){
    plan.walls.forEach(w => montantesPlanta(plan, w, fs * 0.28).forEach(m => {
      const esp = (TIPOS_PAREDE[w.tipo] || { esp:90 }).esp;
      s += `<line x1="${r1(m.x1)}" y1="${r1(m.y1)}" x2="${r1(m.x2)}" y2="${r1(m.y2)}" stroke="${m.porta ? '#e08a1e' : '#0f1b40'}" stroke-width="${r1(esp + Math.max(40, fs * 0.35))}"/>`;
    }));
  }
  if (o.labels){
    plan.walls.forEach(w => {
      const len = wallLen(w); if (len < 1) return;
      if (w.tipo === 'alvenaria'){ if (o.alv !== false) s += cotaSVG(w.x1, w.y1, w.x2, w.y2, fs * 3.4, cotaTxt(len), fs * 0.9, '#8a93a3', bgc); return; }
      const ds = plan.doors.filter(d => d.wall === w.id);
      const lado = ds.length && ds.every(d => (d.lado || 1) < 0) ? -1 : 1;
      const hi = o.hi === w.id;
      s += cotaSVG(w.x1, w.y1, w.x2, w.y2, fs * 1.9 * lado, cotaTxt(len), fs, hi ? '#0b8fb3' : '#14337a', bgc, L[w.id]);
    });
  }
  if (sel){
    const g = fs * 0.42;
    [[sel.x1, sel.y1], [sel.x2, sel.y2], [(sel.x1 + sel.x2) / 2, (sel.y1 + sel.y2) / 2]].forEach(([x, y]) =>
      s += `<rect x="${r1(x - g)}" y="${r1(y - g)}" width="${r1(g * 2)}" height="${r1(g * 2)}" fill="#1f8fd6" stroke="#fff" stroke-width="${r1(fs * 0.08)}"/>`);
  }
  return s;
}
function planSVGString(plan, o){
  o = o || {};
  const b = bounds(plan), fs = o.fs || Math.max(b.w, b.h) / 55;
  const pad = o.labels ? fs * 6 : Math.max(b.w, b.h) * 0.04;
  const vb = `${r1(b.x - pad)} ${r1(b.y - pad)} ${r1(b.w + 2 * pad)} ${r1(b.h + 2 * pad)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" font-family="Roboto, Arial, sans-serif">`
    + (o.bg ? `<rect x="${r1(b.x - pad)}" y="${r1(b.y - pad)}" width="${r1(b.w + 2 * pad)}" height="${r1(b.h + 2 * pad)}" fill="${o.bgc || '#fff'}"/>` : '')
    + planMarkup(plan, Object.assign({}, o, { fs })) + '</svg>';
}

/* ============================================================
   ELEVAÇÕES, PEÇAS, PERFIS E ACESSÓRIOS
   Cada parede guarda em w.elev: altura, rodape, portaAlt, travessa, modMax,
   cortes (posições dos montantes, em mm a partir do início) e attr (tipo e travessa por módulo,
   indexados pela posição inicial do módulo). Sem cortes definidos, a modulação é automática.
============================================================ */
function elevCfg(proj, w){ return Object.assign({}, ELEV_PADRAO, { altura: Number(proj.pedireito) || 2800 }, w.elev || {}); }
function portasDaParede(plan, w){
  const L = wallLen(w);
  return plan.doors.filter(d => d.wall === w.id).map(d => {
    const dw = d.w || 800, c = d.t * L; return { a:Math.max(0, c - dw / 2), b:Math.min(L, c + dw / 2), d };
  }).sort((x, y) => x.a - y.a);
}
function cortesAuto(plan, w, cfg){
  const L = wallLen(w), cs = []; let x = 0;
  const preencher = (a, b) => {
    const span = b - a; if (span < 1) return;
    const n = Math.max(1, Math.ceil(span / cfg.modMax - 1e-9)), base = Math.floor(span / n);
    for (let i = 1; i < n; i++) cs.push(Math.round(a + base * i));
  };
  portasDaParede(plan, w).forEach(p => { preencher(x, Math.max(x, p.a)); x = Math.max(x, p.b); });
  preencher(x, L);
  return cs;
}
function modulosParede(plan, w, cfg){
  const L = wallLen(w), portas = portasDaParede(plan, w), attr = cfg.attr || {};
  const emPorta = x => portas.some(p => x > p.a - 0.5 && x < p.b + 0.5);
  const bp = [0, L]; portas.forEach(p => bp.push(p.a, p.b));
  (cfg.cortes || cortesAuto(plan, w, cfg)).forEach(c => { if (c > 0.5 && c < L - 0.5 && !emPorta(c)) bp.push(c); });
  bp.sort((a, b) => a - b);
  const mods = []; let k = 0;
  for (let i = 0; i < bp.length - 1; i++){
    const a = bp[i], b = bp[i + 1]; if (b - a < 1) continue;
    const porta = portas.find(p => a >= p.a - 0.5 && b <= p.b + 0.5);
    if (porta) mods.push({ x:a, w:b - a, tipo:'porta', door:porta.d.id });
    else {
      const at = attr[String(Math.round(a))] || {};
      mods.push({ x:a, w:b - a, tipo:at.tipo || (w.tipo === 'alvenaria' ? 'cego' : w.tipo), trav:at.trav || cfg.travessa, idx:k++ });
    }
  }
  return mods;
}
/* Um limite entre dois módulos é um montante móvel quando nenhum dos lados é porta. */
function montantesMoveis(mods){
  const xs = [];
  for (let i = 1; i < mods.length; i++) if (mods[i].tipo !== 'porta' && mods[i - 1].tipo !== 'porta') xs.push(mods[i].x);
  return xs;
}
function pecasParede(proj, plan, w){
  const cfg = elevCfg(proj, w), H = cfg.altura, out = [], D = PERFIL;
  const add = (peca, l, a) => { if (l > 50 && a > 50) out.push({ peca, l:Math.round(l), a:Math.round(a) }); };
  modulosParede(plan, w, cfg).forEach(m => {
    if (m.tipo === 'porta'){
      add('Porta com ferragens', m.w - 20, Math.min(cfg.portaAlt, H));
      if (H - cfg.portaAlt - D > 100) add(w.tipo === 'cego' ? 'Painel cego' : 'Vidro temperado', m.w - D, H - cfg.portaAlt - D);
    } else if (m.tipo === 'vidro') add('Vidro temperado', m.w - D, H - cfg.rodape - D);
    else if (m.tipo === 'cego') add('Painel cego', m.w - D, H - cfg.rodape - D);
    else { add('Painel cego', m.w - D, m.trav - cfg.rodape - D / 2); add('Vidro temperado', m.w - D, H - m.trav - D / 2); }
  });
  return out;
}
function perfisParede(proj, plan, w){
  const cfg = elevCfg(proj, w), L = wallLen(w), H = cfg.altura, mods = modulosParede(plan, w, cfg), out = [];
  const add = (nome, c) => { if (c > 20) out.push({ nome, c:Math.round(c) }); };
  add('Guia superior', L);
  let run = 0;
  mods.forEach((m, i) => {
    if (m.tipo !== 'porta') run += m.w;
    if (m.tipo === 'porta' || i === mods.length - 1){ add('Guia inferior / rodapé', run); run = 0; }
  });
  for (let i = 0; i <= mods.length; i++){
    const esq = mods[i - 1], dir = mods[i];
    add((esq && esq.tipo === 'porta') || (dir && dir.tipo === 'porta') ? 'Montante de porta (batente)' : 'Montante', H - PERFIL);
  }
  mods.forEach(m => {
    if (m.tipo === 'misto') add('Travessa', m.w - PERFIL);
    if (m.tipo === 'porta' && H - cfg.portaAlt > 100) add('Travessa de porta', m.w);
  });
  return out;
}
function agrupa(lista, chave, cria){
  const mapa = {};
  lista.forEach(it => { const k = chave(it); (mapa[k] || (mapa[k] = cria(it))).q++; if (it.parede) mapa[k].paredes.add(it.parede); });
  return Object.values(mapa).map(i => Object.assign(i, { paredes:[...i.paredes].sort().join(', ') }));
}
function divisoriasDoProjeto(proj){ return proj.planta.walls.filter(w => w.tipo !== 'alvenaria'); }
function pecasProjeto(proj){
  const Ls = letras(proj.planta), todas = [];
  divisoriasDoProjeto(proj).forEach(w => pecasParede(proj, proj.planta, w).forEach(p => todas.push(Object.assign(p, { parede:Ls[w.id] }))));
  return agrupa(todas, p => `${p.peca}|${p.l}|${p.a}`, p => ({ peca:p.peca, l:p.l, a:p.a, q:0, paredes:new Set() }))
    .sort((a, b) => a.peca.localeCompare(b.peca) || b.a - a.a || b.l - a.l);
}
function barrasNecessarias(comprimentos){
  const pecas = [];
  comprimentos.forEach(c => { while (c > BARRA){ pecas.push(BARRA); c -= BARRA; } if (c > 0) pecas.push(c); });
  pecas.sort((a, b) => b - a);
  const sobras = [];
  pecas.forEach(c => { const i = sobras.findIndex(s => s >= c); if (i >= 0) sobras[i] -= c; else sobras.push(BARRA - c); });
  return { barras:sobras.length, sobra:sobras.reduce((s, v) => s + v, 0) };
}
function perfisProjeto(proj){
  const Ls = letras(proj.planta), todos = [];
  divisoriasDoProjeto(proj).forEach(w => perfisParede(proj, proj.planta, w).forEach(p => todos.push(Object.assign(p, { parede:Ls[w.id] }))));
  const corte = agrupa(todos, p => `${p.nome}|${p.c}`, p => ({ nome:p.nome, c:p.c, q:0, paredes:new Set() }))
    .sort((a, b) => a.nome.localeCompare(b.nome) || b.c - a.c);
  const nomes = [...new Set(todos.map(p => p.nome))].sort();
  const resumo = nomes.map(nome => {
    const cs = todos.filter(p => p.nome === nome).map(p => p.c), total = cs.reduce((s, v) => s + v, 0);
    return Object.assign({ nome, pecas:cs.length, total }, barrasNecessarias(cs));
  });
  return { corte, resumo };
}
function acessoriosProjeto(proj){
  const plan = proj.planta; let portas = 0, baguete = 0, gaxeta = 0, guias = 0, montantes = 0, travessas = 0;
  divisoriasDoProjeto(proj).forEach(w => {
    pecasParede(proj, plan, w).forEach(p => {
      if (p.peca === 'Vidro temperado'){ baguete += 2 * (p.l + p.a); gaxeta += 2 * (p.l + p.a); }
      if (p.peca === 'Porta com ferragens'){ portas++; gaxeta += p.l + 2 * p.a; }
    });
    perfisParede(proj, plan, w).forEach(p => {
      if (p.nome.startsWith('Guia')) guias += p.c;
      if (p.nome.startsWith('Montante')) montantes++;
      if (p.nome.startsWith('Travessa')) travessas++;
    });
  });
  return [
    { item:'Kit de porta (fechadura, 3 dobradiças e batente)', q:portas, un:'kit' },
    { item:'Baguete de fixação do vidro', q:Math.round(baguete), un:'mm', obs:`${Math.ceil(baguete / BARRA)} barras de 6 m` },
    { item:'Gaxeta de vedação', q:Math.round(gaxeta), un:'mm', obs:`${fmt(gaxeta / 1000, 1)} m` },
    { item:'Fixação das guias (bucha e parafuso a cada 500 mm)', q:Math.ceil(guias / 500), un:'un' },
    { item:'Sapata niveladora de montante', q:montantes, un:'un' },
    { item:'Cantoneira de união da travessa', q:travessas * 2, un:'un' },
  ].filter(a => a.q > 0);
}

/* Desenho da elevação. Coordenadas: x ao longo da parede, y = 0 no forro e y = H no piso. */
function elevMarkup(proj, plan, w, o){
  o = o || {};
  const cfg = elevCfg(proj, w), L = wallLen(w), H = cfg.altura, mods = modulosParede(plan, w, cfg), P = PERFIL;
  const fs = o.fs, nav = '#132a63', PF = '#3a4a80', sw = r1(fs * 0.07), sel = o.sel || null;
  const VID = '#dff3fa', CEG = '#d3d9e4', ROD = '#9aa6bd';
  const box = (x, y, w2, h, fill, st) => h > 0 && w2 > 0 ? `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w2)}" height="${r1(h)}" fill="${fill}"${st ? ` stroke="${st}" stroke-width="${sw}"` : ''}/>` : '';
  const vidro = (x, y, w2, h) => {
    const gx = x + w2 * 0.25, gy = y + h * 0.45, t = Math.min(w2, h) * 0.18;
    return box(x, y, w2, h, VID)
      + `<line x1="${r1(gx)}" y1="${r1(gy)}" x2="${r1(gx + t)}" y2="${r1(gy - t)}" stroke="#8fd3e8" stroke-width="${r1(fs * 0.12)}"/>`
      + `<line x1="${r1(gx + t * 0.6)}" y1="${r1(gy)}" x2="${r1(gx + t * 1.3)}" y2="${r1(gy - t * 0.7)}" stroke="#8fd3e8" stroke-width="${r1(fs * 0.08)}"/>`;
  };
  let s = `<line x1="${r1(-fs * 2)}" y1="0" x2="${r1(L + fs * 2)}" y2="0" stroke="#8a93a3" stroke-width="${sw}" stroke-dasharray="${r1(fs * 0.8)} ${r1(fs * 0.5)}"/>`;
  mods.forEach(m => {
    if (m.tipo === 'porta'){
      const top = Math.min(cfg.portaAlt, H);
      if (H - top > 1) s += w.tipo === 'cego' ? box(m.x, 0, m.w, H - top, CEG) : vidro(m.x, 0, m.w, H - top);
      s += box(m.x + P / 2, H - top, m.w - P, top, '#eef1f6', nav)
        + `<circle cx="${r1(m.x + m.w - P / 2 - fs * 0.9)}" cy="${r1(H - 1050)}" r="${r1(fs * 0.28)}" fill="${nav}"/>`
        + `<line x1="${r1(m.x + P / 2)}" y1="${r1(H - top)}" x2="${r1(m.x + m.w - P / 2)}" y2="${H}" stroke="#b7c0cf" stroke-width="${sw}" stroke-dasharray="${r1(fs * 0.5)} ${r1(fs * 0.4)}"/>`;
    } else {
      if (m.tipo === 'vidro') s += vidro(m.x, 0, m.w, H - cfg.rodape);
      else if (m.tipo === 'cego') s += box(m.x, 0, m.w, H - cfg.rodape, CEG);
      else s += vidro(m.x, 0, m.w, H - m.trav) + box(m.x, H - m.trav, m.w, m.trav - cfg.rodape, CEG);
      s += box(m.x, H - cfg.rodape, m.w, cfg.rodape, ROD);
    }
  });
  /* perfis */
  s += box(0, 0, L, P, PF);
  mods.forEach(m => {
    if (m.tipo === 'misto') s += box(m.x, H - m.trav - P / 2, m.w, P, sel && sel.kind === 'mod' && sel.x === Math.round(m.x) ? '#0b8fb3' : PF);
    if (m.tipo === 'porta' && H - cfg.portaAlt > 1) s += box(m.x, H - cfg.portaAlt - P / 2, m.w, P, PF);
  });
  for (let i = 0; i <= mods.length; i++){
    const x = i === mods.length ? L : mods[i].x;
    const on = sel && sel.kind === 'cut' && Math.abs(sel.x - x) < 0.6;
    s += box(i === 0 ? 0 : i === mods.length ? L - P : x - P / 2, 0, P, H, on ? '#0b8fb3' : PF);
  }
  s += `<rect x="0" y="0" width="${r1(L)}" height="${r1(H)}" fill="none" stroke="${nav}" stroke-width="${sw}"/>`;
  /* piso */
  s += `<line x1="${r1(-fs * 2.5)}" y1="${H}" x2="${r1(L + fs * 2.5)}" y2="${H}" stroke="#56616f" stroke-width="${r1(fs * 0.22)}"/>`;
  for (let x = -fs * 2.5; x < L + fs * 2.5; x += fs * 1.1)
    s += `<line x1="${r1(x)}" y1="${r1(H + fs * 0.1)}" x2="${r1(x - fs * 0.7)}" y2="${r1(H + fs * 0.8)}" stroke="#9aa3b2" stroke-width="${r1(sw * 0.8)}"/>`;
  /* seleção */
  if (sel && (sel.kind === 'mod' || sel.kind === 'door')){
    const m = mods.find(x => sel.kind === 'door' ? x.door === sel.id : x.tipo !== 'porta' && Math.round(x.x) === sel.x);
    if (m) s += `<rect x="${r1(m.x)}" y="0" width="${r1(m.w)}" height="${H}" fill="#53d4f0" fill-opacity=".2" stroke="#0b8fb3" stroke-width="${r1(fs * 0.14)}"/>`;
  }
  /* cotas */
  const C = (x1, y1, x2, y2, off, v) => cotaSVG(x1, y1, x2, y2, off, cotaTxt(v), fs, '#14337a', '#fff');
  mods.forEach(m => { s += C(m.x, 0, m.x + m.w, 0, fs * 1.6, m.w); });
  s += C(0, 0, L, 0, fs * 3.6, L);
  const ref = mods.find(m => sel && sel.kind === 'mod' && m.tipo === 'misto' && Math.round(m.x) === sel.x) || mods.find(m => m.tipo === 'misto');
  const zs = [0, cfg.rodape]; if (ref) zs.push(ref.trav); zs.push(H);
  for (let i = 0; i < zs.length - 1; i++) if (zs[i + 1] - zs[i] > 0) s += C(0, H - zs[i], 0, H - zs[i + 1], fs * 1.7, zs[i + 1] - zs[i]);
  s += C(0, H, 0, 0, fs * 3.7, H);
  const porta = mods.find(m => m.tipo === 'porta');
  if (porta) s += C(porta.x + porta.w, H, porta.x + porta.w, H - Math.min(cfg.portaAlt, H), -fs * 1.3, Math.min(cfg.portaAlt, H));
  /* alças */
  if (sel && o.alcas){
    const g = fs * 0.42, alca = (x, y) => `<rect x="${r1(x - g)}" y="${r1(y - g)}" width="${r1(g * 2)}" height="${r1(g * 2)}" fill="#1f8fd6" stroke="#fff" stroke-width="${r1(fs * 0.08)}"/>`;
    const moveis = montantesMoveis(mods);
    if (sel.kind === 'cut') s += alca(sel.x, H / 2);
    if (sel.kind === 'mod'){
      const m = mods.find(x => x.tipo !== 'porta' && Math.round(x.x) === sel.x);
      if (m){
        if (moveis.some(x => Math.abs(x - m.x) < 0.6)) s += alca(m.x, H / 2);
        if (moveis.some(x => Math.abs(x - (m.x + m.w)) < 0.6)) s += alca(m.x + m.w, H / 2);
        if (m.tipo === 'misto') s += alca(m.x + m.w / 2, H - m.trav);
      }
    }
    if (sel.kind === 'door'){ const m = mods.find(x => x.door === sel.id); if (m) s += alca(m.x + m.w / 2, H - Math.min(cfg.portaAlt, H) / 2); }
  }
  return s;
}
function elevSVG(proj, plan, w){
  const cfg = elevCfg(proj, w), L = wallLen(w), H = cfg.altura, fs = Math.max(L, H * 1.6) / 42;
  const vb = [-fs * 6.5, -fs * 5.5, L + fs * 10, H + fs * 7.5].map(r1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet" font-family="Roboto, Arial, sans-serif">`
    + `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>${elevMarkup(proj, plan, w, { fs })}</svg>`;
}

/* ============================================================
   DOCUMENTOS GERADOS (PDF e imagens da demonstração)
============================================================ */
function latin1(s){
  return String(s).replace(/[—–]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...')
    .replace(/[^\x00-\xff]/g, '?');
}
const pdfStr = s => latin1(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
function hexRGB(h){ const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(c => (c / 255).toFixed(3)).join(' '); }
function PDFPagina(){
  const ops = []; const n = v => (Math.round(v * 100) / 100);
  return {
    text(x, y, s, size, bold){ ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${n(x)} ${n(y)} Td (${pdfStr(s)}) Tj ET`); },
    textRot(cx, cy, s, size, bold, ang){
      const c = Math.cos(ang), si = Math.sin(ang), w = latin1(s).length * size * 0.5;
      const x = cx - c * w / 2 + si * size * 0.35, y = cy - si * w / 2 - c * size * 0.35;
      ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${n(c)} ${n(si)} ${n(-si)} ${n(c)} ${n(x)} ${n(y)} Tm (${pdfStr(s)}) Tj ET`);
    },
    line(x1, y1, x2, y2, w){ ops.push(`${w || 1} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`); },
    rect(x, y, w, h, lw){ ops.push(`${lw || 1} w ${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`); },
    fillRect(x, y, w, h){ ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`); },
    boxFill(x, y, w, h, lw){ ops.push(`${lw || 1} w ${n(x)} ${n(y)} ${n(w)} ${n(h)} re B`); },
    stroke(hex){ ops.push(hexRGB(hex) + ' RG'); },
    fill(hex){ ops.push(hexRGB(hex) + ' rg'); },
    dash(on){ ops.push(on ? '[3 2] 0 d' : '[] 0 d'); },
    out(){ return latin1(ops.join('\n')); },
  };
}
function pdfBlob(paginas, w, h){
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${paginas.map((_, i) => (5 + i * 2) + ' 0 R').join(' ')}] /Count ${paginas.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  paginas.forEach((c, i) => {
    const pn = 5 + i * 2;
    objs[pn] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pn + 1} 0 R >>`;
    objs[pn + 1] = `<< /Length ${c.length} >>\nstream\n${c}\nendstream`;
  });
  let out = '%PDF-1.4\n'; const offs = [];
  for (let i = 1; i < objs.length; i++){ offs[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
  return new Blob([bytes], { type:'application/pdf' });
}
function quebrar(texto, max){
  const linhas = []; let atual = '';
  String(texto).split(/\s+/).forEach(p => {
    if ((atual + ' ' + p).trim().length > max){ if (atual) linhas.push(atual); atual = p; }
    else atual = (atual + ' ' + p).trim();
  });
  if (atual) linhas.push(atual);
  return linhas;
}
/* Cota em PDF: recebe coordenadas do modelo e a função de mapeamento M. */
function pdfCota(pg, M, sc, x1, y1, x2, y2, offPt, txt, size, cor){
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 1) return;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = uy, ny = -ux, off = offPt / sc, s = off >= 0 ? 1 : -1;
  const g = 2 / sc, ov = 3 / sc, t = 2.6 / sc;
  const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
  const ln = (a, b, c, d, w) => pg.line(M.X(a), M.Y(b), M.X(c), M.Y(d), w);
  pg.stroke(cor || '#14337a');
  ln(x1 + nx * g * s, y1 + ny * g * s, ax + nx * ov * s, ay + ny * ov * s, 0.35);
  ln(x2 + nx * g * s, y2 + ny * g * s, bx + nx * ov * s, by + ny * ov * s, 0.35);
  ln(ax - ux * ov, ay - uy * ov, bx + ux * ov, by + uy * ov, 0.35);
  const kx = (ux + nx * s) / Math.SQRT2 * t, ky = (uy + ny * s) / Math.SQRT2 * t;
  ln(ax - kx, ay - ky, ax + kx, ay + ky, 0.9); ln(bx - kx, by - ky, bx + kx, by + ky, 0.9);
  let ang = Math.atan2(M.Y(by) - M.Y(ay), M.X(bx) - M.X(ax));
  if (ang > Math.PI / 2 + 0.01) ang -= Math.PI; if (ang <= -Math.PI / 2) ang += Math.PI;
  const mx = (ax + bx) / 2 + nx * (size * 0.85 / sc) * s, my = (ay + by) / 2 + ny * (size * 0.85 / sc) * s;
  pg.fill(cor || '#14337a'); pg.textRot(M.X(mx), M.Y(my), txt, size, false, ang);
}
function pdfCarimbo(pg, proj, ver, W, titulo, folha){
  const cx = W - 302, cy = 34, cw = 268, ch = 100;
  pg.stroke('#13214e'); pg.rect(cx, cy, cw, ch, 1);
  pg.line(cx, cy + 74, cx + cw, cy + 74, 0.6); pg.line(cx, cy + 24, cx + cw, cy + 24, 0.6); pg.line(cx + 134, cy, cx + 134, cy + 24, 0.6);
  pg.fill('#13214e'); pg.text(cx + 10, cy + 82, 'EUROFLEX DIVISÓRIAS', 11, true);
  pg.fill('#1f2b44'); pg.text(cx + 10, cy + 58, `${titulo} · ${proj.id}`.slice(0, 52), 8.5, true);
  pg.text(cx + 10, cy + 45, `${proj.nome}`.slice(0, 56), 8);
  pg.text(cx + 10, cy + 32, `${proj.cliente} · ${proj.obra}`.slice(0, 56), 8);
  pg.text(cx + 10, cy + 9, `Revisão ${ver.rev} · ${ver.data}`, 8, true);
  pg.text(cx + 144, cy + 9, `Medidas em mm · folha ${folha}`, 8);
}

function pdfExecutivo(proj, ver){
  const plan = ver.snap || proj.planta, W = 842, H = 595, paginas = [];
  const Ls = letras(plan), divs = plan.walls.filter(w => w.tipo !== 'alvenaria');
  const nElev = Math.max(1, Math.ceil(divs.length / 4)), total = 3 + nElev;

  /* Folha 1 — planta */
  let pg = PDFPagina();
  pg.stroke('#13214e'); pg.rect(20, 20, W - 40, H - 40, 1.2);
  pg.fill('#13214e'); pg.text(36, H - 48, 'PROJETO EXECUTIVO DE DIVISÓRIAS · PLANTA', 14, true);
  pg.fill('#56616f'); pg.text(36, H - 64, `${proj.cliente} · ${proj.obra} · ${proj.nome}`, 9.5);
  const area = { x:70, y:175, w:W - 140, h:H - 270 };
  const b = bounds(plan), sc = Math.min(area.w / b.w, area.h / b.h);
  const ox = area.x + (area.w - b.w * sc) / 2, oy = area.y + (area.h - b.h * sc) / 2;
  const M = { X:x => ox + (x - b.x) * sc, Y:y => oy + (b.h - (y - b.y)) * sc };
  plan.walls.forEach(w => {
    const t = TIPOS_PAREDE[w.tipo] || TIPOS_PAREDE.misto;
    pg.stroke(t.cor); pg.line(M.X(w.x1), M.Y(w.y1), M.X(w.x2), M.Y(w.y2), Math.max(t.esp * sc, 1));
  });
  plan.doors.forEach(d => {
    const g = doorGeo(plan, d); if (!g) return;
    pg.stroke('#ffffff'); pg.line(M.X(g.p0.x), M.Y(g.p0.y), M.X(g.p1.x), M.Y(g.p1.y), Math.max(150 * sc, 2.5));
    pg.stroke('#13214e'); pg.line(M.X(g.piv.x), M.Y(g.piv.y), M.X(g.q.x), M.Y(g.q.y), 1);
    pg.stroke('#7b8596'); pg.dash(true);
    const a0 = Math.atan2(g.out.y - g.piv.y, g.out.x - g.piv.x), a1 = Math.atan2(g.q.y - g.piv.y, g.q.x - g.piv.x);
    let da = a1 - a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    let px = g.out.x, py = g.out.y;
    for (let i = 1; i <= 8; i++){
      const a = a0 + da * i / 8, nx2 = g.piv.x + Math.cos(a) * g.dw, ny2 = g.piv.y + Math.sin(a) * g.dw;
      pg.line(M.X(px), M.Y(py), M.X(nx2), M.Y(ny2), 0.5); px = nx2; py = ny2;
    }
    pg.dash(false);
  });
  plan.walls.forEach(w => montantesPlanta(plan, w, 1.4 / sc).forEach(m => {
    pg.stroke(m.porta ? '#e08a1e' : '#0f1b40');
    pg.line(M.X(m.x1), M.Y(m.y1), M.X(m.x2), M.Y(m.y2), Math.max((TIPOS_PAREDE[w.tipo].esp + 60) * sc, 3.4));
  }));
  plan.walls.forEach(w => {
    const len = wallLen(w); if (len < 1) return;
    if (w.tipo === 'alvenaria'){ pdfCota(pg, M, sc, w.x1, w.y1, w.x2, w.y2, 24, cotaTxt(len), 6.5, '#8a93a3'); return; }
    const ds = plan.doors.filter(d => d.wall === w.id), lado = ds.length && ds.every(d => (d.lado || 1) < 0) ? -1 : 1;
    pdfCota(pg, M, sc, w.x1, w.y1, w.x2, w.y2, 11 * lado, `${Ls[w.id]}  ${cotaTxt(len)}`, 7, '#14337a');
  });
  const t = totaisPlanta(plan);
  let ly = 140; pg.fill('#13214e'); pg.text(36, ly, 'LEGENDA E QUANTITATIVOS', 8.5, true); ly -= 15;
  Object.keys(TIPOS_PAREDE).forEach(k => {
    if (k === 'alvenaria' || !t.porTipo[k]) return;
    pg.stroke(TIPOS_PAREDE[k].cor); pg.line(36, ly + 3, 60, ly + 3, 2.4);
    pg.fill('#1f2b44'); pg.text(68, ly, `${TIPOS_PAREDE[k].nome}: ${fmm(t.porTipo[k])} mm`, 8.5); ly -= 13;
  });
  pg.fill('#1f2b44'); pg.text(36, ly, `Total linear: ${fmm(t.total)} mm · Portas: ${t.portas} · Pé-direito: ${fmm(proj.pedireito)} mm`, 8.5, true);
  pg.stroke('#0f1b40'); pg.line(330, 128, 330, 136, 2.4); pg.fill('#1f2b44'); pg.text(338, 129, 'Montante (perfil)', 8.5);
  pg.stroke('#e08a1e'); pg.line(330, 113, 330, 121, 2.4); pg.text(338, 114, 'Batente de porta', 8.5);
  pg.fill('#8f6312'); pg.text(36, 34, 'Conferir todas as medidas em obra antes da produção.', 8);
  pdfCarimbo(pg, proj, ver, W, 'Planta', `1/${total}`);
  paginas.push(pg.out());

  /* Folhas de elevação */
  for (let f = 0; f < nElev; f++){
    pg = PDFPagina();
    pg.stroke('#13214e'); pg.rect(20, 20, W - 40, H - 40, 1.2);
    pg.fill('#13214e'); pg.text(36, H - 48, 'ELEVAÇÕES', 14, true);
    pg.fill('#56616f'); pg.text(36, H - 64, 'Vistas frontais das divisórias com modulação e alturas', 9.5);
    divs.slice(f * 4, f * 4 + 4).forEach((w, i) => {
      const bx = 40 + (i % 2) * 390, by = 320 - Math.floor(i / 2) * 170, bw = 360, bh = 140;
      pdfElevacao(pg, proj, plan, w, Ls[w.id], { x:bx, y:by, w:bw, h:bh });
    });
    pdfCarimbo(pg, proj, ver, W, 'Elevações', `${2 + f}/${total}`);
    paginas.push(pg.out());
  }

  /* Lista de peças */
  pg = PDFPagina();
  pg.stroke('#13214e'); pg.rect(20, 20, W - 40, H - 40, 1.2);
  pg.fill('#13214e'); pg.text(36, H - 48, 'LISTA DE PEÇAS', 14, true);
  pg.fill('#56616f'); pg.text(36, H - 64, `Medidas aproximadas em mm, descontados ${DESC_PERFIL} mm de perfis. Conferir antes do corte.`, 9.5);
  const cols = [40, 250, 340, 430, 500], cab = ['Peça', 'Largura', 'Altura', 'Qtd.', 'Paredes'];
  let y = H - 96;
  pg.fill('#eef1f6'); pg.fillRect(36, y - 5, 520, 18);
  pg.fill('#13214e'); cab.forEach((c, i) => pg.text(cols[i], y, c, 9, true)); y -= 18;
  const pecas = pecasProjeto(Object.assign({}, proj, { planta:plan }));
  pecas.slice(0, 26).forEach(p => {
    pg.fill('#1f2b44');
    [p.peca, String(p.l), String(p.a), String(p.q), p.paredes].forEach((v, i) => pg.text(cols[i], y, v, 9));
    pg.stroke('#e2e6ee'); pg.line(36, y - 5, 556, y - 5, 0.5); y -= 16;
  });
  if (pecas.length > 26){ pg.fill('#8f6312'); pg.text(40, y, `+ ${pecas.length - 26} itens — lista completa na aba Elevações do EuroHub`, 8.5); }
  pdfCarimbo(pg, proj, ver, W, 'Lista de peças', `${total - 1}/${total}`);
  paginas.push(pg.out());

  /* Perfis e acessórios */
  const pj2 = Object.assign({}, proj, { planta:plan }), pf = perfisProjeto(pj2), ac = acessoriosProjeto(pj2);
  pg = PDFPagina();
  pg.stroke('#13214e'); pg.rect(20, 20, W - 40, H - 40, 1.2);
  pg.fill('#13214e'); pg.text(36, H - 48, 'PERFIS E ACESSÓRIOS', 14, true);
  pg.fill('#56616f'); pg.text(36, H - 64, 'Perfis de alumínio em barras de 6 m, lista de corte e ferragens. Medidas em mm.', 9.5);
  const tabela = (x0, y0, larg, colunas, cabecalho, linhas, max) => {
    let yy = y0;
    pg.fill('#eef1f6'); pg.fillRect(x0 - 4, yy - 5, larg, 17);
    pg.fill('#13214e'); cabecalho.forEach((c, i) => pg.text(colunas[i], yy, c, 8.5, true)); yy -= 16;
    linhas.slice(0, max).forEach(l => {
      pg.fill('#1f2b44'); l.forEach((v, i) => pg.text(colunas[i], yy, String(v), 8.5));
      pg.stroke('#e2e6ee'); pg.line(x0 - 4, yy - 4.5, x0 - 4 + larg, yy - 4.5, 0.5); yy -= 14;
    });
    if (linhas.length > max){ pg.fill('#8f6312'); pg.text(x0, yy, `+ ${linhas.length - max} itens na aba Materiais do EuroHub`, 8); yy -= 14; }
    return yy;
  };
  pg.fill('#13214e'); pg.text(40, H - 92, 'RESUMO POR PERFIL', 8.5, true);
  let yp = tabela(40, H - 110, 400, [40, 215, 262, 325, 380], ['Perfil', 'Peças', 'Total', 'Barras', 'Sobra'],
    pf.resumo.map(r => [r.nome, r.pecas, fmm(r.total), r.barras, fmm(r.sobra)]), 8);
  pg.fill('#13214e'); pg.text(40, yp - 8, 'LISTA DE CORTE', 8.5, true);
  tabela(40, yp - 26, 400, [40, 215, 300, 350], ['Perfil', 'Comprimento', 'Qtd.', 'Paredes'],
    pf.corte.map(c => [c.nome, c.c, c.q, c.paredes]), Math.max(4, Math.floor((yp - 26 - 50) / 14) - 1));
  pg.fill('#13214e'); pg.text(470, H - 92, 'FERRAGENS E ACESSÓRIOS', 8.5, true);
  let ya = H - 110;
  ac.forEach(a => {
    const ls = quebrar(a.item, 46);
    pg.fill('#1f2b44'); ls.forEach((l, i) => pg.text(470, ya - i * 11, l, 8.5));
    pg.text(720, ya, `${a.un === 'mm' ? fmm(a.q) : a.q} ${a.un}`, 8.5, true);
    ya -= ls.length * 11 + 2;
    if (a.obs){ pg.fill('#56616f'); pg.text(470, ya, a.obs, 7.5); ya -= 11; }
    pg.stroke('#e2e6ee'); pg.line(466, ya + 4, 800, ya + 4, 0.5); ya -= 8;
  });
  pdfCarimbo(pg, proj, ver, W, 'Perfis e acessórios', `${total}/${total}`);
  paginas.push(pg.out());
  return pdfBlob(paginas, W, H);
}

function pdfElevacao(pg, proj, plan, w, letra, box){
  const cfg = elevCfg(proj, w), L = wallLen(w), H = cfg.altura, mods = modulosParede(plan, w, cfg);
  pg.fill('#13214e'); pg.text(box.x, box.y + box.h + 16, `Elevação ${letra} · ${TIPOS_PAREDE[w.tipo].nome} · ${cotaTxt(L)} mm`, 9, true);
  const mL = 34, mT = 30, sc = Math.min((box.w - mL - 10) / L, (box.h - mT) / H);
  const ox = box.x + mL, oy = box.y;
  const M = { X:x => ox + x * sc, Y:y => oy + (H - y) * sc };
  const R = (x, y, w2, h, cor) => { pg.fill(cor); pg.stroke('#13214e'); pg.boxFill(M.X(x), M.Y(y + h), w2 * sc, h * sc, 0.5); };
  mods.forEach(m => {
    if (m.tipo === 'porta'){
      const top = Math.min(cfg.portaAlt, H);
      if (H - top > 1) R(m.x, 0, m.w, H - top, w.tipo === 'cego' ? '#d3d9e4' : '#dff3fa');
      R(m.x + 15, H - top, m.w - 30, top, '#eef1f6');
    } else {
      R(m.x, H - cfg.rodape, m.w, cfg.rodape, '#9aa6bd');
      if (m.tipo === 'vidro') R(m.x, 0, m.w, H - cfg.rodape, '#dff3fa');
      else if (m.tipo === 'cego') R(m.x, 0, m.w, H - cfg.rodape, '#d3d9e4');
      else { R(m.x, H - m.trav, m.w, m.trav - cfg.rodape, '#d3d9e4'); R(m.x, 0, m.w, H - m.trav, '#dff3fa'); }
    }
  });
  pg.stroke('#56616f'); pg.line(M.X(0) - 6, M.Y(H), M.X(L) + 6, M.Y(H), 1.2);
  if (mods.length <= 10) mods.forEach(m => pdfCota(pg, M, sc, m.x, 0, m.x + m.w, 0, 8, cotaTxt(m.w), 5.5));
  pdfCota(pg, M, sc, 0, 0, L, 0, 19, cotaTxt(L), 6.5);
  pdfCota(pg, M, sc, 0, H, 0, 0, 12, cotaTxt(H), 6.5);
}

function pdfTexto(titulo, sub, secoes){
  const W = 595, H = 842, paginas = []; let pg = PDFPagina(), y = H - 60;
  const cab = () => {
    pg.fill('#13214e'); pg.fillRect(0, H - 28, W, 28);
    pg.fill('#ffffff'); pg.text(40, H - 19, 'EUROFLEX DIVISÓRIAS · EuroHub', 9, true);
  };
  cab();
  pg.fill('#13214e'); pg.text(40, y - 10, titulo, 17, true); y -= 30;
  pg.fill('#56616f'); pg.text(40, y, sub, 9.5); y -= 30;
  secoes.forEach(([tt, corpo]) => {
    const linhas = [].concat(...[].concat(corpo).map(par => quebrar(par, 98).concat([''])));
    if (y < 120){ paginas.push(pg.out()); pg = PDFPagina(); cab(); y = H - 60; }
    pg.fill('#13214e'); pg.text(40, y, tt, 11, true); y -= 17;
    pg.fill('#1f2b44');
    linhas.forEach(l => {
      if (y < 60){ paginas.push(pg.out()); pg = PDFPagina(); cab(); y = H - 60; pg.fill('#1f2b44'); }
      if (l) pg.text(40, y, l, 9.5); y -= l ? 13.5 : 6;
    });
    y -= 8;
  });
  pg.fill('#97a1b2'); pg.text(40, 30, 'Documento de demonstração · dados ilustrativos', 7.5);
  paginas.push(pg.out());
  return pdfBlob(paginas, W, H);
}
function pdfMemorial(proj, ver){
  const t = totaisPlanta(proj.planta);
  const tipos = Object.keys(t.porTipo).map(k => `${TIPOS_PAREDE[k].nome}: ${fmm(t.porTipo[k])} mm`).join('; ') || 'a definir';
  return pdfTexto('Memorial descritivo', `${proj.id} · ${proj.cliente} · ${proj.obra} · Revisão ${ver.rev} · ${ver.data}`, [
    ['1. Objeto', `Fornecimento e instalação de divisórias para ${proj.obra} (${proj.endereco || 'endereço a confirmar'}), conforme planta, elevações e projeto executivo do projeto ${proj.id}.`],
    ['2. Linha e materiais', [`Linha ${proj.linha}, com perfis de alumínio estrutural, painéis cegos e vidros temperados conforme a modulação das elevações.`, 'Ferragens das portas com fechadura, dobradiças de aço inox e batente com borracha de vedação.']],
    ['3. Quantitativos de referência', [`Comprimento linear total: ${fmm(t.total)} mm (${tipos}).`, `Portas: ${t.portas} unidade(s). Pé-direito de referência: ${fmm(proj.pedireito)} mm. Todas as medidas em milímetros.`]],
    ['4. Acabamentos', proj.descricao || 'Cor dos perfis, película e acabamento dos painéis a definir com o cliente antes da produção.'],
    ['5. Instalação', ['A instalação ocorre após a conferência técnica em obra e a liberação do projeto pelo revisor.', 'O local deve estar limpo, com piso e forro concluídos e acesso livre para a equipe.']],
    ['6. Observações', 'Medidas sujeitas à conferência em obra. Divergências acima de 20 mm entre projeto e medição devem ser registradas na verificação técnica.'],
  ]);
}
function pdfProposta(proj, ver){
  const o = proj.orcamento && DB.orcamentos.find(x => x.id === proj.orcamento);
  const t = totaisPlanta(proj.planta);
  const total = o ? o.total : calcula({ metragem:Math.round(t.total), pedireito:proj.pedireito, portas:t.portas, desconto:0, linha:proj.linha, comp:'Misto: vidro + painel cego' }).total;
  return pdfTexto('Proposta comercial', `${proj.cliente} · ${proj.obra} · ${ver.rev} · ${ver.data}`, [
    ['Escopo', `Divisórias ${proj.linha} para ${proj.obra}, com ${fmm(t.total)} mm lineares e ${t.portas} porta(s), conforme o projeto ${proj.id}.`],
    ['Investimento', [`Valor total: ${brl(total)}${o ? ` (orçamento ${o.id})` : ''}.`, 'Condição: 50% de sinal na aprovação e 50% na entrega.']],
    ['Prazo', `Produção em até 15 dias úteis após a liberação do projeto executivo${proj.prazo ? '; previsão de entrega em ' + proj.prazo : ''}.`],
    ['Validade', 'Esta proposta é válida por 15 dias a partir da data de emissão.'],
  ]);
}

function medicaoSVG(proj){
  const fotos = [
    ['Parede B · comprimento', '4120 mm', 'h'], ['Pé-direito · sala 1', '2780 mm', 'v'], ['Vão da porta · circulação', '920 mm', 'h'],
    ['Parede A · comprimento', '4500 mm', 'h'], ['Parede C · comprimento', '6020 mm', 'h'], ['Nível do piso', '± 3 mm', 'h'],
  ];
  const tw = 400, th = 280, gap = 24, W = tw * 3 + gap * 4, H = (th + 40) * 2 + gap * 3 + 60;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Roboto, Arial, sans-serif">
    <defs><linearGradient id="mw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e7ec"/><stop offset="1" stop-color="#b9c1cc"/></linearGradient>
    <linearGradient id="mf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c8a75"/><stop offset="1" stop-color="#7a6957"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="#fff"/>
    <text x="${gap}" y="38" font-size="22" font-weight="700" fill="#13214e">Medição técnica · ${esc(proj.cliente)} · ${esc(proj.obra)}</text>`;
  fotos.forEach(([titulo, valor, dir], i) => {
    const x = gap + (i % 3) * (tw + gap), y = 60 + gap + Math.floor(i / 3) * (th + 40 + gap);
    s += `<g transform="translate(${x} ${y})">
      <rect width="${tw}" height="${th}" rx="8" fill="url(#mw)"/>
      <rect y="${th - 60}" width="${tw}" height="60" fill="url(#mf)"/>
      <rect x="${tw - 120}" y="40" width="70" height="${th - 100}" fill="#cfd5dd" stroke="#aeb6c2"/>`;
    if (dir === 'h'){
      s += `<line x1="30" y1="${th - 90}" x2="${tw - 30}" y2="${th - 90}" stroke="#f2c230" stroke-width="10"/>
        ${Array.from({ length:18 }, (_, k) => `<line x1="${36 + k * 19}" y1="${th - 95}" x2="${36 + k * 19}" y2="${th - 85}" stroke="#5a4500" stroke-width="1.5"/>`).join('')}`;
    } else {
      s += `<line x1="60" y1="20" x2="60" y2="${th - 60}" stroke="#f2c230" stroke-width="10"/>
        ${Array.from({ length:12 }, (_, k) => `<line x1="55" y1="${26 + k * 17}" x2="65" y2="${26 + k * 17}" stroke="#5a4500" stroke-width="1.5"/>`).join('')}`;
    }
    s += `<rect x="${tw / 2 - 90}" y="20" width="180" height="56" rx="8" fill="#fff" fill-opacity=".92"/>
      <text x="${tw / 2}" y="44" font-size="15" fill="#56616f" text-anchor="middle">${titulo}</text>
      <text x="${tw / 2}" y="66" font-size="20" font-weight="700" fill="#13214e" text-anchor="middle">${valor}</text>
      <text x="0" y="${th + 26}" font-size="15" fill="#56616f">Foto ${String(i + 1).padStart(2, '0')} · 12/11 15:0${i} · Equipe de medição</text></g>`;
  });
  return s + '</svg>';
}

/* ============================================================
   DADOS DE DEMONSTRAÇÃO
============================================================ */
const PW = (id, x1, y1, x2, y2, tipo) => ({ id, x1, y1, x2, y2, tipo });
function contorno(w, h){
  return [PW('e1', 0, -h, w, -h, 'alvenaria'), PW('e2', w, -h, w, 0, 'alvenaria'), PW('e3', w, 0, 0, 0, 'alvenaria'), PW('e4', 0, 0, 0, -h, 'alvenaria')];
}
/* Converte um rascunho em cm (Y para baixo, origem no canto superior) para mm com origem no canto inferior esquerdo. */
function emMM(planCm, hCm){
  return {
    walls: planCm.walls.map(w => Object.assign({}, w, { x1:w.x1 * 10, y1:(w.y1 - hCm) * 10, x2:w.x2 * 10, y2:(w.y2 - hCm) * 10 })),
    doors: planCm.doors.map(d => Object.assign({}, d, { w:(d.w || 80) * 10 })),
  };
}
const contornoCm = (w, h) => [PW('e1', 0, 0, w, 0, 'alvenaria'), PW('e2', w, 0, w, h, 'alvenaria'), PW('e3', w, h, 0, h, 'alvenaria'), PW('e4', 0, h, 0, 0, 'alvenaria')];
const versao = (rev, data, autor, extra) => Object.assign({ rev, data, autor }, extra);
const arquivo = (id, nome, categoria, sit, versoes) => ({ id, nome, categoria, sit, versoes });
const comentario = (autor, ini, quando, texto, arq) => ({ id:uid('c'), autor, ini, quando, texto, arq:arq || null });

function seedProjetos(){
  const p412 = emMM({ walls: contornoCm(1600, 1000).concat([
    PW('wA', 1000, 0, 1000, 450, 'misto'), PW('wB', 0, 600, 420, 600, 'cego'), PW('wC', 1000, 450, 1600, 450, 'vidro'),
    PW('wD', 420, 600, 420, 1000, 'cego'), PW('wE', 420, 600, 820, 600, 'misto'), PW('wF', 820, 600, 820, 1000, 'cego'),
  ]), doors:[ { id:'d1', wall:'wC', t:0.2, w:90 }, { id:'d2', wall:'wE', t:0.5, w:80 }, { id:'d3', wall:'wB', t:0.65, w:80 } ] }, 1000);
  const p412r1 = clone(p412);
  p412r1.walls = p412r1.walls.filter(w => w.id !== 'wF'); p412r1.walls.find(w => w.id === 'wC').tipo = 'misto';

  const p415 = emMM({ walls: contornoCm(900, 700).concat([
    PW('w1', 0, 250, 500, 250, 'cego'), PW('w2', 125, 0, 125, 250, 'cego'), PW('w3', 250, 0, 250, 250, 'cego'),
    PW('w4', 375, 0, 375, 250, 'cego'), PW('w5', 500, 0, 500, 250, 'cego'),
  ]), doors:[ { id:'d1', wall:'w1', t:0.125, w:60 }, { id:'d2', wall:'w1', t:0.375, w:60 }, { id:'d3', wall:'w1', t:0.625, w:60 }, { id:'d4', wall:'w1', t:0.875, w:60 } ] }, 700);
  p415.walls.filter(w => w.tipo !== 'alvenaria').forEach(w => { w.elev = { modMax:1250, rodape:150 }; });

  const p409 = emMM({ walls: contornoCm(2000, 1200).concat([
    PW('w1', 0, 500, 800, 500, 'misto'), PW('w2', 800, 0, 800, 500, 'misto'), PW('w3', 400, 0, 400, 500, 'vidro'),
  ]), doors:[ { id:'d1', wall:'w1', t:0.25, w:90 }, { id:'d2', wall:'w1', t:0.75, w:90 } ] }, 1200);

  const p418 = emMM({ walls: contornoCm(1400, 900).concat([
    PW('w1', 900, 0, 900, 400, 'vidro'), PW('w2', 900, 400, 1400, 400, 'vidro'),
  ]), doors:[ { id:'d1', wall:'w2', t:0.3, w:90 } ] }, 900);

  const equipe = [
    { ini:'AA', nome:'Arquiteta A', papel:'Arquiteta responsável' },
    { ini:'PB', nome:'Projetista B', papel:'Projetista' },
    { ini:'RC', nome:'Revisor C', papel:'Revisor técnico' },
  ];
  return [
    {
      id:'PRJ-0412', nome:'Divisórias do 3º andar', cliente:'[Cliente]', obra:'Sede administrativa', endereco:'Curitiba · PR',
      pedido:1044, orcamento:'ORC-2284', arquiteto:'Arquiteta A', linha:'Divisória articulável', pedireito:2800, prazo:'22/11',
      fase:'verificacao', rev:'R01', atualizado:'14/11',
      descricao:'Sala de reunião envidraçada, duas salas fechadas e circulação aberta. Perfis na cor preta e vidro com película jateada até 1100 mm de altura.',
      equipe, planta:p412,
      arquivos:[
        arquivo('a1', 'Planta de layout', 'Planta', 'aprovado', [versao('R02', '13/11', 'Arquiteta A', { gen:'planta', snap:clone(p412) }), versao('R01', '10/11', 'Arquiteta A', { gen:'planta', snap:p412r1 })]),
        arquivo('a2', 'Projeto executivo de divisórias', 'Executivo', 'verificacao', [versao('R01', '14/11', 'Projetista B', { gen:'executivo', snap:clone(p412) })]),
        arquivo('a3', 'Medição técnica', 'Medição', 'arquivado', [versao('12/11', '12/11', 'Equipe de medição', { gen:'medicao' })]),
        arquivo('a4', 'Memorial descritivo', 'Documento', 'arquivado', [versao('R01', '11/11', 'Arquiteta A', { gen:'memorial' })]),
        arquivo('a5', 'Proposta comercial', 'Comercial', 'aprovado', [versao('v3', '08/11', 'Vendedor A', { gen:'proposta' })]),
      ],
      comentarios:[
        comentario('Revisor C', 'RC', '15/11, 09:12', 'A parede B está com 4200 mm no projeto, mas a medição deu 4120 mm. Consegue ajustar antes de liberar?', 'a2'),
        comentario('Arquiteta A', 'AA', '15/11, 10:03', 'Vi aqui. O cliente vai manter o rodapé, então vamos reduzir o módulo final. Projetista B, você atualiza o executivo para R02?'),
        comentario('Projetista B', 'PB', '15/11, 10:40', 'Combinado, subo a R02 ainda hoje à tarde.'),
      ],
      hist:[
        { t:'Projeto executivo R01 enviado para verificação', quem:'Projetista B', quando:'14/11, 16:40' },
        { t:'Planta de layout R02 aprovada pelo cliente', quem:'Aceite digital', quando:'13/11, 10:12' },
        { t:'Medição técnica anexada com 6 fotos', quem:'Equipe de medição', quando:'12/11, 15:05' },
        { t:'Proposta comercial v3 aceita', quem:'Vendedor A', quando:'08/11, 09:30' },
      ],
    },
    {
      id:'PRJ-0415', nome:'Cabines sanitárias', cliente:'Cliente C', obra:'Clínica · 2º andar', endereco:'São José · SC',
      pedido:1045, orcamento:null, arquiteto:'Arquiteta A', linha:'Divisórias sanitárias', pedireito:2100, prazo:'02/12',
      fase:'levantamento', rev:'R01', atualizado:'12/11',
      descricao:'Quatro cabines com portas de 600 mm, painéis em TS estrutural e ferragens em inox. Medição agendada para 18/11.',
      equipe:[ equipe[0], { ini:'EM', nome:'Equipe de medição', papel:'Levantamento em obra' } ], planta:p415,
      arquivos:[ arquivo('a1', 'Croqui inicial', 'Planta', 'elaboracao', [versao('R01', '12/11', 'Arquiteta A', { gen:'planta', snap:clone(p415) })]) ],
      comentarios:[ comentario('Arquiteta A', 'AA', '12/11, 14:20', 'Croqui feito com base na planta do cliente. Confirmar as medidas no dia 18.') ],
      hist:[ { t:'Croqui inicial criado', quem:'Arquiteta A', quando:'12/11, 14:15' }, { t:'Projeto criado a partir do pedido #1045', quem:'Vendedor A', quando:'10/11, 16:35' } ],
    },
    {
      id:'PRJ-0409', nome:'Escritório da fábrica', cliente:'Cliente E', obra:'Galpão industrial', endereco:'Joinville · SC',
      pedido:1041, orcamento:null, arquiteto:'Arquiteta D', linha:'Europrata 90 mm', pedireito:3000, prazo:'22/11',
      fase:'aprovado', rev:'R03', atualizado:'11/11',
      descricao:'Bloco de escritório dentro do galpão, com sala da gerência em vidro e recepção.',
      equipe:[ { ini:'AD', nome:'Arquiteta D', papel:'Arquiteta responsável' }, equipe[1], equipe[2] ], planta:p409,
      arquivos:[
        arquivo('a1', 'Planta de layout', 'Planta', 'aprovado', [versao('R03', '10/11', 'Arquiteta D', { gen:'planta', snap:clone(p409) })]),
        arquivo('a2', 'Projeto executivo', 'Executivo', 'aprovado', [versao('R03', '11/11', 'Projetista B', { gen:'executivo', snap:clone(p409) })]),
        arquivo('a3', 'Memorial descritivo', 'Documento', 'aprovado', [versao('R02', '09/11', 'Arquiteta D', { gen:'memorial' })]),
      ],
      comentarios:[ comentario('Revisor C', 'RC', '11/11, 14:58', 'Tudo conferido. Liberado para produção.') ],
      hist:[ { t:'Projeto liberado para produção', quem:'Revisor C', quando:'11/11, 15:00' }, { t:'Projeto executivo R03 enviado', quem:'Projetista B', quando:'11/11, 09:20' } ],
    },
    {
      id:'PRJ-0418', nome:'Sala da diretoria em vidro', cliente:'Cliente J', obra:'Escritório central', endereco:'Florianópolis · SC',
      pedido:null, orcamento:'ORC-2291', arquiteto:'Arquiteta A', linha:'Europrata 90 mm', pedireito:2700, prazo:'',
      fase:'estudo', rev:'R01', atualizado:'15/11',
      descricao:'Estudo para a proposta: sala da diretoria em vidro no canto do andar.',
      equipe:[ equipe[0] ], planta:p418,
      arquivos:[ arquivo('a1', 'Estudo de layout', 'Planta', 'elaboracao', [versao('R01', '15/11', 'Arquiteta A', { gen:'planta', snap:clone(p418) })]) ],
      comentarios:[],
      hist:[ { t:'Estudo de layout criado para o ORC-2291', quem:'Arquiteta A', quando:'15/11, 11:30' } ],
    },
  ];
}

/* ============================================================
   LISTA DE PROJETOS
============================================================ */
let filtroProj2 = { busca:'', fase:'todos' };
function viewProjetos(param, aba){
  if (param){
    const proj = projetoPorId(param);
    if (proj) return viewProjeto(proj, aba || 'geral');
    location.hash = '#/projetos'; return;
  }
  setHeader('Projetos', `${DB.projetos.length} projetos · plantas, elevações, arquivos técnicos e revisões`);
  $('#topbar-actions').innerHTML = searchField('busca-prj', 'Buscar', 'Projeto, cliente ou obra', filtroProj2.busca)
    + `<button class="btn btn-primary" id="tb-novo-prj">${ico('plus')}Novo projeto</button>`;
  $('#busca-prj').addEventListener('input', e => { filtroProj2.busca = e.target.value; desenhaListaProjetos(); });
  $('#tb-novo-prj').addEventListener('click', modalNovoProjeto);
  $('#content').innerHTML = `<div class="toolbar"><div class="chips" id="prj-chips"></div></div><div class="proj-grid" id="prj-grid"></div>`;
  desenhaListaProjetos();
}
function desenhaListaProjetos(){
  const counts = { todos:DB.projetos.length };
  FASES.forEach(f => { counts[f.id] = DB.projetos.filter(p => p.fase === f.id).length; });
  $('#prj-chips').innerHTML = [['todos', 'Todos']].concat(FASES.map(f => [f.id, f.nome]))
    .map(([k, n]) => `<button class="chip ${filtroProj2.fase === k ? 'active' : ''}" data-f="${k}">${n} <span class="c">${counts[k]}</span></button>`).join('');
  $$('#prj-chips .chip').forEach(c => c.addEventListener('click', () => { filtroProj2.fase = c.dataset.f; desenhaListaProjetos(); }));

  const f = filtroProj2.busca.trim().toLowerCase();
  const lista = DB.projetos.filter(p => (filtroProj2.fase === 'todos' || p.fase === filtroProj2.fase)
    && (!f || [p.id, p.nome, p.cliente, p.obra, p.linha, p.arquiteto].join(' ').toLowerCase().includes(f)));
  $('#prj-grid').innerHTML = lista.map(p => {
    const t = totaisPlanta(p.planta);
    return `
    <article class="card proj-card" data-prj="${esc(p.id)}" tabindex="0">
      <div class="proj-thumb">${planSVGString(p.planta, { bgc:'#f6f8fb' })}</div>
      <div class="proj-body">
        <div class="proj-top"><span class="proj-id">${esc(p.id)} · ${esc(p.rev)}</span><span class="badge ${FASE_COR[p.fase]}">${faseNome(p.fase)}</span></div>
        <h4>${esc(p.nome)}</h4>
        <p>${esc(p.cliente)} · ${esc(p.obra)}${p.pedido ? ` · Pedido #${p.pedido}` : ''}</p>
        <p>${fmm(t.total)} mm de divisórias · ${t.portas} ${t.portas === 1 ? 'porta' : 'portas'}</p>
        <div class="proj-foot">
          <span class="avatar sm">${esc((p.equipe[0] || {}).ini || '?')}</span>${esc(p.arquiteto)}
          <span class="sp"><span title="Arquivos">${ico('file')}${p.arquivos.length}</span><span title="Comentários">${ico('comment')}${p.comentarios.length}</span><span>${esc(p.atualizado)}</span></span>
        </div>
      </div>
    </article>`; }).join('')
    + (filtroProj2.fase === 'todos' && !f ? `<button class="card proj-card proj-new" id="prj-new-card">${ico('plus')}<span>Novo projeto</span><small>Comece pela planta do ambiente</small></button>` : '')
    + (!lista.length ? `<div class="card empty" style="grid-column:1/-1">${ico('inbox')}<div>Nenhum projeto encontrado.</div></div>` : '');
  $$('[data-prj]').forEach(c => {
    c.addEventListener('click', () => { location.hash = '#/projetos/' + c.dataset.prj; });
    c.addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = '#/projetos/' + c.dataset.prj; });
  });
  const nc = $('#prj-new-card'); if (nc) nc.addEventListener('click', modalNovoProjeto);
}

function modalNovoProjeto(){
  const livres = DB.pedidos.filter(p => !projetoDoPedido(p.id) && p.col !== 'concluido');
  openModal(`
    <h3>Novo projeto</h3>
    <p class="modal-sub">O sistema cria as paredes do ambiente em milímetros. Depois é só desenhar as divisórias.</p>
    <label for="np2-nome">Nome do projeto</label><input id="np2-nome" placeholder="Ex.: Divisórias do 2º andar">
    <div class="form-2col">
      <div><label for="np2-cliente">Cliente</label><input id="np2-cliente" placeholder="Nome do cliente"></div>
      <div><label for="np2-obra">Obra</label><input id="np2-obra" placeholder="Ex.: Escritório"></div>
      <div><label for="np2-larg">Largura do ambiente</label><div class="input-suffix"><input id="np2-larg" value="12000" inputmode="numeric"><em>mm</em></div></div>
      <div><label for="np2-prof">Profundidade</label><div class="input-suffix"><input id="np2-prof" value="8000" inputmode="numeric"><em>mm</em></div></div>
      <div><label for="np2-pd">Pé-direito</label><div class="input-suffix"><input id="np2-pd" value="2800" inputmode="numeric"><em>mm</em></div></div>
      <div><label for="np2-linha">Linha</label><select id="np2-linha">${Object.keys(LINHAS).map(l => `<option>${l}</option>`).join('')}</select></div>
    </div>
    <label for="np2-ped">Pedido vinculado</label><select id="np2-ped"><option value="">Sem pedido ainda</option>${livres.map(p => `<option value="${p.id}">#${p.id} · ${esc(p.cliente)}</option>`).join('')}</select>
    <div class="modal-btns">
      <button class="btn btn-outline" data-close>Cancelar</button>
      <button class="btn btn-primary" id="np2-ok">Criar e abrir a planta</button>
    </div>`, m => {
    $('#np2-ped', m).addEventListener('change', e => {
      const p = DB.pedidos.find(x => x.id === +e.target.value);
      if (p){ if (!$('#np2-cliente').value) $('#np2-cliente').value = p.cliente; if (!$('#np2-obra').value && p.obra !== '—') $('#np2-obra').value = p.obra; }
    });
    $('#np2-ok', m).addEventListener('click', () => {
      const nome = $('#np2-nome').value.trim(), cliente = $('#np2-cliente').value.trim();
      $('#np2-nome').classList.toggle('invalid', !nome); $('#np2-cliente').classList.toggle('invalid', !cliente);
      if (!nome || !cliente) return;
      const lim = v => Math.round(Math.min(Math.max(mmVal(v), 1000), 100000));
      const larg = lim($('#np2-larg').value), prof = lim($('#np2-prof').value), pd = Math.round(Math.min(Math.max(mmVal($('#np2-pd').value), 1800), 6000));
      const n = Math.max(...DB.projetos.map(p => parseInt(p.id.slice(4), 10) || 0), 400) + 1;
      const u = usuario();
      const proj = {
        id:'PRJ-' + String(n).padStart(4, '0'), nome, cliente, obra:$('#np2-obra').value.trim() || '—', endereco:'',
        pedido: +$('#np2-ped').value || null, orcamento:null, arquiteto:u.nome, linha:$('#np2-linha').value, pedireito:pd, prazo:'',
        fase:'levantamento', rev:'R01', atualizado:hoje(), descricao:'',
        equipe:[{ ini:u.ini, nome:u.nome, papel:'Arquiteto(a) responsável' }],
        planta:{ walls:contorno(larg, prof), doors:[] }, arquivos:[], comentarios:[], hist:[],
      };
      registrar(proj, 'Projeto criado');
      DB.projetos.unshift(proj); saveDB(); closeModal();
      location.hash = `#/projetos/${proj.id}/planta`;
      toast(`${proj.id} criado. Digite L e Enter para desenhar uma divisória.`, 'plan');
    });
  });
}

/* ============================================================
   FICHA DO PROJETO
============================================================ */
function viewProjeto(proj, aba){
  const t = totaisPlanta(proj.planta);
  setHeader(proj.nome, `${proj.cliente} · ${proj.obra}${proj.pedido ? ` · Pedido #${proj.pedido}` : ''} · Revisão ${proj.rev}`,
    `<a href="#/projetos">Projetos</a>${ico('chevron')}<span>${esc(proj.id)}</span>`);
  const podeEnviar = ['levantamento', 'estudo', 'executivo'].includes(proj.fase);
  $('#topbar-actions').innerHTML = `<span class="badge ${FASE_COR[proj.fase]}" style="align-self:center">${faseNome(proj.fase)}</span>`
    + (podeEnviar ? `<button class="btn btn-outline" id="pj-enviar">${ico('verificacao')}Enviar para verificação</button>` : '')
    + `<button class="btn btn-primary" id="pj-upload">${ico('upload')}Enviar arquivo</button>`;
  $('#pj-upload').addEventListener('click', () => pedirArquivos(true, fs => enviarArquivos(proj, fs).then(() => {
    if (aba === 'arquivos') render(); else location.hash = `#/projetos/${proj.id}/arquivos`;
  })));
  const env = $('#pj-enviar');
  if (env) env.addEventListener('click', () => confirmar('Enviar para verificação',
    `O revisor técnico recebe o projeto ${proj.id} (${proj.rev}) para conferir medidas e quantitativos.`, 'Enviar', () => {
      proj.fase = 'verificacao'; registrar(proj, `Projeto ${proj.rev} enviado para verificação`);
      if (proj.pedido === 1044){ DB.verif.status = 'andamento'; }
      saveDB(); render(); toast('Projeto enviado ao revisor técnico.', 'verificacao');
    }));

  const nDiv = proj.planta.walls.filter(w => w.tipo !== 'alvenaria').length;
  const abas = [
    ['geral', 'Visão geral', 'painel', ''], ['planta', 'Planta', 'plan', ''], ['elevacoes', 'Elevações', 'elev', nDiv],
    ['materiais', 'Materiais', 'pedidos', ''],
    ['arquivos', 'Arquivos', 'file', proj.arquivos.length], ['discussao', 'Discussão', 'comment', proj.comentarios.length],
    ['historico', 'Histórico', 'history', ''],
  ];
  $('#content').innerHTML = `
    <nav class="tabs" aria-label="Seções do projeto">${abas.map(([id, nome, ic, c]) =>
      `<a class="tab ${aba === id ? 'active' : ''}" href="#/projetos/${esc(proj.id)}/${id}" style="text-decoration:none">${ico(ic)}${nome}${c !== '' ? `<span class="c">${c}</span>` : ''}</a>`).join('')}</nav>
    <div id="pj-aba"></div>`;
  ({ geral:abaGeral, planta:abaPlanta, elevacoes:abaElevacoes, materiais:abaMateriais, arquivos:abaArquivos, discussao:abaDiscussao, historico:abaHistorico }[aba] || abaGeral)(proj, t);
}

function abaGeral(proj, t){
  const idx = FASES.findIndex(f => f.id === proj.fase);
  const ped = proj.pedido && DB.pedidos.find(p => p.id === proj.pedido);
  const orc = proj.orcamento && DB.orcamentos.find(o => o.id === proj.orcamento);
  const linhas = Object.keys(LINHAS).concat(LINHAS[proj.linha] ? [] : [proj.linha]);
  $('#pj-aba').innerHTML = `
    <div class="card phase-bar">${FASES.map((f, i) => `
      <button class="phase ${i < idx ? 'done' : i === idx ? 'now' : ''}" data-fase="${f.id}" title="Mudar para ${f.nome}">
        <i></i><b>${f.nome}</b><small>${f.desc}</small></button>`).join('')}</div>
    <div class="grid-75">
      <div class="card card-pad">
        <div class="card-head"><h3>Dados do projeto</h3><small>Atualizado em ${esc(proj.atualizado)}</small></div>
        <label for="pg-nome">Nome do projeto</label><input id="pg-nome" value="${esc(proj.nome)}">
        <div class="form-2col">
          <div><label for="pg-cliente">Cliente</label><input id="pg-cliente" value="${esc(proj.cliente)}"></div>
          <div><label for="pg-obra">Obra</label><input id="pg-obra" value="${esc(proj.obra)}"></div>
          <div><label for="pg-end">Endereço</label><input id="pg-end" value="${esc(proj.endereco)}" placeholder="Cidade · UF"></div>
          <div><label for="pg-arq">Arquiteto(a) responsável</label><input id="pg-arq" value="${esc(proj.arquiteto)}"></div>
          <div><label for="pg-linha">Linha</label><select id="pg-linha">${linhas.map(l => `<option ${l === proj.linha ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          <div><label for="pg-pd">Pé-direito</label><div class="input-suffix"><input id="pg-pd" value="${esc(proj.pedireito)}" inputmode="numeric"><em>mm</em></div></div>
          <div><label for="pg-prazo">Prazo de entrega</label><input id="pg-prazo" value="${esc(proj.prazo)}" placeholder="dd/mm"></div>
        </div>
        <label for="pg-desc">Briefing e acabamentos</label>
        <textarea id="pg-desc" rows="4" placeholder="O que o cliente pediu: cores, película, acústica, prazos…">${esc(proj.descricao)}</textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" id="pg-salvar">${ico('save')}Salvar alterações</button></div>
      </div>
      <div>
        <div class="card card-pad">
          <div class="card-head"><h3>Planta</h3><a href="#/projetos/${esc(proj.id)}/planta">Abrir editor</a></div>
          <div class="mini-plan" id="pg-mini" title="Abrir a planta">${planSVGString(proj.planta, { bgc:'#f6f8fb' })}</div>
          <div class="stat-row">
            <div class="stat"><small>Divisórias</small><b class="num">${fmm(t.total)}</b><small>mm</small></div>
            <div class="stat"><small>Portas</small><b class="num">${t.portas}</b></div>
            <div class="stat"><small>Arquivos</small><b class="num">${proj.arquivos.length}</b></div>
            <div class="stat"><small>Comentários</small><b class="num">${proj.comentarios.length}</b></div>
          </div>
        </div>
        <div class="card card-pad section-gap">
          <h3 style="margin-bottom:8px">Equipe e vínculos</h3>
          <ul class="team-list">
            ${proj.equipe.map(m => `<li><span class="avatar">${esc(m.ini)}</span><div><b>${esc(m.nome)}</b><small>${esc(m.papel)}</small></div></li>`).join('')}
            <li><span class="alert-ico cyan">${ico('pedidos')}</span><div><b>${ped ? `<a href="#" id="pg-ped">Pedido #${ped.id}</a>` : 'Sem pedido vinculado'}</b><small>${ped ? esc(colNome(ped.col)) + ' · ' + esc(ped.nota) : 'Vincule quando o cliente aprovar'}</small></div></li>
            <li><span class="alert-ico cyan">${ico('orcamentos')}</span><div><b>${orc ? `<a href="#/orcamentos/${esc(orc.id)}">${esc(orc.id)}</a>` : 'Sem orçamento'}</b><small>${orc ? brl(orc.total) + ' · ' + ORC_STATUS[orc.status].nome : 'Gere um a partir da planta'}</small></div></li>
          </ul>
        </div>
      </div>
    </div>`;

  $$('[data-fase]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.fase; if (f === proj.fase) return;
    proj.fase = f; registrar(proj, `Fase alterada para ${faseNome(f)}`);
    if (proj.pedido === 1044) DB.verif.status = f === 'verificacao' ? 'andamento' : f === 'aprovado' ? 'liberado' : DB.verif.status;
    saveDB(); render(); toast(`Projeto agora em ${faseNome(f)}.`);
  }));
  $('#pg-mini').addEventListener('click', () => { location.hash = `#/projetos/${proj.id}/planta`; });
  const lp = $('#pg-ped'); if (lp) lp.addEventListener('click', e => { e.preventDefault(); abrirPedido(proj.pedido); });
  $('#pg-salvar').addEventListener('click', () => {
    const nome = $('#pg-nome').value.trim(), pd = Math.round(mmVal($('#pg-pd').value));
    $('#pg-nome').classList.toggle('invalid', !nome);
    $('#pg-pd').classList.toggle('invalid', !(pd >= 1800 && pd <= 6000));
    if (!nome || !(pd >= 1800 && pd <= 6000)) return;
    Object.assign(proj, {
      nome, cliente:$('#pg-cliente').value.trim(), obra:$('#pg-obra').value.trim(), endereco:$('#pg-end').value.trim(),
      arquiteto:$('#pg-arq').value.trim(), linha:$('#pg-linha').value, pedireito:pd, prazo:$('#pg-prazo').value.trim(),
      descricao:$('#pg-desc').value,
    });
    registrar(proj, 'Dados do projeto atualizados'); saveDB(); render(); toast('Dados do projeto salvos.', 'save');
  });
}

function abaHistorico(proj){
  $('#pj-aba').innerHTML = `<div class="card card-pad" style="max-width:760px">
    <h3 style="margin-bottom:16px">Histórico do projeto</h3>
    <ul class="timeline">${proj.hist.map((h, i) => `<li class="${i === 0 ? 'now' : ''}"><b>${esc(h.t)}</b><small>${esc(h.quem)} · ${esc(h.quando)}</small></li>`).join('') || '<li><b>Sem registros</b></li>'}</ul>
  </div>`;
}

/* ============================================================
   ELEVAÇÕES — editor
============================================================ */
const elevSel = {};
let EL = null;
const EL_PROMPTS = {
  select:'Comando:',
  split:'DIVIDIR  Clique na posição do montante ou digite a distância do início (mm):',
  erase:'APAGAR  Clique no montante:',
};
const EL_CMDS = {
  S:'select', SEL:'select', D:'split', DIV:'split', DIVIDIR:'split', E:'erase', APAGAR:'erase',
  U:'undo', DESFAZER:'undo', R:'redo', REFAZER:'redo', Z:'fit', ZOOM:'fit', AUTO:'auto',
};
const MIN_MOD = 100;

function abaElevacoes(proj){
  const plan = proj.planta, Ls = letras(plan), divs = divisoriasDoProjeto(proj);
  if (!divs.length){
    EL = null;
    $('#pj-aba').innerHTML = `<div class="card empty">${ico('elev')}<div>Nenhuma divisória na planta ainda.<br><a href="#/projetos/${esc(proj.id)}/planta">Desenhe as divisórias na planta</a> para ver as elevações.</div></div>`;
    return;
  }
  const w = divs.find(x => x.id === elevSel[proj.id]) || divs[0]; elevSel[proj.id] = w.id;
  const i = divs.indexOf(w);
  $('#pj-aba').innerHTML = `
    <div class="elev-layout">
      <div class="card card-pad">
        <div class="sub-title" style="margin-top:0">Divisórias</div>
        <div class="wall-list" id="el-lista"></div>
      </div>
      <div class="card" style="overflow:hidden">
        <div class="elev-head">
          <span class="wall-tag">${Ls[w.id]}</span>
          <h3 id="el-titulo"></h3>
          <button class="btn btn-outline btn-sm" id="el-prev" title="Parede anterior" aria-label="Parede anterior" ${i === 0 ? 'disabled' : ''}>‹</button>
          <button class="btn btn-outline btn-sm" id="el-next" title="Próxima parede" aria-label="Próxima parede" ${i === divs.length - 1 ? 'disabled' : ''}>›</button>
          <a class="btn btn-outline btn-sm" href="#/projetos/${esc(proj.id)}/planta" id="el-planta" style="text-decoration:none">${ico('plan')}Ver na planta</a>
        </div>
        <div class="plan-tools">
          <button class="tool" data-eltool="select" title="Selecionar e arrastar (comando S)">${ico('pointer')}<span class="lbl">Selecionar</span></button>
          <button class="tool" data-eltool="split" title="Dividir um módulo com um novo montante (comando D)">${ico('split')}<span class="lbl">Dividir</span></button>
          <button class="tool" data-eltool="erase" title="Apagar um montante e juntar os módulos (comando E)">${ico('eraser')}<span class="lbl">Apagar</span></button>
          <span class="tool-sep"></span>
          <button class="tool" id="el-undo" title="Desfazer (Ctrl+Z)" aria-label="Desfazer">${ico('undo')}</button>
          <button class="tool" id="el-redo" title="Refazer (Ctrl+Y)" aria-label="Refazer">${ico('redo')}</button>
          <span class="tool-sep"></span>
          <button class="tool" id="el-auto" title="Refazer a modulação automática">${ico('refresh')}<span class="lbl">Remodular</span></button>
        </div>
        <div class="plan-canvas cad-cursor" id="el-canvas" style="height:440px">
          <svg id="el-svg" font-family="Roboto, Arial, sans-serif" preserveAspectRatio="xMidYMid meet">
            <rect x="-200000" y="-200000" width="400000" height="400000" fill="#fff"/>
            <g id="el-layer"></g><g id="el-preview"></g>
          </svg>
          <div class="plan-zoom">
            <button id="el-zin" aria-label="Aproximar">+</button>
            <button id="el-zout" aria-label="Afastar">−</button>
            <button id="el-fit" aria-label="Ajustar à tela">${ico('fit')}</button>
          </div>
        </div>
        <div class="cad-status">
          <span class="cad-coord" id="el-coord" style="min-width:150px">X —   Z —</span>
          <span class="sp"></span>
          <span class="elev-key"><i style="background:#dff3fa"></i>Vidro</span><span class="elev-key"><i style="background:#d3d9e4"></i>Cego</span>
          <span class="elev-key"><i style="background:#3a4a80"></i>Perfil</span><span class="elev-key" style="margin-right:8px"><i style="background:#9aa6bd"></i>Rodapé</span>
          <button class="cad-chip" id="el-grade" title="Arredonda para 10 mm">GRADE <kbd>F9</kbd></button>
          <span class="cad-unit">mm</span>
        </div>
        <div class="cad-cmd">
          <div class="cad-hist" id="el-hist"></div>
          <div class="cad-line"><span id="el-prompt"></span><input id="el-cmd" autocomplete="off" spellcheck="false" aria-label="Linha de comando"></div>
        </div>
      </div>
      <div>
        <div class="card card-pad" id="el-props"></div>
        <div class="card card-pad section-gap" id="el-mat"></div>
      </div>
    </div>`;

  EL = { proj, plan, w, tool:'select', sel:null, hover:null, vb:null, undo:[], redo:[], down:null, panning:false, drag:null,
         grade:true, histOk:false, ultimaEntrada:'',
         hist:['Arraste montantes, travessas e portas · D divide um módulo · E apaga um montante · digite a medida e Enter'] };
  const svg = $('#el-svg'), canvas = $('#el-canvas'), cmd = $('#el-cmd');
  const ir = id => { elevSel[proj.id] = id; abaElevacoes(proj); };
  $('#el-prev').addEventListener('click', () => ir(divs[i - 1].id));
  $('#el-next').addEventListener('click', () => ir(divs[i + 1].id));
  $('#el-planta').addEventListener('click', () => { edFoco[proj.id] = w.id; });
  $$('[data-eltool]').forEach(b => b.addEventListener('click', () => elTool(b.dataset.eltool)));
  $('#el-undo').addEventListener('click', elUndo);
  $('#el-redo').addEventListener('click', elRedo);
  $('#el-auto').addEventListener('click', elRemodular);
  $('#el-zin').addEventListener('click', () => elZoom(1 / 1.25));
  $('#el-zout').addEventListener('click', () => elZoom(1.25));
  $('#el-fit').addEventListener('click', () => { elFit(); elRender(); });
  $('#el-grade').addEventListener('click', elGrade);
  cmd.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); const v = cmd.value; cmd.value = ''; elComando(v); }
    else if (e.key === 'Escape'){ e.preventDefault(); cmd.value = ''; elEsc(); cmd.blur(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); cmd.value = EL.ultimaEntrada; }
    else if (e.key === 'F9'){ e.preventDefault(); elGrade(); }
  });

  svg.addEventListener('pointerdown', e => {
    if (e.button === 1) e.preventDefault();
    if (e.button !== 0 && e.button !== 1) return;
    const p = elPt(e), hit = e.button === 0 && EL.tool === 'select' ? elHit(p) : null;
    EL.down = { sx:e.clientX, sy:e.clientY, vb:Object.assign({}, EL.vb), moved:false };
    if (hit && hit.kind !== 'mod') EL.drag = elIniciaArrasto(hit, p);
    else if (e.button === 1 || (EL.tool === 'select' && !hit)){ EL.panning = true; canvas.classList.add('panning'); }
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener('pointermove', e => {
    const p = elPt(e);
    if (EL.down){
      const dx = e.clientX - EL.down.sx, dy = e.clientY - EL.down.sy;
      if (Math.hypot(dx, dy) > 3) EL.down.moved = true;
      if (EL.panning){ const s = elEscala(); EL.vb.x = EL.down.vb.x - dx * s; EL.vb.y = EL.down.vb.y - dy * s; elAplicaVB(); return; }
      if (EL.drag && EL.down.moved){ elArrasta(p); EL.hover = p; elPreview(); return; }
    }
    EL.hover = p; elPreview();
  });
  svg.addEventListener('pointerup', e => {
    const d = EL.down; EL.down = null;
    if (EL.drag){
      const dr = EL.drag; EL.drag = null;
      if (d && d.moved){
        if (dr.kind === 'door') elLimpaCortesNasPortas();
        EL.undo.push(dr.snap); EL.redo = []; elSalvar(); elLog(dr.msg());
        return;
      }
    }
    if (EL.panning){ EL.panning = false; canvas.classList.remove('panning'); if (d && d.moved) return; }
    if (d && !d.moved && e.button === 0) elClick(elPt(e));
  });
  svg.addEventListener('pointerleave', () => { EL.hover = null; elPreview(); });
  svg.addEventListener('contextmenu', e => { e.preventDefault(); elEsc(); });
  svg.addEventListener('wheel', e => { e.preventDefault(); elZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, elPt(e)); }, { passive:false });

  elFit(); elTool('select', true); elLogRender(); elAtualiza();
}

/* ---------- Estado e vista ---------- */
const elCfg = () => elevCfg(EL.proj, EL.w);
const elMods = () => modulosParede(EL.plan, EL.w, elCfg());
function elPt(e){
  const svg = $('#el-svg'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x:r.x, y:r.y };
}
function elEscala(){ const c = $('#el-canvas'); return Math.max(EL.vb.w / Math.max(c.clientWidth, 1), EL.vb.h / Math.max(c.clientHeight, 1)); }
function elAplicaVB(){ $('#el-svg').setAttribute('viewBox', `${r1(EL.vb.x)} ${r1(EL.vb.y)} ${r1(EL.vb.w)} ${r1(EL.vb.h)}`); }
function elFit(){
  const L = wallLen(EL.w), H = elCfg().altura, m = Math.max(L, H * 1.6) / 42;
  EL.vb = { x:-m * 7, y:-m * 6.5, w:L + m * 11, h:H + m * 9 }; elAplicaVB();
}
function elZoom(f, p){
  const nw = EL.vb.w * f; if (nw < 300 || nw > 200000) return;
  p = p || { x:EL.vb.x + EL.vb.w / 2, y:EL.vb.y + EL.vb.h / 2 };
  EL.vb = { x:p.x - (p.x - EL.vb.x) * f, y:p.y - (p.y - EL.vb.y) * f, w:nw, h:EL.vb.h * f };
  elAplicaVB(); elRender(); elPreview();
}
function elGrade(){ EL.grade = !EL.grade; $('#el-grade').classList.toggle('on', EL.grade); elLog(`GRADE ${EL.grade ? 'ligado (10 mm)' : 'desligado (1 mm)'}`); }
const elArred = v => { const st = EL.grade ? 10 : 1; return Math.round(v / st) * st; };
function elTool(t, silencioso){
  EL.tool = t; if (t !== 'select') EL.sel = null;
  $$('[data-eltool]').forEach(b => b.classList.toggle('active', b.dataset.eltool === t));
  $('#el-grade').classList.toggle('on', EL.grade);
  if (!silencioso && t !== 'select') elLog({ split:'DIVIDIR', erase:'APAGAR' }[t]);
  elRender(); elPreview(); elPainel();
}
function elEsc(){
  if (EL.tool !== 'select'){ elTool('select', true); elLog('*Cancelado*'); }
  else if (EL.sel){ EL.sel = null; elRender(); elPainel(); }
  elPreview();
}
function elLog(msg){ EL.hist.push(msg); if (EL.hist.length > 3) EL.hist.shift(); elLogRender(); }
function elLogRender(){ const h = $('#el-hist'); if (h) h.textContent = EL.hist.join('\n'); }
function elAtualiza(){ elRender(); elPreview(); elPainel(); elLista(); elMateriais(); }

/* ---------- Modelo: cortes e atributos ---------- */
function elMaterializa(){
  const w = EL.w; w.elev = w.elev || {};
  if (!w.elev.cortes) w.elev.cortes = cortesAuto(EL.plan, w, elCfg());
  if (!w.elev.attr) w.elev.attr = {};
}
function elLimites(x){
  const bs = [0]; elMods().forEach(m => bs.push(m.x + m.w));
  let a = 0, b = wallLen(EL.w);
  bs.forEach(v => { if (v < x - 0.6 && v > a) a = v; if (v > x + 0.6 && v < b) b = v; });
  return [a + MIN_MOD, b - MIN_MOD];
}
function elMoveCorte(x0, x1){
  elMaterializa(); const e = EL.w.elev, i = e.cortes.findIndex(c => Math.abs(c - x0) < 0.6);
  if (i < 0) return false;
  e.cortes[i] = x1;
  const k0 = String(Math.round(x0)), k1 = String(Math.round(x1));
  if (k0 !== k1 && e.attr[k0]){ e.attr[k1] = e.attr[k0]; delete e.attr[k0]; }
  return true;
}
function elValidaCorte(x){
  const m = elMods().find(v => v.tipo !== 'porta' && x > v.x && x < v.x + v.w);
  if (!m) return 'A posição precisa ficar dentro de um módulo (não sobre uma porta)';
  if (x - m.x < MIN_MOD || m.x + m.w - x < MIN_MOD) return `Cada parte precisa ter pelo menos ${MIN_MOD} mm`;
  return null;
}
function elAddCorte(x){
  const m = elMods().find(v => v.tipo !== 'porta' && x > v.x && x < v.x + v.w); if (!m) return;
  elMaterializa(); const e = EL.w.elev;
  e.cortes.push(x); e.cortes.sort((a, b) => a - b);
  const pai = e.attr[String(Math.round(m.x))]; if (pai) e.attr[String(Math.round(x))] = Object.assign({}, pai);
}
function elDelCorte(x){
  elMaterializa(); const e = EL.w.elev, i = e.cortes.findIndex(c => Math.abs(c - x) < 0.6);
  if (i < 0) return false;
  e.cortes.splice(i, 1); delete e.attr[String(Math.round(x))]; return true;
}
function elSetAttr(xMod, obj){
  elMaterializa(); const k = String(Math.round(xMod)), e = EL.w.elev;
  e.attr[k] = Object.assign({}, e.attr[k], obj);
}
function elLimpaCortesNasPortas(){
  const e = EL.w.elev; if (!e || !e.cortes) return;
  const ps = portasDaParede(EL.plan, EL.w);
  e.cortes = e.cortes.filter(c => !ps.some(p => c > p.a - 0.5 && c < p.b + 0.5));
}
const elSnap = () => JSON.stringify({ elev:EL.w.elev || null, doors:EL.plan.doors });
function elCommit(fn){
  EL.undo.push(elSnap()); if (EL.undo.length > 100) EL.undo.shift();
  EL.redo = []; fn(); elSalvar();
}
function elSalvar(){
  if (!EL.histOk){ registrar(EL.proj, `Elevação ${letras(EL.plan)[EL.w.id]} editada`); EL.histOk = true; }
  EL.proj.atualizado = hoje(); saveDB(); elAtualiza();
}
function elRestaura(json){
  const s = JSON.parse(json);
  if (s.elev) EL.w.elev = s.elev; else delete EL.w.elev;
  EL.plan.doors = s.doors; EL.sel = null; elSalvar();
}
function elUndo(){ if (!EL.undo.length){ elLog('Nada para desfazer'); return; } EL.redo.push(elSnap()); elRestaura(EL.undo.pop()); elLog('Desfeito'); }
function elRedo(){ if (!EL.redo.length){ elLog('Nada para refazer'); return; } EL.undo.push(elSnap()); elRestaura(EL.redo.pop()); elLog('Refeito'); }
function elRemodular(){
  elCommit(() => { if (EL.w.elev){ delete EL.w.elev.cortes; delete EL.w.elev.attr; } EL.sel = null; });
  elLog('Modulação automática refeita');
}

/* ---------- Seleção e arrasto ---------- */
function elHit(p){
  const cfg = elCfg(), H = cfg.altura, L = wallLen(EL.w), tol = 7 * elEscala(), mods = elMods();
  if (p.x < -tol || p.x > L + tol || p.y < -tol || p.y > H + tol) return null;
  for (const x of montantesMoveis(mods)) if (Math.abs(p.x - x) < tol) return { kind:'cut', x };
  for (const m of mods) if (m.tipo === 'misto' && p.x > m.x && p.x < m.x + m.w && Math.abs(p.y - (H - m.trav)) < tol) return { kind:'trav', x:Math.round(m.x) };
  const m = mods.find(v => p.x >= v.x && p.x <= v.x + v.w);
  if (!m) return null;
  return m.tipo === 'porta' ? { kind:'door', id:m.door } : { kind:'mod', x:Math.round(m.x) };
}
function elIniciaArrasto(hit, p){
  const snap = elSnap(), Ls = letras(EL.plan)[EL.w.id];
  if (hit.kind === 'cut'){
    const lim = elLimites(hit.x), d = { kind:'cut', snap, cur:hit.x, lim };
    d.msg = () => `Montante movido para ${cotaTxt(d.cur)} mm`;
    EL.sel = { kind:'cut', x:hit.x }; return d;
  }
  if (hit.kind === 'trav'){
    const d = { kind:'trav', snap, x:hit.x, z:0 };
    d.msg = () => `Travessa a ${cotaTxt(d.z)} mm do piso`;
    EL.sel = { kind:'mod', x:hit.x }; return d;
  }
  const door = EL.plan.doors.find(x => x.id === hit.id), L = wallLen(EL.w);
  const d = { kind:'door', snap, door, c0:door.t * L, px0:p.x };
  d.msg = () => `Porta a ${cotaTxt(door.t * L - (door.w || 800) / 2)} mm do início da parede ${Ls}`;
  EL.sel = { kind:'door', id:hit.id }; return d;
}
function elArrasta(p){
  const d = EL.drag, cfg = elCfg(), H = cfg.altura, L = wallLen(EL.w);
  if (d.kind === 'cut'){
    const x = Math.min(Math.max(elArred(p.x), d.lim[0]), d.lim[1]);
    if (elMoveCorte(d.cur, x)){ d.cur = x; EL.sel = { kind:'cut', x }; }
  } else if (d.kind === 'trav'){
    d.z = Math.min(Math.max(elArred(H - p.y), cfg.rodape + 200), H - 200);
    elSetAttr(d.x, { trav:d.z });
  } else {
    const dw = d.door.w || 800;
    const c = Math.min(Math.max(elArred(d.c0 + p.x - d.px0 - dw / 2) + dw / 2, dw / 2), L - dw / 2);
    d.door.t = c / L;
  }
  elRender(); elPainel();
}
function elClick(p){
  if (EL.tool === 'split'){
    const x = elArred(p.x), erro = elValidaCorte(x);
    if (erro) elLog(erro); else { elCommit(() => elAddCorte(x)); elLog(`Montante criado a ${cotaTxt(x)} mm do início`); }
    return;
  }
  if (EL.tool === 'erase'){
    const h = elHit(p);
    if (h && h.kind === 'cut'){ elCommit(() => elDelCorte(h.x)); elLog(`Montante a ${cotaTxt(h.x)} mm apagado`); }
    else elLog('Clique sobre um montante entre dois módulos');
    return;
  }
  const h = elHit(p);
  EL.sel = !h ? null : h.kind === 'trav' ? { kind:'mod', x:h.x } : h;
  elRender(); elPainel();
}

/* ---------- Linha de comando ---------- */
function elComando(v){
  const txt = String(v || '').trim();
  if (!txt){ if (EL.tool !== 'select') elTool('select', true); elPreview(); return; }
  EL.ultimaEntrada = txt;
  const up = txt.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), c = EL_CMDS[up];
  if (c){
    if (c === 'undo') return elUndo();
    if (c === 'redo') return elRedo();
    if (c === 'fit'){ elFit(); elRender(); elLog('ZOOM ajustado'); return; }
    if (c === 'auto') return elRemodular();
    return elTool(c);
  }
  const n = numPlano(txt);
  if (isNaN(n)){ elLog(`Comando desconhecido: ${txt}  (S selecionar · D dividir · E apagar · U desfazer · AUTO remodular)`); return; }
  elLog(`> ${txt}`);
  if (EL.tool === 'split'){
    const x = r1(n), erro = elValidaCorte(x);
    if (erro) elLog(erro); else { elCommit(() => elAddCorte(x)); elLog(`Montante criado a ${dec(x)} mm do início`); }
    return;
  }
  if (EL.sel && EL.sel.kind === 'cut') return elPosicionaCorte(EL.sel.x, n);
  if (EL.sel && EL.sel.kind === 'mod') return elLarguraModulo(EL.sel.x, n);
  elLog('Selecione um módulo (o número vira a largura) ou um montante (o número vira a posição)');
}
function elPosicionaCorte(x0, x1){
  const lim = elLimites(x0); x1 = r1(x1);
  if (x1 < lim[0] || x1 > lim[1]){ elLog(`Posição entre ${cotaTxt(lim[0])} e ${cotaTxt(lim[1])} mm`); elPainel(); return; }
  elCommit(() => { elMoveCorte(x0, x1); EL.sel = { kind:'cut', x:x1 }; });
  elLog(`Montante a ${dec(x1)} mm do início`);
}
function elLarguraModulo(xMod, larg){
  const mods = elMods(), m = mods.find(v => v.tipo !== 'porta' && Math.round(v.x) === xMod), mov = montantesMoveis(mods);
  if (!m) return;
  const dir = mov.find(x => Math.abs(x - (m.x + m.w)) < 0.6), esq = mov.find(x => Math.abs(x - m.x) < 0.6);
  if (dir !== undefined) return elPosicionaCorte(dir, m.x + larg);
  if (esq !== undefined){
    const novo = m.x + m.w - larg, lim = elLimites(esq);
    if (novo < lim[0] || novo > lim[1]){ elLog(`Largura fora do limite para este módulo`); elPainel(); return; }
    elCommit(() => { elMoveCorte(esq, r1(novo)); EL.sel = { kind:'mod', x:Math.round(novo) }; });
    elLog(`Módulo com ${dec(larg)} mm`); return;
  }
  elLog('Este módulo ocupa o vão inteiro. Divida-o (D) para poder mudar a largura.'); elPainel();
}

/* ---------- Desenho ---------- */
function elRender(){
  const g = $('#el-layer'); if (!g || !EL) return;
  const cfg = elCfg(), n = elMods().length;
  g.innerHTML = elevMarkup(EL.proj, EL.plan, EL.w, { fs:11 * elEscala(), sel:EL.sel, alcas:true });
  $('#el-titulo').innerHTML = `Elevação ${letras(EL.plan)[EL.w.id]} · ${cotaTxt(wallLen(EL.w))} × ${cotaTxt(cfg.altura)} mm<small style="display:block;font-weight:400;font-size:12.5px">${TIPOS_PAREDE[EL.w.tipo].nome} · ${n} ${n === 1 ? 'módulo' : 'módulos'}${EL.w.elev && EL.w.elev.cortes ? ' · modulação manual' : ' · modulação automática'}</small>`;
}
function elPreview(){
  const g = $('#el-preview'); if (!g || !EL) return;
  const k = elEscala(), h = EL.hover, cfg = elCfg(), H = cfg.altura, L = wallLen(EL.w); let s = '';
  $('#el-prompt').textContent = EL_PROMPTS[EL.tool];
  const coord = $('#el-coord');
  if (!h){ coord.textContent = 'X —   Z —'; g.innerHTML = ''; return; }
  const x = Math.min(Math.max(elArred(h.x), 0), L), z = Math.min(Math.max(elArred(H - h.y), 0), H);
  coord.textContent = `X ${dec(x).padStart(7)}   Z ${dec(z).padStart(7)}`;
  s += `<line x1="${r1(EL.vb.x)}" y1="${r1(h.y)}" x2="${r1(EL.vb.x + EL.vb.w)}" y2="${r1(h.y)}" stroke="#14337a" stroke-opacity=".3" stroke-width="${r1(k)}"/>`
    + `<line x1="${r1(h.x)}" y1="${r1(EL.vb.y)}" x2="${r1(h.x)}" y2="${r1(EL.vb.y + EL.vb.h)}" stroke="#14337a" stroke-opacity=".3" stroke-width="${r1(k)}"/>`
    + `<rect x="${r1(h.x - 5 * k)}" y="${r1(h.y - 5 * k)}" width="${r1(10 * k)}" height="${r1(10 * k)}" fill="none" stroke="#14337a" stroke-width="${r1(1.2 * k)}"/>`;
  if (EL.drag){
    const d = EL.drag;
    const txt = d.kind === 'cut' ? `X ${cotaTxt(d.cur)} mm` : d.kind === 'trav' ? `travessa a ${cotaTxt(d.z)} mm` : `porta a ${cotaTxt(d.door.t * L - (d.door.w || 800) / 2)} mm`;
    s += edDica(h.x + 16 * k, h.y - 22 * k, txt, k);
  } else if (EL.tool === 'split'){
    const m = elMods().find(v => v.tipo !== 'porta' && x > v.x && x < v.x + v.w);
    if (m && h.y > -8 * k && h.y < H + 8 * k){
      const ok = x - m.x >= MIN_MOD && m.x + m.w - x >= MIN_MOD;
      s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${ok ? '#0b8fb3' : '#e0533f'}" stroke-width="${PERFIL}" stroke-opacity=".6"/>`
        + edDica(h.x + 16 * k, h.y - 22 * k, `${cotaTxt(x - m.x)} | ${cotaTxt(m.x + m.w - x)} mm`, k);
    }
  } else {
    const hit = elHit(h);
    if (hit && hit.kind === 'cut') s += `<line x1="${hit.x}" y1="0" x2="${hit.x}" y2="${H}" stroke="${EL.tool === 'erase' ? '#e0533f' : '#53d4f0'}" stroke-width="${r1(PERFIL + 8 * k)}" stroke-opacity=".5"/>`;
    else if (hit && hit.kind === 'trav' && EL.tool === 'select'){
      const m = elMods().find(v => Math.round(v.x) === hit.x);
      if (m) s += `<line x1="${r1(m.x)}" y1="${H - m.trav}" x2="${r1(m.x + m.w)}" y2="${H - m.trav}" stroke="#53d4f0" stroke-width="${r1(PERFIL + 8 * k)}" stroke-opacity=".5"/>`;
    }
  }
  g.innerHTML = s;
}

/* ---------- Painéis laterais ---------- */
function elLista(){
  const el = $('#el-lista'); if (!el || !EL) return;
  const proj = EL.proj, plan = EL.plan, Ls = letras(plan);
  el.innerHTML = divisoriasDoProjeto(proj).map(d => { const n = modulosParede(plan, d, elevCfg(proj, d)).length; return `
    <button class="wall-item ${d.id === EL.w.id ? 'active' : ''}" data-w="${d.id}">
      <span class="wall-tag">${Ls[d.id]}</span>
      <span><b>${cotaTxt(wallLen(d))} mm</b><small>${TIPOS_PAREDE[d.tipo].nome} · ${n} ${n === 1 ? 'módulo' : 'módulos'}</small></span>
    </button>`; }).join('');
  $$('[data-w]', el).forEach(b => b.addEventListener('click', () => { elevSel[proj.id] = b.dataset.w; abaElevacoes(proj); }));
}
function elMateriais(){
  const el = $('#el-mat'); if (!el || !EL) return;
  const Ls = letras(EL.plan)[EL.w.id];
  const pecas = agrupa(pecasParede(EL.proj, EL.plan, EL.w), p => `${p.peca}|${p.l}|${p.a}`, p => ({ peca:p.peca, l:p.l, a:p.a, q:0, paredes:new Set() }));
  const perfis = agrupa(perfisParede(EL.proj, EL.plan, EL.w), p => `${p.nome}|${p.c}`, p => ({ nome:p.nome, c:p.c, q:0, paredes:new Set() }));
  el.innerHTML = `
    <div class="card-head"><h3>Materiais da parede ${Ls}</h3><a href="#/projetos/${esc(EL.proj.id)}/materiais">Ver tudo</a></div>
    <div class="prop-sec" style="margin-top:0">Vidros, painéis e portas</div>
    <div class="table-wrap"><table class="pecas"><thead><tr><th>Peça</th><th class="r">L</th><th class="r">A</th><th class="r">Qtd.</th></tr></thead>
      <tbody>${pecas.map(p => `<tr><td>${p.peca}</td><td class="r num">${p.l}</td><td class="r num">${p.a}</td><td class="r num">${p.q}</td></tr>`).join('')}</tbody></table></div>
    <div class="prop-sec">Perfis de alumínio</div>
    <div class="table-wrap"><table class="pecas"><thead><tr><th>Perfil</th><th class="r">Comprimento</th><th class="r">Qtd.</th></tr></thead>
      <tbody>${perfis.map(p => `<tr><td>${p.nome}</td><td class="r num">${p.c}</td><td class="r num">${p.q}</td></tr>`).join('')}</tbody></table></div>`;
}
function elPainel(){
  const P = $('#el-props'); if (!P || !EL) return;
  const cfg = elCfg(), H = cfg.altura, L = wallLen(EL.w), mods = elMods(), mov = montantesMoveis(mods), sel = EL.sel, Lt = letras(EL.plan)[EL.w.id];
  const inp = (id, rot, val, dis) => `<div><label for="${id}">${rot}</label><div class="input-suffix"><input id="${id}" value="${val}" inputmode="decimal"${dis ? ' disabled' : ''}><em>mm</em></div></div>`;
  const ligar = (id, fn) => { const el = $('#' + id); if (!el) return; el.addEventListener('change', () => { const v = numPlano(el.value); if (isNaN(v)) return elPainel(); fn(v); }); el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); }); };

  if (sel && sel.kind === 'mod'){
    const m = mods.find(v => v.tipo !== 'porta' && Math.round(v.x) === sel.x);
    if (!m){ EL.sel = null; return elPainel(); }
    const dir = mov.some(x => Math.abs(x - (m.x + m.w)) < 0.6), esq = mov.some(x => Math.abs(x - m.x) < 0.6);
    P.innerHTML = `<h3>Módulo ${m.idx + 1} da parede ${Lt}</h3>
      <p class="prop-empty" style="margin-top:4px">Começa a ${cotaTxt(m.x)} mm do início</p>
      <div class="prop-grid">${inp('em-w', 'Largura', dec(m.w), !dir && !esq)}
        <div><label for="em-tipo">Tipo</label><select id="em-tipo">${Object.keys(TIPOS_MODULO).map(k => `<option value="${k}" ${k === m.tipo ? 'selected' : ''}>${TIPOS_MODULO[k]}</option>`).join('')}</select></div>
        ${m.tipo === 'misto' ? inp('em-trav', 'Travessa (do piso)', dec(m.trav)) : ''}</div>
      <div class="btn-row">
        <button class="btn btn-outline btn-sm" data-div="2">Dividir em 2</button>
        <button class="btn btn-outline btn-sm" data-div="3">Dividir em 3</button>
        ${dir ? `<button class="btn btn-outline btn-sm" id="em-junta">Juntar com o da direita</button>` : ''}
      </div>
      <div class="btn-row"><button class="btn btn-outline btn-sm" id="em-todos">Aplicar tipo${m.tipo === 'misto' ? ' e travessa' : ''} à parede inteira</button></div>
      <p class="form-note">${ico('info')}${dir || esq ? 'Arraste os quadradinhos azuis ou digite a largura na linha de comando.' : 'Módulo único no vão: divida para criar montantes móveis.'}</p>`;
    ligar('em-w', v => elLarguraModulo(sel.x, v));
    ligar('em-trav', v => {
      if (v < cfg.rodape + 200 || v > H - 200){ toast(`Travessa entre ${cotaTxt(cfg.rodape + 200)} e ${cotaTxt(H - 200)} mm.`, 'alert'); return elPainel(); }
      elCommit(() => elSetAttr(sel.x, { trav:r1(v) })); elLog(`Travessa a ${dec(v)} mm do piso`);
    });
    $('#em-tipo').addEventListener('change', e => { elCommit(() => elSetAttr(sel.x, { tipo:e.target.value })); elLog(`Módulo: ${TIPOS_MODULO[e.target.value]}`); });
    $$('[data-div]', P).forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.div, parte = m.w / n;
      if (parte < MIN_MOD){ toast('Módulo estreito demais para dividir.', 'alert'); return; }
      elCommit(() => { for (let i = 1; i < n; i++) elAddCorte(Math.round(m.x + parte * i)); });
      elLog(`Módulo dividido em ${n} partes de ${cotaTxt(parte)} mm`);
    }));
    const j = $('#em-junta'); if (j) j.addEventListener('click', () => { elCommit(() => elDelCorte(m.x + m.w)); elLog('Módulos unidos'); });
    $('#em-todos').addEventListener('click', () => {
      elCommit(() => mods.forEach(v => { if (v.tipo !== 'porta') elSetAttr(v.x, m.tipo === 'misto' ? { tipo:m.tipo, trav:m.trav } : { tipo:m.tipo }); }));
      elLog(`Parede ${Lt}: todos os módulos como ${TIPOS_MODULO[m.tipo]}`);
    });
  } else if (sel && sel.kind === 'cut'){
    const i = mods.findIndex(v => Math.abs(v.x - sel.x) < 0.6), a = mods[i - 1], b = mods[i];
    if (i < 1){ EL.sel = null; return elPainel(); }
    P.innerHTML = `<h3>Montante</h3><p class="prop-empty" style="margin-top:4px">Entre os módulos ${a.idx + 1} e ${b.idx + 1} da parede ${Lt}</p>
      <div class="prop-grid">${inp('ec-x', 'Posição (do início)', dec(sel.x))}<div></div>
        ${inp('ec-a', 'Módulo à esquerda', dec(a.w))}${inp('ec-b', 'Módulo à direita', dec(b.w))}</div>
      <div class="btn-row"><button class="btn btn-danger btn-sm" id="ec-del">${ico('trash')}Apagar montante</button></div>
      <p class="form-note">${ico('info')}Arraste o montante na elevação ou digite a posição exata.</p>`;
    ligar('ec-x', v => elPosicionaCorte(sel.x, v));
    ligar('ec-a', v => elPosicionaCorte(sel.x, a.x + v));
    ligar('ec-b', v => elPosicionaCorte(sel.x, b.x + b.w - v));
    $('#ec-del').addEventListener('click', () => { const x = sel.x; elCommit(() => { elDelCorte(x); EL.sel = null; }); elLog('Montante apagado'); });
  } else if (sel && sel.kind === 'door'){
    const d = EL.plan.doors.find(x => x.id === sel.id);
    if (!d){ EL.sel = null; return elPainel(); }
    const dw = d.w || 800, dist = d.t * L - dw / 2;
    P.innerHTML = `<h3>Porta</h3><p class="prop-empty" style="margin-top:4px">Na parede ${Lt} · a mesma porta da planta</p>
      <div class="prop-grid">${inp('ed-w', 'Largura da folha', dec(dw))}${inp('ed-d', 'Distância do início', dec(dist))}${inp('ed-h', 'Altura da porta', dec(cfg.portaAlt))}</div>
      <p class="form-note">${ico('info')}Arraste a porta para os lados. A mudança vale também na planta.</p>`;
    ligar('ed-w', v => {
      if (!(v >= 400 && v <= L - 20)){ toast(`Largura entre 400 e ${cotaTxt(L - 20)} mm.`, 'alert'); return elPainel(); }
      elCommit(() => { d.w = r1(v); d.t = Math.min(Math.max((dist + v / 2) / L, v / 2 / L), 1 - v / 2 / L); elLimpaCortesNasPortas(); });
      elLog(`Porta com ${dec(v)} mm`);
    });
    ligar('ed-d', v => {
      if (!(v >= 0 && v <= L - dw)){ toast(`Distância entre 0 e ${cotaTxt(L - dw)} mm.`, 'alert'); return elPainel(); }
      elCommit(() => { d.t = (v + dw / 2) / L; elLimpaCortesNasPortas(); }); elLog(`Porta a ${dec(v)} mm do início`);
    });
    ligar('ed-h', v => elCfgSalva('portaAlt', v, 1800, 3000));
  } else {
    P.innerHTML = `<h3>Parede ${Lt}</h3>
      <div class="prop-grid">
        ${inp('ep-alt', 'Altura total', cfg.altura)}${inp('ep-rod', 'Rodapé', cfg.rodape)}
        ${inp('ep-tra', 'Travessa padrão', cfg.travessa)}${inp('ep-por', 'Altura da porta', cfg.portaAlt)}
        ${inp('ep-mod', 'Módulo máximo (auto)', cfg.modMax)}
      </div>
      <div class="prop-empty" style="margin-top:14px;line-height:1.6">
        <b>Clique</b> num módulo, montante ou porta para editar.<br>
        <b>Arraste</b> um montante para mudar as larguras, a travessa para mudar a altura, a porta para reposicionar.<br>
        <b>D</b> + Enter divide um módulo · <b>E</b> + Enter apaga um montante · <b>Ctrl+Z</b> desfaz.</div>`;
    ligar('ep-alt', v => elCfgSalva('altura', v, 1000, 6000));
    ligar('ep-rod', v => elCfgSalva('rodape', v, 0, 400));
    ligar('ep-tra', v => elCfgSalva('travessa', v, 300, 2500));
    ligar('ep-por', v => elCfgSalva('portaAlt', v, 1800, 3000));
    ligar('ep-mod', v => elCfgSalva('modMax', v, 300, 3000));
  }
}
function elCfgSalva(chave, v, min, max){
  v = Math.round(v);
  if (!(v >= min && v <= max)){ toast(`Use um valor entre ${min} e ${max} mm.`, 'alert'); return elPainel(); }
  elCommit(() => {
    EL.w.elev = EL.w.elev || {}; EL.w.elev[chave] = v;
    if (chave === 'modMax'){ delete EL.w.elev.cortes; delete EL.w.elev.attr; }
  });
  const nomes = { altura:'Altura total', rodape:'Rodapé', travessa:'Travessa padrão', portaAlt:'Altura da porta', modMax:'Módulo máximo' };
  elLog(`${nomes[chave]}: ${v} mm`);
  if (chave === 'altura'){ elFit(); elRender(); }
}

document.addEventListener('keydown', e => {
  if (!EL || !$('#el-svg')) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag) || !$('#modal-back').hidden || $('#viewer-root').innerHTML) return;
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? elRedo() : elUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'y'){ e.preventDefault(); elRedo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'F9'){ e.preventDefault(); elGrade(); return; }
  if (k === 'Escape'){ elEsc(); return; }
  if ((k === 'Delete' || k === 'Backspace') && EL.sel && EL.sel.kind === 'cut'){ e.preventDefault(); const x = EL.sel.x; elCommit(() => { elDelCorte(x); EL.sel = null; }); elLog('Montante apagado'); return; }
  if (k === 'Enter' || k === ' '){ e.preventDefault(); elComando(''); return; }
  if (k.length === 1){ e.preventDefault(); const c = $('#el-cmd'); c.focus(); c.value += k; }
});

/* ============================================================
   MATERIAIS DO PROJETO
============================================================ */
function abaMateriais(proj){
  const pecas = pecasProjeto(proj), pf = perfisProjeto(proj), ac = acessoriosProjeto(proj);
  if (!divisoriasDoProjeto(proj).length){
    $('#pj-aba').innerHTML = `<div class="card empty">${ico('pedidos')}<div>Nenhuma divisória na planta ainda.<br><a href="#/projetos/${esc(proj.id)}/planta">Desenhe as divisórias</a> para gerar a lista de materiais.</div></div>`;
    return;
  }
  const totBarras = pf.resumo.reduce((s, r) => s + r.barras, 0), totPerfil = pf.resumo.reduce((s, r) => s + r.total, 0);
  const nVid = pecas.filter(p => p.peca === 'Vidro temperado').reduce((s, p) => s + p.q, 0);
  const nCeg = pecas.filter(p => p.peca === 'Painel cego').reduce((s, p) => s + p.q, 0);
  const nPor = pecas.filter(p => p.peca.startsWith('Porta')).reduce((s, p) => s + p.q, 0);
  $('#pj-aba').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="kpi-label">Vidros</div><div class="kpi-value num">${nVid}</div><div class="kpi-delta">peças de vidro temperado</div></div>
      <div class="card kpi"><div class="kpi-label">Painéis cegos</div><div class="kpi-value num">${nCeg}</div><div class="kpi-delta">peças</div></div>
      <div class="card kpi"><div class="kpi-label">Portas</div><div class="kpi-value num">${nPor}</div><div class="kpi-delta">com ferragens</div></div>
      <div class="card kpi kpi-dark"><div class="kpi-label">Perfis de alumínio</div><div class="kpi-value num">${totBarras} barras</div><div class="kpi-delta">de 6 m · ${fmm(totPerfil)} mm cortados</div></div>
    </div>
    <div class="toolbar">
      <p class="form-note" style="margin:0">${ico('info')}Lista calculada a partir da planta e das elevações. Medidas em mm, com ${PERFIL} mm de perfil descontados. Conferir antes do corte.</p>
      <button class="btn btn-primary btn-sm" id="mt-csv">${ico('download')}Exportar tudo para Excel (CSV)</button>
    </div>
    <div class="grid-half">
      <div class="card card-pad">
        <div class="card-head"><h3>Vidros, painéis e portas</h3><small>${pecas.length} medidas diferentes</small></div>
        <div class="table-wrap"><table class="pecas">
          <thead><tr><th>Peça</th><th class="r">Largura</th><th class="r">Altura</th><th class="r">Qtd.</th><th>Paredes</th></tr></thead>
          <tbody>${pecas.map(p => `<tr><td>${p.peca}</td><td class="r num">${p.l}</td><td class="r num">${p.a}</td><td class="r num">${p.q}</td><td class="td-muted">${p.paredes}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div>
        <div class="card card-pad">
          <div class="card-head"><h3>Perfis de alumínio · barras de 6 m</h3><small>${totBarras} barras</small></div>
          <div class="table-wrap"><table class="pecas">
            <thead><tr><th>Perfil</th><th class="r">Peças</th><th class="r">Total (mm)</th><th class="r">Barras</th><th class="r">Sobra (mm)</th></tr></thead>
            <tbody>${pf.resumo.map(r => `<tr><td>${r.nome}</td><td class="r num">${r.pecas}</td><td class="r num">${fmm(r.total)}</td><td class="r num"><b>${r.barras}</b></td><td class="r num td-muted">${fmm(r.sobra)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card card-pad section-gap">
          <div class="card-head"><h3>Ferragens e acessórios</h3></div>
          <div class="table-wrap"><table class="pecas">
            <thead><tr><th>Item</th><th class="r">Quantidade</th><th></th></tr></thead>
            <tbody>${ac.map(a => `<tr><td>${a.item}</td><td class="r num">${a.un === 'mm' ? fmm(a.q) : a.q} ${a.un}</td><td class="td-muted">${a.obs || ''}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>
    </div>
    <div class="card card-pad section-gap">
      <div class="card-head"><h3>Lista de corte dos perfis</h3><small>${pf.corte.reduce((s, c) => s + c.q, 0)} cortes</small></div>
      <div class="table-wrap"><table class="pecas">
        <thead><tr><th>Perfil</th><th class="r">Comprimento (mm)</th><th class="r">Quantidade</th><th>Paredes</th></tr></thead>
        <tbody>${pf.corte.map(c => `<tr><td>${c.nome}</td><td class="r num">${c.c}</td><td class="r num">${c.q}</td><td class="td-muted">${c.paredes}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  $('#mt-csv').addEventListener('click', () => {
    const L = [['VIDROS, PAINÉIS E PORTAS'], ['Peça', 'Largura (mm)', 'Altura (mm)', 'Quantidade', 'Paredes']]
      .concat(pecas.map(p => [p.peca, p.l, p.a, p.q, p.paredes]))
      .concat([[], ['PERFIS DE ALUMÍNIO — BARRAS DE 6 M'], ['Perfil', 'Peças', 'Total (mm)', 'Barras', 'Sobra (mm)']])
      .concat(pf.resumo.map(r => [r.nome, r.pecas, r.total, r.barras, r.sobra]))
      .concat([[], ['LISTA DE CORTE DOS PERFIS'], ['Perfil', 'Comprimento (mm)', 'Quantidade', 'Paredes']])
      .concat(pf.corte.map(c => [c.nome, c.c, c.q, c.paredes]))
      .concat([[], ['FERRAGENS E ACESSÓRIOS'], ['Item', 'Quantidade', 'Unidade', 'Observação']])
      .concat(ac.map(a => [a.item, a.q, a.un, a.obs || '']));
    const csv = '﻿' + L.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    baixarBlob(new Blob([csv], { type:'text/csv;charset=utf-8' }), `${proj.id} - materiais.csv`);
    toast('Lista de materiais exportada.', 'download');
  });
}

/* ============================================================
   ARQUIVOS
============================================================ */
async function enviarArquivos(proj, files){
  let ok = 0;
  for (const f of files){
    if (f.size > LIMITE_UPLOAD){ toast(`${f.name} passa de 25 MB e não foi enviado.`, 'alert'); continue; }
    const ext = (f.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
    const blobId = uid('b'); await FileStore.put(blobId, f);
    proj.arquivos.unshift(arquivo(uid('a'), f.name.replace(/\.[^.]+$/, ''), categoriaDeExt(ext), 'elaboracao',
      [versao('R01', hoje(), usuario().nome, { blobId, mime:f.type, ext, tamanho:f.size })]));
    registrar(proj, `Arquivo enviado: ${f.name}`); ok++;
  }
  if (ok){ saveDB(); toast(ok === 1 ? 'Arquivo enviado.' : `${ok} arquivos enviados.`, 'upload'); }
}

function abaArquivos(proj){
  $('#pj-aba').innerHTML = `
    <div class="dropzone" id="pj-drop" tabindex="0">${ico('upload')}<b>Arraste arquivos para cá ou clique para escolher</b>
      PDF, imagens, DWG, planilhas · até 25 MB cada · ficam salvos neste navegador</div>
    <div class="card card-pad">
      <div class="card-head"><h3>Arquivos da obra</h3><small>${proj.arquivos.length} ${proj.arquivos.length === 1 ? 'documento' : 'documentos'}</small></div>
      ${proj.arquivos.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Documento</th><th>Revisão</th><th>Situação</th><th>Atualizado</th><th class="r">Tamanho</th><th></th></tr></thead>
        <tbody>${proj.arquivos.map(a => { const v = a.versoes[0]; return `
          <tr class="clickable" data-arq="${esc(a.id)}">
            <td><div class="doc-cell"><span class="ext ${extClasse(v)}">${esc(extDe(v))}</span><div>${esc(a.nome)}<small>${esc(a.categoria)}${a.versoes.length > 1 ? ` · ${a.versoes.length} revisões` : ''}</small></div></div></td>
            <td>${esc(v.rev)}</td>
            <td><span class="badge ${SIT_ARQ[a.sit].cor}">${SIT_ARQ[a.sit].nome}</span></td>
            <td class="td-muted">${esc(v.data)} · ${esc(v.autor)}</td>
            <td class="r td-muted">${v.tamanho ? fmtBytes(v.tamanho) : v.gen === 'medicao' ? '6 fotos' : v.gen === 'executivo' ? 'planta, elevações e materiais' : '—'}</td>
            <td class="r"><button class="btn btn-outline btn-sm" data-abrir="${esc(a.id)}">${ico('eye')}Abrir</button></td>
          </tr>`; }).join('')}</tbody></table></div>`
      : `<div class="empty">${ico('inbox')}<div>Nenhum arquivo ainda. Envie plantas, fotos da obra ou documentos.</div></div>`}
    </div>`;
  const dz = $('#pj-drop');
  const subir = fs => enviarArquivos(proj, fs).then(() => render());
  dz.addEventListener('click', () => pedirArquivos(true, subir));
  dz.addEventListener('keydown', e => { if (e.key === 'Enter') pedirArquivos(true, subir); });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const fs = Array.from(e.dataTransfer.files || []); if (fs.length) subir(fs); });
  $$('[data-arq]').forEach(r => r.addEventListener('click', () => abrirArquivo(proj.id, r.dataset.arq)));
}

/* ---------- Visualizador ---------- */
let VW = null;
function fecharViewer(){
  const root = $('#viewer-root');
  if (!root || !root.innerHTML) return false;
  if (VW && VW.url) URL.revokeObjectURL(VW.url);
  root.innerHTML = ''; VW = null; return true;
}
async function blobDaVersao(proj, ver){
  if (ver.blobId) return FileStore.get(ver.blobId);
  if (ver.gen === 'planta') return new Blob([planSVGString(ver.snap || proj.planta, { labels:true, bg:true })], { type:'image/svg+xml' });
  if (ver.gen === 'medicao') return new Blob([medicaoSVG(proj)], { type:'image/svg+xml' });
  if (ver.gen === 'executivo') return pdfExecutivo(proj, ver);
  if (ver.gen === 'memorial') return pdfMemorial(proj, ver);
  if (ver.gen === 'proposta') return pdfProposta(proj, ver);
  return null;
}
function nomeDownload(arq, ver){
  const ext = ver.ext || (ver.gen === 'planta' || ver.gen === 'medicao' ? 'svg' : 'pdf');
  return `${arq.nome} ${ver.rev}`.replace(/[\\/:*?"<>|]/g, '-') + '.' + ext;
}
function reabrir(projId, arqId, vi){ render(); abrirArquivo(projId, arqId, vi); }

function abrirArquivo(projId, arqId, vi){
  const proj = projetoPorId(projId); if (!proj) return;
  const arq = proj.arquivos.find(a => a.id === arqId); if (!arq) return;
  if (VW && VW.url) URL.revokeObjectURL(VW.url);
  vi = vi || 0; const ver = arq.versoes[vi];
  VW = { proj, arq, vi, url:null, zoom:1 };
  const coments = proj.comentarios.filter(c => c.arq === arq.id);
  $('#viewer-root').innerHTML = `
    <div class="viewer" role="dialog" aria-modal="true" aria-label="${esc(arq.nome)}">
      <div class="viewer-head">
        <span class="ext ${extClasse(ver)}">${esc(extDe(ver))}</span>
        <div class="grow"><h3>${esc(arq.nome)}</h3><small>${esc(proj.id)} · ${esc(proj.nome)} · ${esc(arq.categoria)}</small></div>
        <select id="vw-ver" aria-label="Revisão">${arq.versoes.map((v, i) => `<option value="${i}" ${i === vi ? 'selected' : ''}>Revisão ${esc(v.rev)}${i === 0 ? ' (atual)' : ''}</option>`).join('')}</select>
        <select id="vw-sit" aria-label="Situação">${Object.keys(SIT_ARQ).map(k => `<option value="${k}" ${k === arq.sit ? 'selected' : ''}>${SIT_ARQ[k].nome}</option>`).join('')}</select>
        <button class="btn vbtn btn-sm" id="vw-up">${ico('upload')}Nova revisão</button>
        <button class="btn vbtn btn-sm" id="vw-dl">${ico('download')}Baixar</button>
        <button class="x-btn" id="vw-x" aria-label="Fechar">${ico('x')}</button>
      </div>
      <div class="viewer-body">
        <div class="viewer-stage" id="vw-stage"><div class="viewer-nopreview"><span class="spinner"></span></div></div>
        <aside class="viewer-side">
          <div class="sub-title">Detalhes</div>
          <div class="info-grid" style="margin-bottom:0">
            <div><small>Revisão</small><b>${esc(ver.rev)}</b></div>
            <div><small>Situação</small><b>${SIT_ARQ[arq.sit].nome}</b></div>
            <div><small>Enviado por</small><b>${esc(ver.autor)}</b></div>
            <div><small>Data</small><b>${esc(ver.data)}</b></div>
            <div><small>Formato</small><b>${esc(extDe(ver))}</b></div>
            <div><small>Tamanho</small><b>${ver.tamanho ? fmtBytes(ver.tamanho) : ver.gen === 'medicao' ? '6 fotos' : 'Gerado pelo sistema'}</b></div>
          </div>
          <div class="sub-title">Revisões</div>
          ${arq.versoes.map((v, i) => `<div class="ver-item ${i === vi ? 'active' : ''}" data-vi="${i}"><span><b>${esc(v.rev)}</b> · ${esc(v.autor)}</span><small>${esc(v.data)}</small></div>`).join('')}
          <div class="sub-title">Comentários deste arquivo</div>
          <div id="vw-coments">${coments.length ? coments.map(c => `
            <div class="comment" style="padding:10px 0"><span class="avatar sm">${esc(c.ini)}</span>
              <div class="comment-body"><div class="comment-head"><b>${esc(c.autor)}</b><small>${esc(c.quando)}</small></div><div class="comment-text" style="font-size:13.5px">${esc(c.texto)}</div></div></div>`).join('')
            : '<p class="prop-empty">Nenhum comentário sobre este arquivo.</p>'}</div>
          <textarea id="vw-txt" rows="3" placeholder="Comentar este arquivo…" style="margin-top:10px"></textarea>
          <button class="btn btn-primary btn-sm" id="vw-send" style="margin-top:8px">${ico('send')}Comentar</button>
        </aside>
      </div>
    </div>`;

  $('#vw-x').addEventListener('click', fecharViewer);
  $('#vw-ver').addEventListener('change', e => abrirArquivo(projId, arqId, +e.target.value));
  $$('.ver-item').forEach(el => el.addEventListener('click', () => abrirArquivo(projId, arqId, +el.dataset.vi)));
  $('#vw-sit').addEventListener('change', e => {
    arq.sit = e.target.value; registrar(proj, `${arq.nome}: situação alterada para ${SIT_ARQ[arq.sit].nome}`);
    saveDB(); toast(`Situação: ${SIT_ARQ[arq.sit].nome}.`); reabrir(projId, arqId, vi);
  });
  $('#vw-dl').addEventListener('click', async () => {
    const b = await blobDaVersao(proj, ver);
    if (!b){ toast('Arquivo não encontrado neste navegador.', 'alert'); return; }
    baixarBlob(b, nomeDownload(arq, ver));
  });
  $('#vw-up').addEventListener('click', () => pedirArquivos(false, async fs => {
    const f = fs[0]; if (f.size > LIMITE_UPLOAD){ toast('O arquivo passa de 25 MB.', 'alert'); return; }
    const ext = (f.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
    const blobId = uid('b'); await FileStore.put(blobId, f);
    const rev = proximaRev(arq.versoes[0].rev);
    arq.versoes.unshift(versao(rev, hoje(), usuario().nome, { blobId, mime:f.type, ext, tamanho:f.size }));
    arq.sit = 'verificacao'; registrar(proj, `${arq.nome} ${rev} enviado`);
    saveDB(); toast(`Revisão ${rev} enviada.`, 'upload'); reabrir(projId, arqId, 0);
  }));
  $('#vw-send').addEventListener('click', () => {
    const txt = $('#vw-txt').value.trim(); if (!txt) return;
    const u = usuario();
    proj.comentarios.push(comentario(u.nome, u.ini, agora(), txt, arq.id));
    proj.atualizado = hoje(); saveDB(); reabrir(projId, arqId, vi);
  });

  mostrarConteudo(proj, ver);
}

async function mostrarConteudo(proj, ver){
  const stage = $('#vw-stage'); const meu = VW;
  const zoomUI = `<div class="viewer-zoom"><button data-z="0.8" aria-label="Diminuir">−</button><button data-z="0" aria-label="Tamanho original">${ico('fit')}</button><button data-z="1.25" aria-label="Aumentar">+</button></div>`;
  const ligaZoom = () => $$('[data-z]', stage).forEach(b => b.addEventListener('click', () => {
    const z = +b.dataset.z; VW.zoom = z ? Math.min(Math.max(VW.zoom * z, 0.4), 5) : 1;
    const el = $('#vw-el'); if (el) el.style.transform = `scale(${VW.zoom})`;
  }));
  if (ver.gen === 'planta'){
    stage.innerHTML = `<div class="svg-page" id="vw-el">${planSVGString(ver.snap || proj.planta, { labels:true })}</div>${zoomUI}`; ligaZoom(); return;
  }
  if (ver.gen === 'medicao'){
    stage.innerHTML = `<div class="svg-page" id="vw-el">${medicaoSVG(proj)}</div>${zoomUI}`; ligaZoom(); return;
  }
  const blob = await blobDaVersao(proj, ver);
  if (VW !== meu) return;
  if (!blob){
    stage.innerHTML = `<div class="viewer-nopreview">${ico('alert')}<b>Arquivo não encontrado neste navegador</b>Os arquivos enviados ficam guardados no navegador de quem enviou. Abra neste mesmo computador ou envie de novo.</div>`;
    return;
  }
  const mime = blob.type || ver.mime || '', ext = (ver.ext || '').toLowerCase();
  VW.url = URL.createObjectURL(blob);
  if (mime === 'application/pdf' || ext === 'pdf'){
    stage.innerHTML = `<iframe src="${VW.url}#view=FitH" title="${esc(VW.arq.nome)}"></iframe>`; stage.style.padding = '0';
  } else if (mime.startsWith('image/') || ['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)){
    stage.style.padding = ''; stage.innerHTML = `<img id="vw-el" src="${VW.url}" alt="${esc(VW.arq.nome)}">${zoomUI}`; ligaZoom();
  } else if (mime.startsWith('text/') || ['txt','csv','json','md','xml'].includes(ext)){
    const txt = await blob.slice(0, 300000).text();
    stage.innerHTML = `<pre>${esc(txt)}</pre>`;
  } else {
    stage.innerHTML = `<div class="viewer-nopreview">${ico('file')}<b>Pré-visualização indisponível para ${esc(ext.toUpperCase() || 'este formato')}</b>
      O arquivo está guardado com segurança no projeto. Use o botão Baixar para abrir no programa adequado${['dwg','dxf'].includes(ext) ? ' (AutoCAD, DWG TrueView ou similar)' : ''}.
      <div style="margin-top:16px"><button class="btn btn-cyan" id="vw-dl2">${ico('download')}Baixar arquivo</button></div></div>`;
    $('#vw-dl2').addEventListener('click', () => $('#vw-dl').click());
  }
}

/* ============================================================
   DISCUSSÃO
============================================================ */
function abaDiscussao(proj){
  const u = usuario();
  const lista = proj.comentarios.slice().reverse();
  $('#pj-aba').innerHTML = `<div class="card card-pad" style="max-width:860px">
    <h3 style="margin-bottom:14px">Discussão do projeto</h3>
    <div class="composer"><span class="avatar">${esc(u.ini)}</span>
      <div style="flex:1">
        <textarea id="dc-txt" placeholder="Escreva para a equipe: dúvidas, decisões do cliente, ajustes pedidos…"></textarea>
        <div class="composer-foot">
          <select id="dc-ref" class="tool-select" aria-label="Sobre"><option value="">Sobre o projeto em geral</option>${proj.arquivos.map(a => `<option value="${esc(a.id)}">Sobre: ${esc(a.nome)}</option>`).join('')}</select>
          <span style="display:flex;gap:10px;align-items:center"><small>Ctrl + Enter publica</small><button class="btn btn-primary btn-sm" id="dc-ok">${ico('send')}Publicar</button></span>
        </div>
      </div>
    </div>
    ${lista.length ? lista.map(c => { const a = c.arq && proj.arquivos.find(x => x.id === c.arq); return `
      <div class="comment"><span class="avatar">${esc(c.ini)}</span>
        <div class="comment-body">
          <div class="comment-head"><b>${esc(c.autor)}</b><small>${esc(c.quando)}</small></div>
          <div class="comment-text">${esc(c.texto)}</div>
          ${a ? `<button class="comment-ref" data-arq="${esc(a.id)}">${ico('file')}${esc(a.nome)}</button>` : ''}
        </div></div>`; }).join('')
      : `<div class="empty">${ico('comment')}<div>Nenhuma conversa ainda. Comece registrando o briefing do cliente.</div></div>`}
  </div>`;
  const publicar = () => {
    const txt = $('#dc-txt').value.trim();
    if (!txt){ $('#dc-txt').focus(); return; }
    proj.comentarios.push(comentario(u.nome, u.ini, agora(), txt, $('#dc-ref').value || null));
    proj.atualizado = hoje(); saveDB(); render(); toast('Comentário publicado.', 'comment');
  };
  $('#dc-ok').addEventListener('click', publicar);
  $('#dc-txt').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) publicar(); });
  $$('[data-arq]').forEach(b => b.addEventListener('click', () => abrirArquivo(proj.id, b.dataset.arq)));
}

/* ============================================================
   EDITOR DE PLANTA (estilo CAD)
============================================================ */
let ED = null;
const edFoco = {};
const PROMPTS = {
  select:'Comando:',
  wall:'LINHA  Primeiro ponto (clique ou X,Y):',
  wall2:'LINHA  Próximo ponto (comprimento, @dx,dy ou dist<ângulo) [Enter encerra]:',
  door:'PORTA  Clique sobre uma parede:',
  erase:'APAGAR  Clique no objeto:',
};
const COMANDOS = {
  L:'wall', LINHA:'wall', D:'wall', DIV:'wall', DIVISORIA:'wall', P:'door', PORTA:'door', E:'erase', APAGAR:'erase',
  S:'select', SEL:'select', U:'undo', DESFAZER:'undo', R:'redo', REFAZER:'redo', Z:'fit', ZOOM:'fit', ESC:'esc',
};
const dispY = y => -y;

function abaPlanta(proj){
  $('#pj-aba').innerHTML = `
    <div class="plan-layout">
      <div class="card" style="overflow:hidden">
        <div class="plan-tools">
          <button class="tool" data-tool="select" title="Selecionar (comando S)">${ico('pointer')}<span class="lbl">Selecionar</span></button>
          <button class="tool" data-tool="wall" title="Divisória (comando L)">${ico('wall')}<span class="lbl">Divisória</span></button>
          <button class="tool" data-tool="door" title="Porta (comando P)">${ico('door')}<span class="lbl">Porta</span></button>
          <button class="tool" data-tool="erase" title="Apagar (comando E)">${ico('eraser')}<span class="lbl">Apagar</span></button>
          <span class="tool-sep"></span>
          <select class="tool-select" id="ed-tipo" aria-label="Tipo da nova divisória">${Object.keys(TIPOS_PAREDE).map(k => `<option value="${k}">${TIPOS_PAREDE[k].nome}</option>`).join('')}</select>
          <span class="tool-sep"></span>
          <button class="tool" id="ed-undo" title="Desfazer (Ctrl+Z)" aria-label="Desfazer">${ico('undo')}</button>
          <button class="tool" id="ed-redo" title="Refazer (Ctrl+Y)" aria-label="Refazer">${ico('redo')}</button>
        </div>
        <div class="plan-canvas cad-cursor" id="ed-canvas">
          <svg id="plan-svg" font-family="Roboto, Arial, sans-serif" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="pg-min" width="500" height="500" patternUnits="userSpaceOnUse"><path d="M500 0H0V500" fill="none" stroke="#eef1f6" stroke-width="1" vector-effect="non-scaling-stroke"/></pattern>
              <pattern id="pg-maj" width="1000" height="1000" patternUnits="userSpaceOnUse"><rect width="1000" height="1000" fill="url(#pg-min)"/><path d="M1000 0H0V1000" fill="none" stroke="#dde3ec" stroke-width="1" vector-effect="non-scaling-stroke"/></pattern>
            </defs>
            <rect x="-200000" y="-200000" width="400000" height="400000" fill="url(#pg-maj)"/>
            <g id="plan-layer"></g><g id="plan-preview"></g>
          </svg>
          <div class="plan-zoom">
            <button id="ed-zin" aria-label="Aproximar">+</button>
            <button id="ed-zout" aria-label="Afastar">−</button>
            <button id="ed-fit" aria-label="Ajustar à tela">${ico('fit')}</button>
          </div>
        </div>
        <div class="cad-status">
          <span class="cad-coord" id="ed-coord">X —  Y —</span>
          <span class="sp"></span>
          <button class="cad-chip" data-tog="ortho" title="Trava horizontal/vertical">ORTO <kbd>F8</kbd></button>
          <button class="cad-chip" data-tog="osnap" title="Encaixe em ponta, meio e sobre a parede">OSNAP <kbd>F3</kbd></button>
          <button class="cad-chip" data-tog="grade" title="Arredonda para 10 mm">GRADE <kbd>F9</kbd></button>
          <button class="cad-chip" data-tog="cotas" title="Mostrar cotas">COTAS</button>
          <button class="cad-chip" data-tog="perfis" title="Mostrar montantes e batentes na planta">PERFIS</button>
          <span class="cad-unit">mm</span>
        </div>
        <div class="cad-cmd">
          <div class="cad-hist" id="ed-hist"></div>
          <div class="cad-line"><span id="ed-prompt"></span><input id="ed-cmd" autocomplete="off" spellcheck="false" aria-label="Linha de comando"></div>
        </div>
      </div>
      <div>
        <div class="card card-pad" id="ed-props"></div>
        <div class="card card-pad section-gap" id="ed-resumo"></div>
      </div>
    </div>`;

  ED = { proj, plan:proj.planta, tool:'select', tipo:'misto', ortho:true, osnap:true, grade:true, cotas:true, perfis:true, sel:null,
         start:null, hover:null, snapPt:null, vb:null, undo:[], redo:[], down:null, panning:false, drag:null, histOk:false,
         hist:['EuroHub CAD · unidades em milímetros · digite L e Enter para desenhar uma divisória'], ultimoCmd:'wall', ultimaEntrada:'' };
  const foco = edFoco[proj.id] && proj.planta.walls.find(w => w.id === edFoco[proj.id]);
  if (foco){ ED.sel = { kind:'wall', id:foco.id }; delete edFoco[proj.id]; }
  const svg = $('#plan-svg'), canvas = $('#ed-canvas'), cmd = $('#ed-cmd');

  $$('[data-tool]').forEach(b => b.addEventListener('click', () => edTool(b.dataset.tool)));
  $('#ed-tipo').addEventListener('change', e => { ED.tipo = e.target.value; edTool('wall'); });
  $('#ed-undo').addEventListener('click', edUndo);
  $('#ed-redo').addEventListener('click', edRedo);
  $('#ed-zin').addEventListener('click', () => edZoom(1 / 1.25));
  $('#ed-zout').addEventListener('click', () => edZoom(1.25));
  $('#ed-fit').addEventListener('click', () => { edFit(); edRender(); });
  $$('[data-tog]').forEach(b => b.addEventListener('click', () => edToggle(b.dataset.tog)));
  cmd.addEventListener('keydown', e => {
    if (e.key === 'Enter' || (e.key === ' ' && !/</.test(cmd.value))){ e.preventDefault(); const v = cmd.value; cmd.value = ''; edComando(v); }
    else if (e.key === 'Escape'){ e.preventDefault(); cmd.value = ''; edEsc(); cmd.blur(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); cmd.value = ED.ultimaEntrada; }
    else if (['F3', 'F8', 'F9'].includes(e.key)){ e.preventDefault(); edToggle({ F3:'osnap', F8:'ortho', F9:'grade' }[e.key]); }
  });

  svg.addEventListener('pointerdown', e => {
    if (e.button === 1){ e.preventDefault(); }
    if (e.button !== 0 && e.button !== 1) return;
    const p = edPt(e);
    ED.down = { sx:e.clientX, sy:e.clientY, vb:Object.assign({}, ED.vb), moved:false };
    const grip = e.button === 0 && ED.tool === 'select' ? edGrip(p) : null;
    if (grip){
      const w = ED.plan.walls.find(x => x.id === ED.sel.id);
      ED.drag = { grip, w, orig:Object.assign({}, w), snap:JSON.stringify(ED.plan), gx:(w.x1 + w.x2) / 2, gy:(w.y1 + w.y2) / 2 };
    } else if (e.button === 1 || (ED.tool === 'select' && !edHit(p))){ ED.panning = true; canvas.classList.add('panning'); }
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener('pointermove', e => {
    const p = edPt(e);
    if (ED.down){
      const dx = e.clientX - ED.down.sx, dy = e.clientY - ED.down.sy;
      if (Math.hypot(dx, dy) > 3) ED.down.moved = true;
      if (ED.panning){ const s = edEscala(); ED.vb.x = ED.down.vb.x - dx * s; ED.vb.y = ED.down.vb.y - dy * s; edAplicaVB(); return; }
      if (ED.drag && ED.down.moved){ edArrasta(p); ED.hover = p; edPreview(); return; }
    }
    ED.hover = p; edPreview();
  });
  svg.addEventListener('pointerup', e => {
    const d = ED.down; ED.down = null;
    if (ED.drag){
      const dr = ED.drag; ED.drag = null;
      if (d && d.moved){ ED.undo.push(dr.snap); ED.redo = []; edSalvar(); edLog(`Parede ${letras(ED.plan)[dr.w.id] || ''} ajustada · ${cotaTxt(wallLen(dr.w))} mm`); }
      return;
    }
    if (ED.panning){ ED.panning = false; canvas.classList.remove('panning'); if (d && d.moved) return; }
    if (d && !d.moved && e.button === 0) edClick(edPt(e));
  });
  svg.addEventListener('pointerleave', () => { ED.hover = null; edPreview(); });
  svg.addEventListener('dblclick', () => { if (ED.tool === 'wall') edEsc(); });
  svg.addEventListener('contextmenu', e => { e.preventDefault(); edComando(''); });
  svg.addEventListener('wheel', e => { e.preventDefault(); edZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, edPt(e)); }, { passive:false });

  edFit(); edTool(ED.sel ? 'select' : 'select', true); edAtualizaChips(); edLogRender(); edRender(); edPainel();
}

/* ---------- Coordenadas, zoom, estado ---------- */
function edPt(e){
  const svg = $('#plan-svg'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x:r.x, y:r.y };
}
function edEscala(){ const c = $('#ed-canvas'); return Math.max(ED.vb.w / Math.max(c.clientWidth, 1), ED.vb.h / Math.max(c.clientHeight, 1)); }
function edAplicaVB(){ $('#plan-svg').setAttribute('viewBox', `${r1(ED.vb.x)} ${r1(ED.vb.y)} ${r1(ED.vb.w)} ${r1(ED.vb.h)}`); }
function edFit(){
  const b = bounds(ED.plan), pad = Math.max(b.w, b.h) * 0.14 + 600;
  ED.vb = { x:b.x - pad, y:b.y - pad, w:b.w + 2 * pad, h:b.h + 2 * pad }; edAplicaVB();
}
function edZoom(f, p){
  const nw = ED.vb.w * f; if (nw < 300 || nw > 400000) return;
  p = p || { x:ED.vb.x + ED.vb.w / 2, y:ED.vb.y + ED.vb.h / 2 };
  ED.vb = { x:p.x - (p.x - ED.vb.x) * f, y:p.y - (p.y - ED.vb.y) * f, w:nw, h:ED.vb.h * f };
  edAplicaVB(); edRender(); edPreview();
}
function edToggle(k){
  ED[k] = !ED[k]; edAtualizaChips();
  const nomes = { ortho:'ORTO', osnap:'OSNAP', grade:'GRADE', cotas:'COTAS', perfis:'PERFIS' };
  edLog(`${nomes[k]} ${ED[k] ? 'ligado' : 'desligado'}`);
  if (k === 'cotas' || k === 'perfis') edRender();
  edPreview();
}
function edAtualizaChips(){ $$('[data-tog]').forEach(b => b.classList.toggle('on', !!ED[b.dataset.tog])); }
function edTool(t, silencioso){
  ED.tool = t; ED.start = null;
  if (t !== 'select') ED.sel = null;
  if (t !== 'select') ED.ultimoCmd = t;
  $$('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  if (!silencioso && t !== 'select') edLog({ wall:'LINHA', door:'PORTA', erase:'APAGAR' }[t]);
  edRender(); edPreview(); edPainel();
}
function edEsc(){
  if (ED.tool === 'wall' && ED.start){ ED.start = null; edLog('*Cancelado*'); }
  else if (ED.tool !== 'select'){ edTool('select', true); edLog('*Cancelado*'); }
  else if (ED.sel){ ED.sel = null; edRender(); edPainel(); }
  edPreview();
}
function edLog(msg){ ED.hist.push(msg); if (ED.hist.length > 3) ED.hist.shift(); edLogRender(); }
function edLogRender(){ const h = $('#ed-hist'); if (h) h.textContent = ED.hist.join('\n'); }

/* ---------- Linha de comando ---------- */
function edParse(txt){
  const t = txt.replace(/\s+/g, ''), n = '(-?\\d+(?:\\.\\d+)?)', base = ED.start;
  let m;
  if ((m = new RegExp(`^@${n}[,;]${n}$`).exec(t)) && base) return { x:base.x + +m[1], y:base.y - +m[2] };
  if ((m = new RegExp(`^@?${n}<${n}$`).exec(t)) && base){ const d = +m[1], a = +m[2] * Math.PI / 180; return { x:base.x + d * Math.cos(a), y:base.y - d * Math.sin(a) }; }
  if ((m = new RegExp(`^${n}[,;]${n}$`).exec(t))) return { x:+m[1], y:-(+m[2]) };
  if ((m = new RegExp(`^${n}$`).exec(t)) && base){
    const d = +m[1]; let dx = 1, dy = 0;
    if (ED.hover){
      dx = ED.hover.x - base.x; dy = ED.hover.y - base.y;
      if (ED.ortho){ if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0; }
      const l = Math.hypot(dx, dy); if (l > 0){ dx /= l; dy /= l; } else { dx = 1; dy = 0; }
    }
    return { x:base.x + dx * d, y:base.y + dy * d };
  }
  return null;
}
function edComando(v){
  const txt = String(v || '').trim();
  if (txt) ED.ultimaEntrada = txt;
  if (!txt){
    if (ED.tool === 'wall' && ED.start){ ED.start = null; edLog('Fim da linha'); edPreview(); return; }
    if (ED.tool === 'select'){ edTool(ED.ultimoCmd); return; }
    edTool('select', true); edPreview(); return;
  }
  const up = txt.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const c = COMANDOS[up];
  if (c){
    if (c === 'undo') return edUndo();
    if (c === 'redo') return edRedo();
    if (c === 'fit'){ edFit(); edRender(); edLog('ZOOM ajustado'); return; }
    if (c === 'esc') return edEsc();
    return edTool(c);
  }
  if (ED.tool === 'wall'){
    const p = edParse(txt);
    if (!p){ edLog(`Entrada inválida: ${txt}  (ex.: 4200 · @4200,0 · 4200<90 · 0,6000)`); return; }
    edPontoParede({ x:r1(p.x), y:r1(p.y) }, `> ${txt}`);
    return;
  }
  if (ED.tool === 'select' && /^-?\d+(\.\d+)?[,;]-?\d+(\.\d+)?$/.test(txt.replace(/\s+/g, ''))){
    edTool('wall'); const p = edParse(txt);
    if (p){ edPontoParede({ x:r1(p.x), y:r1(p.y) }, `> ${txt}`); return; }
  }
  edLog(`Comando desconhecido: ${txt}  (L divisória · P porta · E apagar · S selecionar · U desfazer · Z ajustar)`);
}

/* ---------- Encaixes (OSNAP) ---------- */
function edSnap(p, from, excl){
  const k = edEscala(), tol = 12 * k;
  if (ED.osnap){
    let best = null, bd = tol;
    ED.plan.walls.forEach(w => {
      [[w.x1, w.y1, 'fim', w.id + ':1'], [w.x2, w.y2, 'fim', w.id + ':2'], [(w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, 'meio', w.id + ':m']].forEach(([x, y, kind, key]) => {
        if (excl && excl.includes(key)) return;
        const d = Math.hypot(x - p.x, y - p.y); if (d < bd){ bd = d; best = { x:r1(x), y:r1(y), kind }; }
      });
    });
    if (best) return best;
    let near = null; bd = tol * 0.8;
    ED.plan.walls.forEach(w => {
      if (excl && excl.includes(w.id + ':1')) return;
      const r = projSeg(p, w); if (r.d < bd){ bd = r.d; near = { x:r1(r.x), y:r1(r.y), kind:'perto' }; }
    });
    if (near && !(from && ED.ortho)) return near;
    if (near && from && ED.ortho){
      const w = ED.plan.walls.find(x => projSeg(p, x).d <= bd + 0.01);
      if (w){
        const horiz = Math.abs(p.x - from.x) >= Math.abs(p.y - from.y);
        const ix = edInterseccao(from, horiz, w);
        if (ix) return { x:r1(ix.x), y:r1(ix.y), kind:'perto' };
      }
    }
  }
  let x = p.x, y = p.y; const st = ED.grade ? 10 : 1;
  if (from && ED.ortho){
    if (Math.abs(x - from.x) >= Math.abs(y - from.y)){ y = from.y; x = from.x + Math.round((x - from.x) / st) * st; }
    else { x = from.x; y = from.y + Math.round((y - from.y) / st) * st; }
  } else { x = Math.round(x / st) * st; y = Math.round(y / st) * st; }
  return { x, y, kind:null };
}
function edInterseccao(from, horiz, w){
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
  if (horiz){ if (Math.abs(dy) < 1e-9) return null; const t = (from.y - w.y1) / dy; if (t < 0 || t > 1) return null; return { x:w.x1 + t * dx, y:from.y }; }
  if (Math.abs(dx) < 1e-9) return null; const t = (from.x - w.x1) / dx; if (t < 0 || t > 1) return null; return { x:from.x, y:w.y1 + t * dy };
}
function edWallPerto(p, tolPx){
  let best = null, bd = (tolPx || 12) * edEscala();
  ED.plan.walls.forEach(w => { const r = projSeg(p, w); if (r.d < bd){ bd = r.d; best = { w, t:r.t }; } });
  return best;
}
function edHit(p){
  const tol = 10 * edEscala();
  for (const d of ED.plan.doors){
    const g = doorGeo(ED.plan, d);
    if (g && Math.hypot(p.x - g.cx, p.y - g.cy) < g.dw / 2 + tol) return { kind:'door', id:d.id };
  }
  const w = edWallPerto(p, 10);
  return w ? { kind:'wall', id:w.w.id } : null;
}
function edGrip(p){
  if (!ED.sel || ED.sel.kind !== 'wall') return null;
  const w = ED.plan.walls.find(x => x.id === ED.sel.id); if (!w) return null;
  const tol = 9 * edEscala();
  const pts = { p1:[w.x1, w.y1], p2:[w.x2, w.y2], mid:[(w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2] };
  for (const g in pts) if (Math.hypot(pts[g][0] - p.x, pts[g][1] - p.y) < tol) return g;
  return null;
}
function edArrasta(p){
  const d = ED.drag, w = d.w, o = d.orig, excl = [w.id + ':1', w.id + ':2', w.id + ':m'];
  if (d.grip === 'mid'){
    const t = edSnap(p, { x:d.gx, y:d.gy }, excl), dx = t.x - d.gx, dy = t.y - d.gy;
    w.x1 = r1(o.x1 + dx); w.y1 = r1(o.y1 + dy); w.x2 = r1(o.x2 + dx); w.y2 = r1(o.y2 + dy);
    ED.snapPt = t;
  } else {
    const fixo = d.grip === 'p1' ? { x:o.x2, y:o.y2 } : { x:o.x1, y:o.y1 };
    const t = edSnap(p, fixo, excl);
    if (d.grip === 'p1'){ w.x1 = t.x; w.y1 = t.y; } else { w.x2 = t.x; w.y2 = t.y; }
    ED.snapPt = t;
  }
  edRender(); edPainel();
}

/* ---------- Ações ---------- */
function edCommit(fn){
  ED.undo.push(JSON.stringify(ED.plan)); if (ED.undo.length > 100) ED.undo.shift();
  ED.redo = []; fn(); edSalvar();
}
function edSalvar(){
  if (!ED.histOk){ registrar(ED.proj, 'Planta editada'); ED.histOk = true; }
  ED.proj.atualizado = hoje(); saveDB(); edRender(); edPreview(); edPainel();
}
function edRestaura(json){ const p = JSON.parse(json); ED.plan.walls = p.walls; ED.plan.doors = p.doors; ED.sel = null; edSalvar(); }
function edUndo(){ if (!ED.undo.length){ edLog('Nada para desfazer'); return; } ED.redo.push(JSON.stringify(ED.plan)); edRestaura(ED.undo.pop()); edLog('Desfeito'); }
function edRedo(){ if (!ED.redo.length){ edLog('Nada para refazer'); return; } ED.undo.push(JSON.stringify(ED.plan)); edRestaura(ED.redo.pop()); edLog('Refeito'); }
function edRemover(hit){
  if (!hit) return;
  const Ls = letras(ED.plan);
  edCommit(() => {
    if (hit.kind === 'door') ED.plan.doors = ED.plan.doors.filter(d => d.id !== hit.id);
    else { ED.plan.walls = ED.plan.walls.filter(w => w.id !== hit.id); ED.plan.doors = ED.plan.doors.filter(d => d.wall !== hit.id); }
    ED.sel = null;
  });
  edLog(hit.kind === 'door' ? 'Porta apagada' : `Parede ${Ls[hit.id] || ''} apagada`);
}
function edPontoParede(pt, eco){
  if (eco) edLog(eco);
  if (!ED.start){ ED.start = { x:pt.x, y:pt.y }; edLog(`Primeiro ponto: X ${dec(pt.x)}  Y ${dec(dispY(pt.y))}`); edPreview(); return; }
  const L = Math.hypot(pt.x - ED.start.x, pt.y - ED.start.y);
  if (L < 10){ edLog('Comprimento muito pequeno (mínimo 10 mm)'); return; }
  const a = ED.start, id = uid('w');
  edCommit(() => ED.plan.walls.push({ id, x1:a.x, y1:a.y, x2:pt.x, y2:pt.y, tipo:ED.tipo }));
  const w = ED.plan.walls.find(x => x.id === id);
  edLog(`Parede ${letras(ED.plan)[id] || ''} criada · ${dec(L)} mm < ${dec(anguloCAD(w))}°`);
  ED.start = { x:pt.x, y:pt.y }; edPreview();
}
function edClick(p){
  if (ED.tool === 'wall'){ const s = edSnap(p, ED.start); edPontoParede({ x:s.x, y:s.y }); return; }
  if (ED.tool === 'door'){
    const near = edWallPerto(p, 16); if (!near){ edLog('Nenhuma parede aqui'); return; }
    const L = wallLen(near.w), dw = 800;
    if (L < dw + 200){ edLog('Parede curta demais para uma porta de 800 mm'); return; }
    const m = (dw / 2 + 100) / L, t = Math.min(Math.max(near.t, m), 1 - m);
    const lado = projSeg(p, near.w); const ux = (near.w.x2 - near.w.x1) / L, uy = (near.w.y2 - near.w.y1) / L;
    const side = ((p.x - lado.x) * -uy + (p.y - lado.y) * ux) >= 0 ? 1 : -1;
    const id = uid('d');
    edCommit(() => ED.plan.doors.push({ id, wall:near.w.id, t, w:dw, lado:side }));
    ED.sel = { kind:'door', id }; edTool('select', true); edRender(); edPainel();
    edLog(`Porta de ${dw} mm inserida a ${cotaTxt(t * L - dw / 2)} mm do início da parede`);
    return;
  }
  if (ED.tool === 'erase'){ const h = edHit(p); if (h) edRemover(h); else edLog('Nada selecionado'); return; }
  ED.sel = edHit(p); edRender(); edPainel();
}

/* ---------- Desenho ---------- */
function edRender(){
  const g = $('#plan-layer'); if (!g || !ED) return;
  g.innerHTML = planMarkup(ED.plan, { labels:ED.cotas, perfis:ED.perfis, sel:ED.sel, fs:11 * edEscala(), hi:ED.sel && ED.sel.kind === 'wall' ? ED.sel.id : null });
}
function edMarcador(sp, k){
  const s = 6 * k, c = '#0b8fb3', sw = r1(2 * k);
  if (sp.kind === 'fim') return `<rect x="${r1(sp.x - s)}" y="${r1(sp.y - s)}" width="${r1(2 * s)}" height="${r1(2 * s)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
  if (sp.kind === 'meio') return `<path d="M${r1(sp.x)} ${r1(sp.y - s * 1.2)} L${r1(sp.x + s * 1.1)} ${r1(sp.y + s * 0.8)} L${r1(sp.x - s * 1.1)} ${r1(sp.y + s * 0.8)}Z" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
  if (sp.kind === 'perto') return `<path d="M${r1(sp.x - s)} ${r1(sp.y - s)} L${r1(sp.x + s)} ${r1(sp.y + s)} M${r1(sp.x + s)} ${r1(sp.y - s)} L${r1(sp.x - s)} ${r1(sp.y + s)}" stroke="${c}" stroke-width="${sw}"/>`;
  return '';
}
function edDica(x, y, txt, k){
  const w = txt.length * 7 * k + 14 * k;
  return `<rect x="${r1(x)}" y="${r1(y - 11 * k)}" width="${r1(w)}" height="${r1(20 * k)}" rx="${r1(3 * k)}" fill="#1b2236" fill-opacity=".9"/>`
    + `<text x="${r1(x + 7 * k)}" y="${r1(y)}" font-size="${r1(12 * k)}" fill="#fff" dominant-baseline="middle" font-family="Consolas, monospace">${txt}</text>`;
}
function edPreview(){
  const g = $('#plan-preview'); if (!g || !ED) return;
  const k = edEscala(), h = ED.hover; let s = '';
  $('#ed-prompt').textContent = ED.tool === 'wall' && ED.start ? PROMPTS.wall2 : PROMPTS[ED.tool];
  const coord = $('#ed-coord');
  if (h){
    const sp = (ED.tool === 'wall') ? edSnap(h, ED.start) : (ED.drag ? (ED.snapPt || h) : edSnap(h, null));
    coord.textContent = `X ${dec(sp.x).padStart(8)}   Y ${dec(dispY(sp.y)).padStart(8)}`;
    const cx = ED.tool === 'wall' ? sp.x : h.x, cy = ED.tool === 'wall' ? sp.y : h.y;
    s += `<line x1="${r1(ED.vb.x)}" y1="${r1(cy)}" x2="${r1(ED.vb.x + ED.vb.w)}" y2="${r1(cy)}" stroke="#14337a" stroke-opacity=".35" stroke-width="${r1(k)}"/>`
      + `<line x1="${r1(cx)}" y1="${r1(ED.vb.y)}" x2="${r1(cx)}" y2="${r1(ED.vb.y + ED.vb.h)}" stroke="#14337a" stroke-opacity=".35" stroke-width="${r1(k)}"/>`;
    if (ED.tool !== 'wall') s += `<rect x="${r1(cx - 5 * k)}" y="${r1(cy - 5 * k)}" width="${r1(10 * k)}" height="${r1(10 * k)}" fill="none" stroke="#14337a" stroke-width="${r1(1.2 * k)}"/>`;
    if (ED.tool === 'wall'){
      if (ED.start){
        const t = TIPOS_PAREDE[ED.tipo], len = Math.hypot(sp.x - ED.start.x, sp.y - ED.start.y);
        s += `<line x1="${ED.start.x}" y1="${ED.start.y}" x2="${sp.x}" y2="${sp.y}" stroke="${t.cor}" stroke-opacity=".55" stroke-width="${t.esp}" stroke-linecap="square"/>`
          + `<circle cx="${ED.start.x}" cy="${ED.start.y}" r="${r1(4 * k)}" fill="#53d4f0"/>`;
        if (len > 0){
          const ang = anguloCAD({ x1:ED.start.x, y1:ED.start.y, x2:sp.x, y2:sp.y });
          s += edDica(sp.x + 16 * k, sp.y - 22 * k, `${dec(len)} mm < ${dec(ang)}°`, k);
        }
      }
      if (ED.osnap) s += edMarcador(sp, k);
    } else if (ED.drag && ED.snapPt){
      s += edMarcador(ED.snapPt, k);
      s += edDica(h.x + 16 * k, h.y - 22 * k, `${dec(wallLen(ED.drag.w))} mm`, k);
    } else if (ED.tool === 'door'){
      const near = edWallPerto(h, 16);
      if (near && wallLen(near.w) >= 1000){
        const L = wallLen(near.w), m = 500 / L, t = Math.min(Math.max(near.t, m), 1 - m);
        const pr = projSeg(h, near.w), ux = (near.w.x2 - near.w.x1) / L, uy = (near.w.y2 - near.w.y1) / L;
        const lado = ((h.x - pr.x) * -uy + (h.y - pr.y) * ux) >= 0 ? 1 : -1;
        const g2 = doorGeo({ walls:[near.w] }, { wall:near.w.id, t, w:800, lado });
        s += `<line x1="${r1(g2.p0.x)}" y1="${r1(g2.p0.y)}" x2="${r1(g2.p1.x)}" y2="${r1(g2.p1.y)}" stroke="#53d4f0" stroke-width="160" stroke-opacity=".35"/>`
          + `<path d="M${r1(g2.out.x)} ${r1(g2.out.y)} A800 800 0 0 ${g2.sweep} ${r1(g2.q.x)} ${r1(g2.q.y)}" fill="none" stroke="#0b8fb3" stroke-width="${r1(2 * k)}" stroke-dasharray="${r1(6 * k)} ${r1(4 * k)}"/>`
          + `<line x1="${r1(g2.piv.x)}" y1="${r1(g2.piv.y)}" x2="${r1(g2.q.x)}" y2="${r1(g2.q.y)}" stroke="#0b8fb3" stroke-width="40"/>`
          + edDica(h.x + 16 * k, h.y - 22 * k, `${cotaTxt(t * L - 400)} mm do início`, k);
      }
    } else if (ED.tool === 'erase' || ED.tool === 'select'){
      const grip = ED.tool === 'select' ? edGrip(h) : null;
      const hit = grip ? null : edHit(h);
      if (hit){
        const cor = ED.tool === 'erase' ? '#e0533f' : '#53d4f0';
        if (hit.kind === 'wall'){ const w = ED.plan.walls.find(x => x.id === hit.id); s += `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${cor}" stroke-opacity=".35" stroke-width="${r1(14 * k)}" stroke-linecap="round"/>`; }
        else { const g2 = doorGeo(ED.plan, ED.plan.doors.find(d => d.id === hit.id)); s += `<circle cx="${r1(g2.cx)}" cy="${r1(g2.cy)}" r="${g2.dw * 0.7}" fill="${cor}" fill-opacity=".18" stroke="${cor}" stroke-width="${r1(2 * k)}"/>`; }
      }
    }
  } else {
    coord.textContent = 'X —   Y —';
  }
  g.innerHTML = s;
}

/* ---------- Painel de propriedades ---------- */
function edPainel(){
  const P = $('#ed-props'), R = $('#ed-resumo'); if (!P || !ED) return;
  const plan = ED.plan, Ls = letras(plan), sel = ED.sel;
  const inp = (id, rot, val, suf) => `<div><label for="${id}">${rot}</label><div class="input-suffix"><input id="${id}" value="${val}" inputmode="decimal"><em>${suf || 'mm'}</em></div></div>`;
  if (sel && sel.kind === 'wall'){
    const w = plan.walls.find(x => x.id === sel.id);
    if (!w){ ED.sel = null; return edPainel(); }
    P.innerHTML = `<h3>${w.tipo === 'alvenaria' ? 'Alvenaria existente' : 'Parede ' + Ls[w.id]}</h3>
      <label for="pp-tipo">Tipo</label><select id="pp-tipo">${Object.keys(TIPOS_PAREDE).map(k => `<option value="${k}" ${k === w.tipo ? 'selected' : ''}>${TIPOS_PAREDE[k].nome}</option>`).join('')}</select>
      <div class="prop-sec">Medida</div>
      <div class="prop-grid">${inp('pp-len', 'Comprimento', dec(wallLen(w)))}${inp('pp-ang', 'Ângulo', dec(anguloCAD(w)), '°')}</div>
      <label for="pp-fixo">Ao mudar a medida, manter fixo</label>
      <select id="pp-fixo"><option value="ini">O início (ponto 1)</option><option value="fim">O fim (ponto 2)</option><option value="centro">O centro</option></select>
      <div class="prop-sec">Pontos</div>
      <div class="prop-grid">${inp('pp-x1', 'X1', dec(w.x1))}${inp('pp-y1', 'Y1', dec(dispY(w.y1)))}${inp('pp-x2', 'X2', dec(w.x2))}${inp('pp-y2', 'Y2', dec(dispY(w.y2)))}</div>
      <div class="btn-row">
        ${w.tipo !== 'alvenaria' ? `<button class="btn btn-outline btn-sm" id="pp-elev">${ico('elev')}Ver elevação</button>` : ''}
        <button class="btn btn-danger btn-sm" id="pp-del">${ico('trash')}Excluir</button>
      </div>
      ${w.tipo !== 'alvenaria' ? (() => { const ms = modulosParede(plan, w, elevCfg(ED.proj, w)); return `<p class="form-note">${ico('elev')}${ms.length} ${ms.length === 1 ? 'módulo' : 'módulos'} · ${ms.length + 1} montantes nesta parede (edite na elevação).</p>`; })() : ''}
      <p class="form-note">${ico('info')}Arraste os quadradinhos azuis para esticar ou mover a parede.</p>`;
    $('#pp-fixo').value = ED.fixo || 'ini';
    $('#pp-fixo').addEventListener('change', e => { ED.fixo = e.target.value; });
    const aplicaMedida = (L, angDeg) => {
      if (!(L >= 10 && L <= 200000)){ toast('Comprimento entre 10 e 200.000 mm.', 'alert'); edPainel(); return; }
      const a = angDeg * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a), fixo = ED.fixo || 'ini';
      edCommit(() => {
        if (fixo === 'ini'){ w.x2 = r1(w.x1 + ux * L); w.y2 = r1(w.y1 + uy * L); }
        else if (fixo === 'fim'){ w.x1 = r1(w.x2 - ux * L); w.y1 = r1(w.y2 - uy * L); }
        else { const cx = (w.x1 + w.x2) / 2, cy = (w.y1 + w.y2) / 2; w.x1 = r1(cx - ux * L / 2); w.y1 = r1(cy - uy * L / 2); w.x2 = r1(cx + ux * L / 2); w.y2 = r1(cy + uy * L / 2); }
      });
      edLog(`Parede ${Ls[w.id] || ''}: ${dec(L)} mm < ${dec(angDeg)}°`);
    };
    const ligar = (id, fn) => { const el = $('#' + id); el.addEventListener('change', () => fn(numPlano(el.value), el)); el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); }); };
    ligar('pp-len', v => isNaN(v) ? edPainel() : aplicaMedida(v, anguloCAD(w)));
    ligar('pp-ang', v => isNaN(v) ? edPainel() : aplicaMedida(wallLen(w), v));
    [['pp-x1', 'x1', 1], ['pp-y1', 'y1', -1], ['pp-x2', 'x2', 1], ['pp-y2', 'y2', -1]].forEach(([id, k, sg]) =>
      ligar(id, v => { if (isNaN(v)) return edPainel(); edCommit(() => { w[k] = r1(v * sg); }); edLog(`${id.slice(3).toUpperCase()} = ${dec(v)}`); }));
    $('#pp-tipo').addEventListener('change', e => { edCommit(() => { w.tipo = e.target.value; }); edLog(`Tipo: ${TIPOS_PAREDE[w.tipo].nome}`); });
    $('#pp-del').addEventListener('click', () => edRemover(sel));
    const el = $('#pp-elev'); if (el) el.addEventListener('click', () => { elevSel[ED.proj.id] = w.id; location.hash = `#/projetos/${ED.proj.id}/elevacoes`; });
  } else if (sel && sel.kind === 'door'){
    const d = plan.doors.find(x => x.id === sel.id), w = d && plan.walls.find(x => x.id === d.wall);
    if (!d || !w){ ED.sel = null; return edPainel(); }
    const L = wallLen(w), dw = d.w || 800, dist = d.t * L - dw / 2;
    P.innerHTML = `<h3>Porta</h3><p class="prop-empty" style="margin-top:4px">Na ${w.tipo !== 'alvenaria' ? 'parede ' + Ls[w.id] : 'alvenaria'} · ${cotaTxt(L)} mm</p>
      <div class="prop-grid">${inp('pd-w', 'Largura da folha', dec(dw))}${inp('pd-d', 'Distância do início', dec(dist))}</div>
      <p class="form-note">${ico('info')}Distância medida do ponto 1 da parede até o batente da porta.</p>
      <div class="btn-row">
        <button class="btn btn-outline btn-sm" id="pd-lado">${ico('flip')}Inverter lado</button>
        <button class="btn btn-outline btn-sm" id="pd-dob">${ico('refresh')}Inverter dobradiça</button>
        <button class="btn btn-danger btn-sm" id="pd-del">${ico('trash')}Excluir</button>
      </div>`;
    const ligar = (id, fn) => { const el = $('#' + id); el.addEventListener('change', () => fn(numPlano(el.value))); el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); }); };
    ligar('pd-w', v => {
      if (!(v >= 400 && v <= L - 20)){ toast(`Largura entre 400 e ${cotaTxt(L - 20)} mm.`, 'alert'); return edPainel(); }
      edCommit(() => { const a = d.t * L - dw / 2; d.w = r1(v); d.t = Math.min(Math.max((a + v / 2) / L, v / 2 / L), 1 - v / 2 / L); });
      edLog(`Porta: largura ${dec(v)} mm`);
    });
    ligar('pd-d', v => {
      if (!(v >= 0 && v <= L - dw)){ toast(`Distância entre 0 e ${cotaTxt(L - dw)} mm.`, 'alert'); return edPainel(); }
      edCommit(() => { d.t = (v + dw / 2) / L; }); edLog(`Porta a ${dec(v)} mm do início`);
    });
    $('#pd-lado').addEventListener('click', () => edCommit(() => { d.lado = -(d.lado || 1); }));
    $('#pd-dob').addEventListener('click', () => edCommit(() => { d.inv = !d.inv; }));
    $('#pd-del').addEventListener('click', () => edRemover(sel));
  } else {
    P.innerHTML = `<h3>Como desenhar</h3><div class="prop-empty" style="margin-top:8px;line-height:1.65">
      <b>Divisória:</b> digite <b>L</b> e Enter, clique no ponto inicial e digite a medida (ex.: <b>4200</b>) seguida de Enter.<br>
      <b>Formatos:</b> <b>4200</b> na direção do mouse · <b>@4200,0</b> relativo · <b>4200&lt;90</b> polar · <b>0,6000</b> absoluto.<br>
      <b>Enter</b> ou botão direito encerra · <b>Esc</b> cancela · <b>Delete</b> exclui · <b>Ctrl+Z</b> desfaz.<br>
      <b>F8</b> ORTO · <b>F3</b> OSNAP · <b>F9</b> GRADE · roda do mouse: zoom · botão do meio: mover a vista.</div>`;
  }

  const t = totaisPlanta(plan);
  R.innerHTML = `<h3 style="margin-bottom:10px">Resumo da planta</h3>
    <div class="big-total num">${fmm(t.total)} mm</div><small>de divisórias · ${t.portas} ${t.portas === 1 ? 'porta' : 'portas'}</small>
    <div style="margin-top:12px">${Object.keys(TIPOS_PAREDE).filter(k => k !== 'alvenaria').map(k =>
      `<div class="legend-row"><i style="background:${TIPOS_PAREDE[k].cor}"></i><span>${TIPOS_PAREDE[k].nome}</span><b class="num">${fmm(t.porTipo[k] || 0)} mm</b></div>`).join('')}
      <div class="legend-row"><i style="background:${TIPOS_PAREDE.alvenaria.cor}"></i><span>Alvenaria (não entra no total)</span></div></div>
    ${t.total > 0 ? (() => { const pf = perfisProjeto(ED.proj).resumo, pc = f => pf.filter(f).reduce((a, r) => a + r.pecas, 0);
      return `<div class="prop-sec">Perfis de alumínio</div>
      <div class="legend-row"><i style="background:#0f1b40;width:6px;height:14px"></i><span>Montantes</span><b class="num">${pc(r => r.nome === 'Montante')}</b></div>
      <div class="legend-row"><i style="background:#e08a1e;width:6px;height:14px"></i><span>Batentes de porta</span><b class="num">${pc(r => r.nome.includes('batente'))}</b></div>
      <div class="legend-row"><i style="background:#3a4a80"></i><span>Barras de 6 m (todos os perfis)</span><b class="num">${pf.reduce((a, r) => a + r.barras, 0)}</b></div>`; })() : ''}
    <button class="btn btn-primary btn-block" id="ed-orc" style="margin-top:14px">${ico('orcamentos')}Gerar orçamento desta planta</button>
    <button class="btn btn-outline btn-block" id="ed-elev" style="margin-top:8px">${ico('elev')}Ver elevações</button>
    <button class="btn btn-outline btn-block" id="ed-mat" style="margin-top:8px">${ico('pedidos')}Ver lista de materiais</button>
    <button class="btn btn-outline btn-block" id="ed-rev" style="margin-top:8px">${ico('save')}Salvar como revisão ${esc(proximaRev(ED.proj.rev))}</button>`;
  $('#ed-orc').addEventListener('click', () => orcamentoDaPlanta(ED.proj));
  $('#ed-elev').addEventListener('click', () => { location.hash = `#/projetos/${ED.proj.id}/elevacoes`; });
  $('#ed-mat').addEventListener('click', () => { location.hash = `#/projetos/${ED.proj.id}/materiais`; });
  $('#ed-rev').addEventListener('click', () => salvarRevisaoPlanta(ED.proj));
}

function orcamentoDaPlanta(proj){
  const t = totaisPlanta(proj.planta);
  if (t.total <= 0){ toast('Desenhe pelo menos uma divisória na planta.', 'alert'); return; }
  const tipos = Object.keys(t.porTipo);
  const comp = tipos.length === 1 && tipos[0] === 'vidro' ? 'Somente vidro temperado'
    : tipos.length === 1 && tipos[0] === 'cego' ? 'Somente painel cego' : 'Misto: vidro + painel cego';
  const o = {
    id:proximoOrcId(), cliente:proj.cliente, obra:proj.obra, linha:LINHAS[proj.linha] ? proj.linha : 'Europrata 90 mm', comp,
    metragem:String(Math.round(t.total)), pedireito:String(proj.pedireito || 2800), portas:String(t.portas), desconto:'0',
    obs:`Gerado a partir da planta ${proj.id} (${proj.rev}).`, status:'rascunho', data:hoje(), vendedor:usuario().nome,
  };
  o.total = calcula(o).total;
  DB.orcamentos.unshift(o); proj.orcamento = o.id;
  registrar(proj, `Orçamento ${o.id} gerado a partir da planta`); saveDB();
  location.hash = '#/orcamentos/' + o.id;
  toast(`${o.id} criado com ${fmm(t.total)} mm e ${t.portas} porta(s).`, 'orcamentos');
}
function salvarRevisaoPlanta(proj){
  const nova = proximaRev(proj.rev);
  confirmar(`Salvar revisão ${nova}`, `A planta atual vira a revisão ${nova} do projeto e vai para verificação. As revisões anteriores continuam guardadas.`, 'Salvar revisão', () => {
    proj.rev = nova;
    let f = proj.arquivos.find(a => a.versoes[0] && a.versoes[0].gen === 'planta');
    if (!f){ f = arquivo(uid('a'), 'Planta de layout', 'Planta', 'elaboracao', []); proj.arquivos.unshift(f); }
    f.versoes.unshift(versao(nova, hoje(), usuario().nome, { gen:'planta', snap:clone(proj.planta) }));
    f.sit = 'verificacao';
    registrar(proj, `Planta de layout ${nova} salva`); saveDB(); edPainel();
    $('#page-sub').textContent = `${proj.cliente} · ${proj.obra}${proj.pedido ? ` · Pedido #${proj.pedido}` : ''} · Revisão ${proj.rev}`;
    toast(`Revisão ${nova} salva em Arquivos.`, 'save');
  });
}

document.addEventListener('keydown', e => {
  if (!ED || !$('#plan-svg')) return;
  const tag = (e.target.tagName || '').toLowerCase(), noCmd = e.target.id === 'ed-cmd';
  if ((['input', 'textarea', 'select'].includes(tag) && !noCmd) || !$('#modal-back').hidden || $('#viewer-root').innerHTML) return;
  if (noCmd) return;
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? edRedo() : edUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'y'){ e.preventDefault(); edRedo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'F3' || k === 'F8' || k === 'F9'){ e.preventDefault(); edToggle({ F3:'osnap', F8:'ortho', F9:'grade' }[k]); return; }
  if (k === 'Escape'){ edEsc(); return; }
  if ((k === 'Delete' || k === 'Backspace') && ED.sel){ e.preventDefault(); edRemover(ED.sel); return; }
  if (k === 'Enter' || k === ' '){ e.preventDefault(); edComando(''); return; }
  if (k.length === 1){
    e.preventDefault();
    const c = $('#ed-cmd'); c.focus(); c.value += k;
  }
});
