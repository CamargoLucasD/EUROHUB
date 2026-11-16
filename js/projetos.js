/* EuroHub — área de Projetos (arquitetos e projetistas).
   Depende de app.js. Arquivos enviados ficam só no navegador de quem enviou (IndexedDB). */
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
  fit:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
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
  misto:     { nome:'Divisória mista',       cor:'#132a63', w:8  },
  vidro:     { nome:'Divisória de vidro',    cor:'#1ba6cf', w:6  },
  cego:      { nome:'Painel cego',           cor:'#56658f', w:8  },
  alvenaria: { nome:'Alvenaria existente',   cor:'#a3abb8', w:14 },
};
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
   GEOMETRIA DA PLANTA (unidades em centímetros)
============================================================ */
const wallLen = w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
function letras(plan){
  const m = {}; let i = 0;
  plan.walls.forEach(w => { if (w.tipo !== 'alvenaria') m[w.id] = String.fromCharCode(65 + (i++ % 26)); });
  return m;
}
function totaisPlanta(plan){
  const t = { total:0, porTipo:{}, portas:plan.doors.length };
  plan.walls.forEach(w => {
    if (w.tipo === 'alvenaria') return;
    const l = wallLen(w) / 100; t.total += l; t.porTipo[w.tipo] = (t.porTipo[w.tipo] || 0) + l;
  });
  return t;
}
function bounds(plan){
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  plan.walls.forEach(w => { x1 = Math.min(x1, w.x1, w.x2); y1 = Math.min(y1, w.y1, w.y2); x2 = Math.max(x2, w.x1, w.x2); y2 = Math.max(y2, w.y1, w.y2); });
  if (!isFinite(x1)) return { x:0, y:0, w:1200, h:800 };
  return { x:x1, y:y1, w:Math.max(x2 - x1, 100), h:Math.max(y2 - y1, 100) };
}
function projSeg(p, w){
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy;
  let t = L2 ? ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return { t, d: Math.hypot(p.x - (w.x1 + t * dx), p.y - (w.y1 + t * dy)) };
}
function doorGeo(plan, d){
  const w = plan.walls.find(x => x.id === d.wall); if (!w) return null;
  const L = wallLen(w); if (!L) return null;
  const ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L, nx = -uy, ny = ux, dw = d.w || 80;
  const cx = w.x1 + ux * L * d.t, cy = w.y1 + uy * L * d.t;
  const p0 = { x:cx - ux * dw / 2, y:cy - uy * dw / 2 }, p1 = { x:cx + ux * dw / 2, y:cy + uy * dw / 2 };
  return { w, cx, cy, p0, p1, q:{ x:p0.x + nx * dw, y:p0.y + ny * dw }, dw };
}
const r1 = n => Math.round(n * 10) / 10;

function planMarkup(plan, o){
  o = o || {};
  const L = letras(plan), fs = o.fs || 24, bgc = o.bgc || '#fff';
  const ln = (w, extra) => `<line x1="${r1(w.x1)}" y1="${r1(w.y1)}" x2="${r1(w.x2)}" y2="${r1(w.y2)}" ${extra}/>`;
  let s = '';
  const sel = o.sel && o.sel.kind === 'wall' ? plan.walls.find(x => x.id === o.sel.id) : null;
  if (sel) s += ln(sel, `stroke="#53d4f0" stroke-opacity=".45" stroke-width="${TIPOS_PAREDE[sel.tipo].w + fs * 0.9}" stroke-linecap="round"`);
  const ordem = plan.walls.filter(w => w.tipo === 'alvenaria').concat(plan.walls.filter(w => w.tipo !== 'alvenaria'));
  ordem.forEach(w => {
    const t = TIPOS_PAREDE[w.tipo] || TIPOS_PAREDE.misto;
    s += ln(w, `stroke="${t.cor}" stroke-width="${t.w}" stroke-linecap="square"`);
    if (w.tipo === 'vidro') s += ln(w, 'stroke="#fff" stroke-width="2"');
    if (w.tipo === 'misto') s += ln(w, 'stroke="#53d4f0" stroke-width="2" stroke-dasharray="30 30"');
  });
  plan.doors.forEach(d => {
    const g = doorGeo(plan, d); if (!g) return;
    const ww = (TIPOS_PAREDE[g.w.tipo] || { w:8 }).w;
    const on = o.sel && o.sel.kind === 'door' && o.sel.id === d.id;
    s += `<line x1="${r1(g.p0.x)}" y1="${r1(g.p0.y)}" x2="${r1(g.p1.x)}" y2="${r1(g.p1.y)}" stroke="${bgc}" stroke-width="${ww + 4}"/>`
      + `<path d="M${r1(g.p1.x)} ${r1(g.p1.y)} A${g.dw} ${g.dw} 0 0 1 ${r1(g.q.x)} ${r1(g.q.y)}" fill="none" stroke="${on ? '#0b8fb3' : '#7b8596'}" stroke-width="${on ? 3 : 1.5}" stroke-dasharray="6 5"/>`
      + `<line x1="${r1(g.p0.x)}" y1="${r1(g.p0.y)}" x2="${r1(g.q.x)}" y2="${r1(g.q.y)}" stroke="${on ? '#0b8fb3' : '#132a63'}" stroke-width="${on ? 5 : 3}"/>`;
  });
  if (o.labels) plan.walls.forEach(w => {
    if (w.tipo === 'alvenaria') return;
    const len = wallLen(w); if (len < 1) return;
    const mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2, nx = (w.y2 - w.y1) / len, ny = -(w.x2 - w.x1) / len;
    const vert = Math.abs(nx) > 0.7, off = vert ? fs * 0.7 : fs * 1.05;
    const anchor = vert ? (nx > 0 ? 'start' : 'end') : 'middle';
    s += `<text x="${r1(mx + nx * off)}" y="${r1(my + ny * off)}" font-size="${r1(fs)}" font-weight="700" fill="#14337a" text-anchor="${anchor}" dominant-baseline="middle" stroke="${bgc}" stroke-width="${r1(fs / 4)}" paint-order="stroke">${L[w.id]} · ${fmt(len / 100, 2)} m</text>`;
  });
  if (sel) [[sel.x1, sel.y1], [sel.x2, sel.y2]].forEach(([x, y]) =>
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fs * 0.4)}" fill="#fff" stroke="#0b8fb3" stroke-width="${r1(fs / 8)}"/>`);
  return s;
}
function planSVGString(plan, o){
  o = o || {};
  const b = bounds(plan), pad = Math.max(b.w, b.h) * 0.05 + (o.labels ? 70 : 20);
  const vb = `${r1(b.x - pad)} ${r1(b.y - pad)} ${r1(b.w + 2 * pad)} ${r1(b.h + 2 * pad)}`;
  const fs = o.fs || Math.max(b.w, b.h) / 45;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" font-family="Roboto, Arial, sans-serif">`
    + (o.bg ? `<rect x="${r1(b.x - pad)}" y="${r1(b.y - pad)}" width="${r1(b.w + 2 * pad)}" height="${r1(b.h + 2 * pad)}" fill="${o.bgc || '#fff'}"/>` : '')
    + planMarkup(plan, Object.assign({}, o, { fs })) + '</svg>';
}

/* ============================================================
   DOCUMENTOS GERADOS (PDF e imagens da demonstração)
============================================================ */
function latin1(s){
  return String(s).replace(/[—–]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...')
    .replace(/[^\x00-\xff]/g, '?');
}
const pdfStr = s => latin1(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
function PDFPagina(){
  const ops = []; const n = v => (Math.round(v * 100) / 100);
  return {
    text(x, y, s, size, bold){ ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${n(x)} ${n(y)} Td (${pdfStr(s)}) Tj ET`); },
    line(x1, y1, x2, y2, w){ ops.push(`${w || 1} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`); },
    rect(x, y, w, h, lw){ ops.push(`${lw || 1} w ${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`); },
    fillRect(x, y, w, h){ ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`); },
    stroke(hex){ ops.push(hexRGB(hex) + ' RG'); },
    fill(hex){ ops.push(hexRGB(hex) + ' rg'); },
    dash(on){ ops.push(on ? '[3 2] 0 d' : '[] 0 d'); },
    out(){ return latin1(ops.join('\n')); },
  };
}
function hexRGB(h){ const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(c => (c / 255).toFixed(3)).join(' '); }
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

function pdfExecutivo(proj, ver){
  const plan = ver.snap || proj.planta, W = 842, H = 595, pg = PDFPagina();
  pg.stroke('#13214e'); pg.rect(20, 20, W - 40, H - 40, 1.2);
  pg.fill('#13214e'); pg.text(36, H - 48, 'PROJETO EXECUTIVO DE DIVISÓRIAS', 15, true);
  pg.fill('#56616f'); pg.text(36, H - 64, `${proj.cliente} · ${proj.obra} · ${proj.nome}`, 9.5);

  const area = { x:40, y:160, w:W - 80, h:H - 250 };
  const b = bounds(plan), s = Math.min(area.w / b.w, area.h / b.h);
  const ox = area.x + (area.w - b.w * s) / 2, oy = area.y + (area.h - b.h * s) / 2;
  const X = x => ox + (x - b.x) * s, Y = y => oy + (b.h - (y - b.y)) * s;
  const Ls = letras(plan);
  plan.walls.forEach(w => {
    const t = TIPOS_PAREDE[w.tipo] || TIPOS_PAREDE.misto;
    pg.stroke(t.cor); pg.line(X(w.x1), Y(w.y1), X(w.x2), Y(w.y2), w.tipo === 'alvenaria' ? 3.2 : w.tipo === 'vidro' ? 1.6 : 2.2);
  });
  plan.doors.forEach(d => {
    const g = doorGeo(plan, d); if (!g) return;
    pg.stroke('#ffffff'); pg.line(X(g.p0.x), Y(g.p0.y), X(g.p1.x), Y(g.p1.y), 4);
    pg.stroke('#13214e'); pg.line(X(g.p0.x), Y(g.p0.y), X(g.q.x), Y(g.q.y), 1);
    pg.stroke('#7b8596'); pg.dash(true);
    const a0 = Math.atan2(g.p1.y - g.p0.y, g.p1.x - g.p0.x), a1 = Math.atan2(g.q.y - g.p0.y, g.q.x - g.p0.x);
    let da = a1 - a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    let px = g.p1.x, py = g.p1.y;
    for (let i = 1; i <= 8; i++){
      const a = a0 + da * i / 8, nx = g.p0.x + Math.cos(a) * g.dw, ny = g.p0.y + Math.sin(a) * g.dw;
      pg.line(X(px), Y(py), X(nx), Y(ny), 0.5); px = nx; py = ny;
    }
    pg.dash(false);
  });
  pg.fill('#14337a');
  plan.walls.forEach(w => {
    if (w.tipo === 'alvenaria') return;
    const len = wallLen(w); if (len < 1) return;
    const mx = (w.x1 + w.x2) / 2, my = (w.y1 + w.y2) / 2, nx = -(w.y2 - w.y1) / len, ny = (w.x2 - w.x1) / len;
    const lab = `${Ls[w.id]} ${fmt(len / 100, 2)} m`, tw = lab.length * 3.9, vert = Math.abs(nx) > 0.7;
    const px = vert ? (nx < 0 ? X(mx) + 8 : X(mx) - 8 - tw) : X(mx) - tw / 2;
    const py = vert ? Y(my) - 3 : Y(my) + (ny > 0 ? 8 : -14);
    pg.text(px, py, lab, 7.5, true);
  });

  const t = totaisPlanta(plan);
  let ly = 128; pg.fill('#13214e'); pg.text(36, ly, 'LEGENDA E QUANTITATIVOS', 8.5, true); ly -= 15;
  Object.keys(TIPOS_PAREDE).forEach(k => {
    if (k === 'alvenaria' || !t.porTipo[k]) return;
    pg.stroke(TIPOS_PAREDE[k].cor); pg.line(36, ly + 3, 60, ly + 3, 2.4);
    pg.fill('#1f2b44'); pg.text(68, ly, `${TIPOS_PAREDE[k].nome}: ${fmt(t.porTipo[k], 2)} m`, 8.5); ly -= 13;
  });
  pg.fill('#1f2b44'); pg.text(36, ly, `Total linear: ${fmt(t.total, 2)} m · Portas: ${t.portas} · Pé-direito: ${proj.pedireito} m`, 8.5, true);
  pg.fill('#8f6312'); pg.text(36, 34, 'Conferir todas as medidas em obra antes da produção.', 8);

  const cx = W - 302, cy = 34, cw = 268, ch = 100;
  pg.stroke('#13214e'); pg.rect(cx, cy, cw, ch, 1);
  pg.line(cx, cy + 74, cx + cw, cy + 74, 0.6); pg.line(cx, cy + 24, cx + cw, cy + 24, 0.6); pg.line(cx + 134, cy, cx + 134, cy + 24, 0.6);
  pg.fill('#13214e'); pg.text(cx + 10, cy + 82, 'EUROFLEX DIVISÓRIAS', 11, true);
  pg.fill('#1f2b44'); pg.text(cx + 10, cy + 58, `Projeto ${proj.id} - ${proj.nome}`.slice(0, 52), 8.5, true);
  pg.text(cx + 10, cy + 45, `${proj.cliente} · ${proj.obra}`.slice(0, 56), 8);
  pg.text(cx + 10, cy + 32, `Linha: ${proj.linha}`.slice(0, 56), 8);
  pg.text(cx + 10, cy + 9, `Revisão ${ver.rev} · ${ver.data}`, 8, true);
  pg.text(cx + 144, cy + 9, 'Sem escala · medidas em m', 8);
  return pdfBlob([pg.out()], W, H);
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
  const tipos = Object.keys(t.porTipo).map(k => `${TIPOS_PAREDE[k].nome}: ${fmt(t.porTipo[k], 2)} m`).join('; ') || 'a definir';
  return pdfTexto('Memorial descritivo', `${proj.id} · ${proj.cliente} · ${proj.obra} · Revisão ${ver.rev} · ${ver.data}`, [
    ['1. Objeto', `Fornecimento e instalação de divisórias para ${proj.obra} (${proj.endereco || 'endereço a confirmar'}), conforme planta de layout e projeto executivo do projeto ${proj.id}.`],
    ['2. Linha e materiais', [`Linha ${proj.linha}, com perfis de alumínio estrutural, painéis cegos e vidros temperados conforme composição indicada em planta.`, 'Ferragens das portas com fechadura, dobradiças de aço inox e batente com borracha de vedação.']],
    ['3. Quantitativos de referência', [`Metragem linear total: ${fmt(t.total, 2)} m (${tipos}).`, `Portas: ${t.portas} unidade(s). Pé-direito de referência: ${proj.pedireito} m.`]],
    ['4. Acabamentos', proj.descricao || 'Cor dos perfis, película e acabamento dos painéis a definir com o cliente antes da produção.'],
    ['5. Instalação', ['A instalação ocorre após a conferência técnica em obra e a liberação do projeto pelo revisor.', 'O local deve estar limpo, com piso e forro concluídos e acesso livre para a equipe.']],
    ['6. Observações', 'Medidas sujeitas à conferência em obra. Divergências acima de 2 cm entre projeto e medição devem ser registradas na verificação técnica.'],
  ]);
}
function pdfProposta(proj, ver){
  const o = proj.orcamento && DB.orcamentos.find(x => x.id === proj.orcamento);
  const t = totaisPlanta(proj.planta);
  const total = o ? o.total : calcula({ metragem:t.total, pedireito:proj.pedireito, portas:t.portas, desconto:0, linha:proj.linha, comp:'Misto: vidro + painel cego' }).total;
  return pdfTexto('Proposta comercial', `${proj.cliente} · ${proj.obra} · ${ver.rev} · ${ver.data}`, [
    ['Escopo', `Divisórias ${proj.linha} para ${proj.obra}, com ${fmt(t.total, 2)} m lineares e ${t.portas} porta(s), conforme o projeto ${proj.id}.`],
    ['Investimento', [`Valor total: ${brl(total)}${o ? ` (orçamento ${o.id})` : ''}.`, 'Condição: 50% de sinal na aprovação e 50% na entrega.']],
    ['Prazo', `Produção em até 15 dias úteis após a liberação do projeto executivo${proj.prazo ? '; previsão de entrega em ' + proj.prazo : ''}.`],
    ['Validade', 'Esta proposta é válida por 15 dias a partir da data de emissão.'],
  ]);
}

function medicaoSVG(proj){
  const fotos = [
    ['Parede B · comprimento', '4,12 m', 'h'], ['Pé-direito · sala 1', '2,78 m', 'v'], ['Vão da porta · circulação', '0,92 m', 'h'],
    ['Parede A · comprimento', '4,50 m', 'h'], ['Parede C · comprimento', '6,02 m', 'h'], ['Nível do piso', '± 3 mm', 'h'],
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
const contorno = (w, h) => [PW('e1', 0, 0, w, 0, 'alvenaria'), PW('e2', w, 0, w, h, 'alvenaria'), PW('e3', w, h, 0, h, 'alvenaria'), PW('e4', 0, h, 0, 0, 'alvenaria')];
const versao = (rev, data, autor, extra) => Object.assign({ rev, data, autor }, extra);
const arquivo = (id, nome, categoria, sit, versoes) => ({ id, nome, categoria, sit, versoes });
const comentario = (autor, ini, quando, texto, arq) => ({ id:uid('c'), autor, ini, quando, texto, arq:arq || null });

function seedProjetos(){
  const p412 = { walls: contorno(1600, 1000).concat([
    PW('wA', 1000, 0, 1000, 450, 'misto'), PW('wB', 0, 600, 420, 600, 'cego'), PW('wC', 1000, 450, 1600, 450, 'vidro'),
    PW('wD', 420, 600, 420, 1000, 'cego'), PW('wE', 420, 600, 820, 600, 'misto'), PW('wF', 820, 600, 820, 1000, 'cego'),
  ]), doors:[ { id:'d1', wall:'wC', t:0.2, w:90 }, { id:'d2', wall:'wE', t:0.5, w:80 }, { id:'d3', wall:'wB', t:0.65, w:80 } ] };
  const p412r1 = clone(p412);
  p412r1.walls = p412r1.walls.filter(w => w.id !== 'wF'); p412r1.walls.find(w => w.id === 'wC').tipo = 'misto';

  const p415 = { walls: contorno(900, 700).concat([
    PW('w1', 0, 250, 500, 250, 'cego'), PW('w2', 125, 0, 125, 250, 'cego'), PW('w3', 250, 0, 250, 250, 'cego'),
    PW('w4', 375, 0, 375, 250, 'cego'), PW('w5', 500, 0, 500, 250, 'cego'),
  ]), doors:[ { id:'d1', wall:'w1', t:0.125, w:60 }, { id:'d2', wall:'w1', t:0.375, w:60 }, { id:'d3', wall:'w1', t:0.625, w:60 }, { id:'d4', wall:'w1', t:0.875, w:60 } ] };

  const p409 = { walls: contorno(2000, 1200).concat([
    PW('w1', 0, 500, 800, 500, 'misto'), PW('w2', 800, 0, 800, 500, 'misto'), PW('w3', 400, 0, 400, 500, 'vidro'),
  ]), doors:[ { id:'d1', wall:'w1', t:0.25, w:90 }, { id:'d2', wall:'w1', t:0.75, w:90 } ] };

  const p418 = { walls: contorno(1400, 900).concat([
    PW('w1', 900, 0, 900, 400, 'vidro'), PW('w2', 900, 400, 1400, 400, 'vidro'),
  ]), doors:[ { id:'d1', wall:'w2', t:0.3, w:90 } ] };

  const equipe = [
    { ini:'AA', nome:'Arquiteta A', papel:'Arquiteta responsável' },
    { ini:'PB', nome:'Projetista B', papel:'Projetista' },
    { ini:'RC', nome:'Revisor C', papel:'Revisor técnico' },
  ];
  return [
    {
      id:'PRJ-0412', nome:'Divisórias do 3º andar', cliente:'[Cliente]', obra:'Sede administrativa', endereco:'Curitiba · PR',
      pedido:1044, orcamento:'ORC-2284', arquiteto:'Arquiteta A', linha:'Divisória articulável', pedireito:'2,80', prazo:'22/11',
      fase:'verificacao', rev:'R01', atualizado:'14/11',
      descricao:'Sala de reunião envidraçada, duas salas fechadas e circulação aberta. Perfis na cor preta e vidro com película jateada até 1,10 m de altura.',
      equipe, planta:p412,
      arquivos:[
        arquivo('a1', 'Planta de layout', 'Planta', 'aprovado', [versao('R02', '13/11', 'Arquiteta A', { gen:'planta', snap:clone(p412) }), versao('R01', '10/11', 'Arquiteta A', { gen:'planta', snap:p412r1 })]),
        arquivo('a2', 'Projeto executivo de divisórias', 'Executivo', 'verificacao', [versao('R01', '14/11', 'Projetista B', { gen:'executivo', snap:clone(p412) })]),
        arquivo('a3', 'Medição técnica', 'Medição', 'arquivado', [versao('12/11', '12/11', 'Equipe de medição', { gen:'medicao' })]),
        arquivo('a4', 'Memorial descritivo', 'Documento', 'arquivado', [versao('R01', '11/11', 'Arquiteta A', { gen:'memorial' })]),
        arquivo('a5', 'Proposta comercial', 'Comercial', 'aprovado', [versao('v3', '08/11', 'Vendedor A', { gen:'proposta' })]),
      ],
      comentarios:[
        comentario('Revisor C', 'RC', '15/11, 09:12', 'A parede B está com 4,20 m no projeto, mas a medição deu 4,12 m. Consegue ajustar antes de liberar?', 'a2'),
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
      pedido:1045, orcamento:null, arquiteto:'Arquiteta A', linha:'Divisórias sanitárias', pedireito:'2,10', prazo:'02/12',
      fase:'levantamento', rev:'R01', atualizado:'12/11',
      descricao:'Quatro cabines com portas de 60 cm, painéis em TS estrutural e ferragens em inox. Medição agendada para 18/11.',
      equipe:[ equipe[0], { ini:'EM', nome:'Equipe de medição', papel:'Levantamento em obra' } ], planta:p415,
      arquivos:[ arquivo('a1', 'Croqui inicial', 'Planta', 'elaboracao', [versao('R01', '12/11', 'Arquiteta A', { gen:'planta', snap:clone(p415) })]) ],
      comentarios:[ comentario('Arquiteta A', 'AA', '12/11, 14:20', 'Croqui feito com base na planta do cliente. Confirmar as medidas no dia 18.') ],
      hist:[ { t:'Croqui inicial criado', quem:'Arquiteta A', quando:'12/11, 14:15' }, { t:'Projeto criado a partir do pedido #1045', quem:'Vendedor A', quando:'10/11, 16:35' } ],
    },
    {
      id:'PRJ-0409', nome:'Escritório da fábrica', cliente:'Cliente E', obra:'Galpão industrial', endereco:'Joinville · SC',
      pedido:1041, orcamento:null, arquiteto:'Arquiteta D', linha:'Europrata 90 mm', pedireito:'3,00', prazo:'22/11',
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
      pedido:null, orcamento:'ORC-2291', arquiteto:'Arquiteta A', linha:'Europrata 90 mm', pedireito:'2,70', prazo:'',
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
   ROTEAMENTO DA ÁREA
============================================================ */
let filtroProj2 = { busca:'', fase:'todos' };
function viewProjetos(param, aba){
  if (param){
    const proj = projetoPorId(param);
    if (proj) return viewProjeto(proj, aba || 'geral');
    location.hash = '#/projetos'; return;
  }
  setHeader('Projetos', `${DB.projetos.length} projetos · plantas, arquivos técnicos e revisões`);
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
        <p>${fmt(t.total, 1)} m de divisórias · ${t.portas} ${t.portas === 1 ? 'porta' : 'portas'}</p>
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
    <p class="modal-sub">O sistema cria a planta com as paredes do ambiente. Depois é só desenhar as divisórias.</p>
    <label for="np2-nome">Nome do projeto</label><input id="np2-nome" placeholder="Ex.: Divisórias do 2º andar">
    <div class="form-2col">
      <div><label for="np2-cliente">Cliente</label><input id="np2-cliente" placeholder="Nome do cliente"></div>
      <div><label for="np2-obra">Obra</label><input id="np2-obra" placeholder="Ex.: Escritório"></div>
      <div><label for="np2-larg">Largura do ambiente</label><div class="input-suffix"><input id="np2-larg" value="12" inputmode="decimal"><em>m</em></div></div>
      <div><label for="np2-prof">Profundidade</label><div class="input-suffix"><input id="np2-prof" value="8" inputmode="decimal"><em>m</em></div></div>
      <div><label for="np2-linha">Linha</label><select id="np2-linha">${Object.keys(LINHAS).map(l => `<option>${l}</option>`).join('')}</select></div>
      <div><label for="np2-ped">Pedido vinculado</label><select id="np2-ped"><option value="">Sem pedido ainda</option>${livres.map(p => `<option value="${p.id}">#${p.id} · ${esc(p.cliente)}</option>`).join('')}</select></div>
    </div>
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
      const larg = Math.min(Math.max(num($('#np2-larg').value), 2), 80) * 100, prof = Math.min(Math.max(num($('#np2-prof').value), 2), 80) * 100;
      const n = Math.max(...DB.projetos.map(p => parseInt(p.id.slice(4), 10) || 0), 400) + 1;
      const u = usuario();
      const proj = {
        id:'PRJ-' + String(n).padStart(4, '0'), nome, cliente, obra:$('#np2-obra').value.trim() || '—', endereco:'',
        pedido: +$('#np2-ped').value || null, orcamento:null, arquiteto:u.nome, linha:$('#np2-linha').value, pedireito:'2,80', prazo:'',
        fase:'levantamento', rev:'R01', atualizado:hoje(), descricao:'',
        equipe:[{ ini:u.ini, nome:u.nome, papel:'Arquiteto(a) responsável' }],
        planta:{ walls:contorno(Math.round(larg), Math.round(prof)), doors:[] }, arquivos:[], comentarios:[], hist:[],
      };
      registrar(proj, 'Projeto criado');
      DB.projetos.unshift(proj); saveDB(); closeModal();
      location.hash = `#/projetos/${proj.id}/planta`;
      toast(`${proj.id} criado. Desenhe as divisórias na planta.`, 'plan');
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

  const abas = [
    ['geral', 'Visão geral', 'painel', ''], ['planta', 'Planta', 'plan', ''],
    ['arquivos', 'Arquivos', 'file', proj.arquivos.length], ['discussao', 'Discussão', 'comment', proj.comentarios.length],
    ['historico', 'Histórico', 'history', ''],
  ];
  $('#content').innerHTML = `
    <nav class="tabs" aria-label="Seções do projeto">${abas.map(([id, nome, ic, c]) =>
      `<a class="tab ${aba === id ? 'active' : ''}" href="#/projetos/${esc(proj.id)}/${id}" style="text-decoration:none">${ico(ic)}${nome}${c !== '' ? `<span class="c">${c}</span>` : ''}</a>`).join('')}</nav>
    <div id="pj-aba"></div>`;
  ({ geral:abaGeral, planta:abaPlanta, arquivos:abaArquivos, discussao:abaDiscussao, historico:abaHistorico }[aba] || abaGeral)(proj, t);
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
          <div><label for="pg-pd">Pé-direito</label><div class="input-suffix"><input id="pg-pd" value="${esc(proj.pedireito)}" inputmode="decimal"><em>m</em></div></div>
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
            <div class="stat"><small>Divisórias</small><b class="num">${fmt(t.total, 1)} m</b></div>
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
    const nome = $('#pg-nome').value.trim();
    $('#pg-nome').classList.toggle('invalid', !nome); if (!nome) return;
    Object.assign(proj, {
      nome, cliente:$('#pg-cliente').value.trim(), obra:$('#pg-obra').value.trim(), endereco:$('#pg-end').value.trim(),
      arquiteto:$('#pg-arq').value.trim(), linha:$('#pg-linha').value, pedireito:$('#pg-pd').value.trim(), prazo:$('#pg-prazo').value.trim(),
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
            <td class="r td-muted">${v.tamanho ? fmtBytes(v.tamanho) : v.gen === 'medicao' ? '6 fotos' : '—'}</td>
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
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nomeDownload(arq, ver);
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
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
function reabrir(projId, arqId, vi){ render(); abrirArquivo(projId, arqId, vi); }

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
   EDITOR DE PLANTA
============================================================ */
let ED = null;
const HINTS = {
  select:'Clique numa divisória ou porta para editar. Arraste o fundo para mover a planta; use a roda do mouse para aproximar.',
  wall:'Clique no ponto inicial. Os pontos se encaixam na grade de 10 cm e nas pontas das paredes.',
  wall2:'Clique para terminar este trecho; o próximo começa daqui. Clique duplo, botão direito ou Esc encerram.',
  door:'Clique sobre uma parede para colocar uma porta.',
  erase:'Clique numa divisória ou porta para apagar.',
};

function abaPlanta(proj){
  $('#pj-aba').innerHTML = `
    <div class="plan-layout">
      <div class="card" style="overflow:hidden">
        <div class="plan-tools">
          <button class="tool" data-tool="select" title="Selecionar (V)">${ico('pointer')}<span class="lbl">Selecionar</span></button>
          <button class="tool" data-tool="wall" title="Desenhar divisória (D)">${ico('wall')}<span class="lbl">Divisória</span></button>
          <button class="tool" data-tool="door" title="Inserir porta (P)">${ico('door')}<span class="lbl">Porta</span></button>
          <button class="tool" data-tool="erase" title="Apagar (E)">${ico('eraser')}<span class="lbl">Apagar</span></button>
          <span class="tool-sep"></span>
          <select class="tool-select" id="ed-tipo" aria-label="Tipo da nova divisória">${Object.keys(TIPOS_PAREDE).map(k => `<option value="${k}">${TIPOS_PAREDE[k].nome}</option>`).join('')}</select>
          <label class="tool-toggle"><input type="checkbox" id="ed-orto" checked>Ortogonal</label>
          <label class="tool-toggle"><input type="checkbox" id="ed-cotas" checked>Cotas</label>
          <span class="tool-sep"></span>
          <button class="tool" id="ed-undo" title="Desfazer (Ctrl+Z)">${ico('undo')}<span class="lbl">Desfazer</span></button>
          <button class="tool" id="ed-redo" title="Refazer (Ctrl+Y)">${ico('redo')}<span class="lbl">Refazer</span></button>
        </div>
        <div class="plan-hint">${ico('info')}<span id="ed-hint"></span></div>
        <div class="plan-canvas" id="ed-canvas">
          <svg id="plan-svg" font-family="Roboto, Arial, sans-serif" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="pg-min" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#eef1f6" stroke-width="1" vector-effect="non-scaling-stroke"/></pattern>
              <pattern id="pg-maj" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#pg-min)"/><path d="M100 0H0V100" fill="none" stroke="#dde3ec" stroke-width="1" vector-effect="non-scaling-stroke"/></pattern>
            </defs>
            <rect x="-20000" y="-20000" width="40000" height="40000" fill="url(#pg-maj)"/>
            <g id="plan-layer"></g><g id="plan-preview"></g>
          </svg>
          <div class="plan-scale">Grade: 50 cm · linha forte a cada 1 m</div>
          <div class="plan-zoom">
            <button id="ed-zin" aria-label="Aproximar">+</button>
            <button id="ed-zout" aria-label="Afastar">−</button>
            <button id="ed-fit" aria-label="Ajustar à tela">${ico('fit')}</button>
          </div>
        </div>
      </div>
      <div>
        <div class="card card-pad" id="ed-props"></div>
        <div class="card card-pad section-gap" id="ed-resumo"></div>
      </div>
    </div>`;

  ED = { proj, plan:proj.planta, tool:'select', tipo:'misto', ortho:true, cotas:true, sel:null, start:null, hover:null,
         vb:null, undo:[], redo:[], down:null, panning:false, histOk:false };
  const svg = $('#plan-svg'), canvas = $('#ed-canvas');

  $$('[data-tool]').forEach(b => b.addEventListener('click', () => edTool(b.dataset.tool)));
  $('#ed-tipo').addEventListener('change', e => { ED.tipo = e.target.value; edTool('wall'); });
  $('#ed-orto').addEventListener('change', e => { ED.ortho = e.target.checked; });
  $('#ed-cotas').addEventListener('change', e => { ED.cotas = e.target.checked; edRender(); });
  $('#ed-undo').addEventListener('click', edUndo);
  $('#ed-redo').addEventListener('click', edRedo);
  $('#ed-zin').addEventListener('click', () => edZoom(1 / 1.25));
  $('#ed-zout').addEventListener('click', () => edZoom(1.25));
  $('#ed-fit').addEventListener('click', () => { edFit(); edRender(); });

  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    ED.down = { sx:e.clientX, sy:e.clientY, vb:Object.assign({}, ED.vb), moved:false };
    if (ED.tool === 'select' && !edHit(edPt(e))){ ED.panning = true; canvas.classList.add('panning'); }
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener('pointermove', e => {
    if (ED.down){
      const dx = e.clientX - ED.down.sx, dy = e.clientY - ED.down.sy;
      if (Math.hypot(dx, dy) > 4) ED.down.moved = true;
      if (ED.panning){ const s = edEscala(); ED.vb.x = ED.down.vb.x - dx * s; ED.vb.y = ED.down.vb.y - dy * s; edAplicaVB(); return; }
    }
    ED.hover = edPt(e); edPreview();
  });
  svg.addEventListener('pointerup', e => {
    const d = ED.down; ED.down = null;
    if (ED.panning){ ED.panning = false; canvas.classList.remove('panning'); if (d && d.moved) return; }
    if (d && !d.moved) edClick(edPt(e));
  });
  svg.addEventListener('pointerleave', () => { ED.hover = null; edPreview(); });
  svg.addEventListener('dblclick', () => { ED.start = null; edPreview(); });
  svg.addEventListener('contextmenu', e => { e.preventDefault(); ED.start = null; edPreview(); });
  svg.addEventListener('wheel', e => { e.preventDefault(); edZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, edPt(e)); }, { passive:false });

  edFit(); edTool('select'); edRender(); edPainel();
}

function edPt(e){
  const svg = $('#plan-svg'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x:r.x, y:r.y };
}
function edEscala(){ const c = $('#ed-canvas'); return Math.max(ED.vb.w / c.clientWidth, ED.vb.h / c.clientHeight); }
function edAplicaVB(){ $('#plan-svg').setAttribute('viewBox', `${r1(ED.vb.x)} ${r1(ED.vb.y)} ${r1(ED.vb.w)} ${r1(ED.vb.h)}`); }
function edFit(){
  const b = bounds(ED.plan), pad = Math.max(b.w, b.h) * 0.1 + 60;
  ED.vb = { x:b.x - pad, y:b.y - pad, w:b.w + 2 * pad, h:b.h + 2 * pad }; edAplicaVB();
}
function edZoom(f, p){
  const nw = ED.vb.w * f; if (nw < 150 || nw > 12000) return;
  p = p || { x:ED.vb.x + ED.vb.w / 2, y:ED.vb.y + ED.vb.h / 2 };
  ED.vb = { x:p.x - (p.x - ED.vb.x) * f, y:p.y - (p.y - ED.vb.y) * f, w:nw, h:ED.vb.h * f };
  edAplicaVB(); edRender(); edPreview();
}
function edTool(t){
  ED.tool = t; ED.start = null;
  if (t !== 'select') ED.sel = null;
  $$('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  $('#ed-canvas').className = 'plan-canvas tool-' + t;
  edRender(); edPreview(); edPainel();
}
function edSnap(p, from){
  let x = Math.round(p.x / 10) * 10, y = Math.round(p.y / 10) * 10, best = null, bd = 14 * edEscala();
  ED.plan.walls.forEach(w => [[w.x1, w.y1], [w.x2, w.y2]].forEach(([ex, ey]) => {
    const d = Math.hypot(ex - p.x, ey - p.y); if (d < bd){ bd = d; best = { x:ex, y:ey }; }
  }));
  if (best){ x = best.x; y = best.y; }
  else if (from && ED.ortho){ if (Math.abs(x - from.x) >= Math.abs(y - from.y)) y = from.y; else x = from.x; }
  return { x, y, snapped:!!best };
}
function edWallPerto(p, tolPx){
  let best = null, bd = (tolPx || 12) * edEscala();
  ED.plan.walls.forEach(w => { const r = projSeg(p, w); if (r.d < bd){ bd = r.d; best = { w, t:r.t }; } });
  return best;
}
function edHit(p){
  const tol = 12 * edEscala();
  for (const d of ED.plan.doors){
    const g = doorGeo(ED.plan, d);
    if (g && Math.hypot(p.x - g.cx, p.y - g.cy) < g.dw / 2 + tol) return { kind:'door', id:d.id };
  }
  const w = edWallPerto(p, 12);
  return w ? { kind:'wall', id:w.w.id } : null;
}
function edCommit(fn){
  ED.undo.push(JSON.stringify(ED.plan)); if (ED.undo.length > 80) ED.undo.shift();
  ED.redo = []; fn(); edSalvar();
}
function edSalvar(){
  if (!ED.histOk){ registrar(ED.proj, 'Planta editada'); ED.histOk = true; }
  ED.proj.atualizado = hoje(); saveDB(); edRender(); edPreview(); edPainel();
}
function edRestaura(json){ const p = JSON.parse(json); ED.plan.walls = p.walls; ED.plan.doors = p.doors; ED.sel = null; edSalvar(); }
function edUndo(){ if (!ED.undo.length){ toast('Nada para desfazer.', 'info'); return; } ED.redo.push(JSON.stringify(ED.plan)); edRestaura(ED.undo.pop()); }
function edRedo(){ if (!ED.redo.length) return; ED.undo.push(JSON.stringify(ED.plan)); edRestaura(ED.redo.pop()); }
function edRemover(hit){
  if (!hit) return;
  edCommit(() => {
    if (hit.kind === 'door') ED.plan.doors = ED.plan.doors.filter(d => d.id !== hit.id);
    else { ED.plan.walls = ED.plan.walls.filter(w => w.id !== hit.id); ED.plan.doors = ED.plan.doors.filter(d => d.wall !== hit.id); }
    ED.sel = null;
  });
}

function edClick(p){
  if (ED.tool === 'wall'){
    const s = edSnap(p, ED.start);
    if (!ED.start){ ED.start = { x:s.x, y:s.y }; edPreview(); return; }
    if (Math.hypot(s.x - ED.start.x, s.y - ED.start.y) < 20) return;
    const a = ED.start;
    edCommit(() => ED.plan.walls.push({ id:uid('w'), x1:a.x, y1:a.y, x2:s.x, y2:s.y, tipo:ED.tipo }));
    ED.start = { x:s.x, y:s.y }; edPreview();
  } else if (ED.tool === 'door'){
    const near = edWallPerto(p, 16); if (!near) return;
    const L = wallLen(near.w), dw = 80;
    if (L < dw + 20){ toast('Parede curta demais para uma porta de 80 cm.', 'alert'); return; }
    const m = (dw / 2 + 10) / L, t = Math.min(Math.max(near.t, m), 1 - m);
    edCommit(() => ED.plan.doors.push({ id:uid('d'), wall:near.w.id, t, w:dw }));
  } else if (ED.tool === 'erase'){
    edRemover(edHit(p));
  } else {
    ED.sel = edHit(p); edRender(); edPainel();
  }
}

function edRender(){
  const g = $('#plan-layer'); if (!g || !ED) return;
  g.innerHTML = planMarkup(ED.plan, { labels:ED.cotas, sel:ED.sel, fs:12 * edEscala() });
}
function edPreview(){
  const g = $('#plan-preview'); if (!g || !ED) return;
  const k = edEscala(), h = ED.hover; let s = '';
  $('#ed-hint').textContent = ED.tool === 'wall' && ED.start ? HINTS.wall2 : HINTS[ED.tool];
  if (h && ED.tool === 'wall'){
    const sp = edSnap(h, ED.start);
    if (ED.start){
      const t = TIPOS_PAREDE[ED.tipo], len = Math.hypot(sp.x - ED.start.x, sp.y - ED.start.y);
      s += `<line x1="${ED.start.x}" y1="${ED.start.y}" x2="${sp.x}" y2="${sp.y}" stroke="${t.cor}" stroke-opacity=".6" stroke-width="${t.w}" stroke-linecap="square"/>`
        + `<circle cx="${ED.start.x}" cy="${ED.start.y}" r="${r1(5 * k)}" fill="#53d4f0"/>`;
      if (len > 0) s += `<text x="${r1((ED.start.x + sp.x) / 2)}" y="${r1((ED.start.y + sp.y) / 2 - 16 * k)}" font-size="${r1(13 * k)}" font-weight="700" fill="#0b8fb3" text-anchor="middle" stroke="#fff" stroke-width="${r1(4 * k)}" paint-order="stroke">${fmt(len / 100, 2)} m</text>`;
    }
    s += `<circle cx="${sp.x}" cy="${sp.y}" r="${r1((sp.snapped ? 8 : 5) * k)}" fill="none" stroke="${sp.snapped ? '#0b8fb3' : '#14337a'}" stroke-width="${r1(2 * k)}"/>`;
  } else if (h && ED.tool === 'door'){
    const near = edWallPerto(h, 16);
    if (near && wallLen(near.w) >= 100){
      const L = wallLen(near.w), m = 50 / L, t = Math.min(Math.max(near.t, m), 1 - m);
      const g2 = doorGeo({ walls:[near.w] }, { wall:near.w.id, t, w:80 });
      s += `<path d="M${r1(g2.p1.x)} ${r1(g2.p1.y)} A80 80 0 0 1 ${r1(g2.q.x)} ${r1(g2.q.y)}" fill="none" stroke="#0b8fb3" stroke-width="2" stroke-dasharray="6 5"/>`
        + `<line x1="${r1(g2.p0.x)}" y1="${r1(g2.p0.y)}" x2="${r1(g2.q.x)}" y2="${r1(g2.q.y)}" stroke="#0b8fb3" stroke-width="4"/>`
        + `<line x1="${r1(g2.p0.x)}" y1="${r1(g2.p0.y)}" x2="${r1(g2.p1.x)}" y2="${r1(g2.p1.y)}" stroke="#53d4f0" stroke-width="10" stroke-opacity=".5"/>`;
    }
  } else if (h && (ED.tool === 'erase' || ED.tool === 'select')){
    const hit = edHit(h);
    if (hit){
      const cor = ED.tool === 'erase' ? '#e0533f' : '#53d4f0';
      if (hit.kind === 'wall'){ const w = ED.plan.walls.find(x => x.id === hit.id); s += `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${cor}" stroke-opacity=".35" stroke-width="${r1(16 * k)}" stroke-linecap="round"/>`; }
      else { const g2 = doorGeo(ED.plan, ED.plan.doors.find(d => d.id === hit.id)); s += `<circle cx="${r1(g2.cx)}" cy="${r1(g2.cy)}" r="${g2.dw * 0.7}" fill="${cor}" fill-opacity=".2" stroke="${cor}" stroke-width="${r1(2 * k)}"/>`; }
    }
  }
  g.innerHTML = s;
}

function edPainel(){
  const P = $('#ed-props'), R = $('#ed-resumo'); if (!P || !ED) return;
  const plan = ED.plan, Ls = letras(plan), sel = ED.sel;
  if (sel && sel.kind === 'wall'){
    const w = plan.walls.find(x => x.id === sel.id);
    P.innerHTML = `<h3>${w.tipo === 'alvenaria' ? 'Alvenaria existente' : 'Parede ' + Ls[w.id]}</h3>
      <label for="pp-len">Comprimento</label><div class="input-suffix"><input id="pp-len" value="${fmt(wallLen(w) / 100, 2)}" inputmode="decimal"><em>m</em></div>
      <label for="pp-tipo">Tipo</label><select id="pp-tipo">${Object.keys(TIPOS_PAREDE).map(k => `<option value="${k}" ${k === w.tipo ? 'selected' : ''}>${TIPOS_PAREDE[k].nome}</option>`).join('')}</select>
      <p class="form-note">${ico('info')}O comprimento muda a ponta final da parede, mantendo a direção.</p>
      <button class="btn btn-danger btn-sm" id="pp-del" style="margin-top:14px">${ico('trash')}Excluir parede</button>`;
    $('#pp-len').addEventListener('change', e => {
      const nl = num(e.target.value) * 100;
      if (nl < 20 || nl > 10000){ e.target.classList.add('invalid'); return; }
      const L = wallLen(w), ux = (w.x2 - w.x1) / L, uy = (w.y2 - w.y1) / L;
      edCommit(() => { w.x2 = Math.round(w.x1 + ux * nl); w.y2 = Math.round(w.y1 + uy * nl); });
    });
    $('#pp-len').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
    $('#pp-tipo').addEventListener('change', e => edCommit(() => { w.tipo = e.target.value; }));
    $('#pp-del').addEventListener('click', () => edRemover(sel));
  } else if (sel && sel.kind === 'door'){
    const d = plan.doors.find(x => x.id === sel.id), w = plan.walls.find(x => x.id === d.wall);
    P.innerHTML = `<h3>Porta</h3><p class="prop-empty" style="margin-top:4px">Na ${w && w.tipo !== 'alvenaria' ? 'parede ' + Ls[w.id] : 'alvenaria'}</p>
      <label for="pp-dw">Largura da folha</label><select id="pp-dw">${[60, 70, 80, 90, 100, 120].map(v => `<option value="${v}" ${v === (d.w || 80) ? 'selected' : ''}>${v} cm</option>`).join('')}</select>
      <label for="pp-pos">Posição na parede</label><input id="pp-pos" type="range" min="0" max="100" value="${Math.round(d.t * 100)}" style="padding:0">
      <button class="btn btn-danger btn-sm" id="pp-del" style="margin-top:14px">${ico('trash')}Excluir porta</button>`;
    $('#pp-dw').addEventListener('change', e => edCommit(() => { d.w = +e.target.value; }));
    $('#pp-pos').addEventListener('change', e => edCommit(() => {
      const L = w ? wallLen(w) : 100, m = ((d.w || 80) / 2 + 10) / L; d.t = Math.min(Math.max(+e.target.value / 100, m), 1 - m);
    }));
    $('#pp-del').addEventListener('click', () => edRemover(sel));
  } else {
    P.innerHTML = `<h3>Propriedades</h3><p class="prop-empty" style="margin-top:8px">Use <b>Selecionar</b> e clique numa divisória ou porta para ajustar medida, tipo e posição.<br><br>
      Atalhos: <b>V</b> selecionar · <b>D</b> divisória · <b>P</b> porta · <b>E</b> apagar · <b>Delete</b> exclui o selecionado · <b>Ctrl+Z</b> desfaz.</p>`;
  }

  const t = totaisPlanta(plan);
  R.innerHTML = `<h3 style="margin-bottom:10px">Resumo da planta</h3>
    <div class="big-total num">${fmt(t.total, 2)} m</div><small>de divisórias · ${t.portas} ${t.portas === 1 ? 'porta' : 'portas'}</small>
    <div style="margin-top:12px">${Object.keys(TIPOS_PAREDE).filter(k => k !== 'alvenaria').map(k =>
      `<div class="legend-row"><i style="background:${TIPOS_PAREDE[k].cor}"></i><span>${TIPOS_PAREDE[k].nome}</span><b class="num">${fmt(t.porTipo[k] || 0, 2)} m</b></div>`).join('')}
      <div class="legend-row"><i style="background:${TIPOS_PAREDE.alvenaria.cor}"></i><span>Alvenaria (não entra no total)</span></div></div>
    <button class="btn btn-primary btn-block" id="ed-orc" style="margin-top:14px">${ico('orcamentos')}Gerar orçamento desta planta</button>
    <button class="btn btn-outline btn-block" id="ed-rev" style="margin-top:8px">${ico('save')}Salvar como revisão ${esc(proximaRev(ED.proj.rev))}</button>`;
  $('#ed-orc').addEventListener('click', () => orcamentoDaPlanta(ED.proj));
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
    metragem:fmt(t.total, 2), pedireito:proj.pedireito || '2,80', portas:String(t.portas), desconto:'0',
    obs:`Gerado a partir da planta ${proj.id} (${proj.rev}).`, status:'rascunho', data:hoje(), vendedor:usuario().nome,
  };
  o.total = calcula(o).total;
  DB.orcamentos.unshift(o); proj.orcamento = o.id;
  registrar(proj, `Orçamento ${o.id} gerado a partir da planta`); saveDB();
  location.hash = '#/orcamentos/' + o.id;
  toast(`${o.id} criado com ${fmt(t.total, 2)} m e ${t.portas} porta(s).`, 'orcamentos');
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
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag) || !$('#modal-back').hidden) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z'){ e.preventDefault(); e.shiftKey ? edRedo() : edUndo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y'){ e.preventDefault(); edRedo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'escape'){ ED.start = null; edPreview(); return; }
  if ((k === 'delete' || k === 'backspace') && ED.sel){ e.preventDefault(); edRemover(ED.sel); return; }
  const mapa = { v:'select', d:'wall', p:'door', e:'erase' };
  if (mapa[k]) edTool(mapa[k]);
});
