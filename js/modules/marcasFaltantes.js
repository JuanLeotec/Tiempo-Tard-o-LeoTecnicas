// ============================================================
// marcasFaltantes.js — Vista "Marcas Faltantes" (misma lógica que renderOlvidos original)
// ============================================================
import { fmt, deptChipClass, DEPT_COLORS_HEX, MESES_ORD, showToast } from '../core/utils.js';
import { openEmployeePanel } from '../components/sidePanel.js';

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MARCAS = ['Entrada Mañana','Salida Mañana','Entrada Tarde','Salida Tarde'];

let filtered = [];
let sortCol = 'fecha';
let sortAsc = true;

function getData(){ return window.SIN_MARCA || []; }

function getF(){
  return {
    mes: document.getElementById('mfFMes').value,
    dia: document.getElementById('mfFDia').value,
    dept: document.getElementById('mfFDept').value,
    pers: document.getElementById('mfFPers').value,
    olvido: document.getElementById('mfFOlvido').value,
    desde: document.getElementById('mfFDesde').value,
    hasta: document.getElementById('mfFHasta').value
  };
}

function applyFilters(){
  const f = getF();
  filtered = getData().filter(r =>
    (!f.mes || r.mes === f.mes) && (!f.dia || r.dia === f.dia) && (!f.dept || r.d === f.dept) &&
    (!f.pers || r.n === f.pers) && (!f.olvido || r.f.includes(f.olvido)) &&
    (!f.desde || r.fecha >= f.desde) && (!f.hasta || r.fecha <= f.hasta)
  );
  sortData();
  paintStats();
  paintTable();
}

function sortData(){
  filtered.sort((a,b) => {
    let va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
    if(typeof va === 'number') return sortAsc ? va - vb : vb - va;
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}
function sortBy(col){
  if(sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
  sortData();
  paintTable();
}

function horaMiss(h){
  return h ? `<span style="font-variant-numeric:tabular-nums">${h}</span>` : `<span class="chip chip-danger">✗ FALTA</span>`;
}

function populateEmployeeSelect(){
  const sel = document.getElementById('mfFPers');
  if(sel.dataset.filled) return;
  const names = [...new Set(getData().map(r => r.n))].sort();
  names.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  sel.dataset.filled = '1';
}

function statCard(icon,tone,value,label){
  return `<div class="metric-card" style="padding:14px 16px">
    <div class="metric-icon tone-${tone}" style="width:38px;height:38px"><i data-lucide="${icon}" style="width:17px;height:17px"></i></div>
    <div class="metric-body"><div class="metric-label">${label}</div><div class="metric-value" style="font-size:var(--fs-lg)">${value}</div></div>
  </div>`;
}

function paintStats(){
  const data = filtered;
  const pers = new Set(data.map(r => r.n)).size;
  document.getElementById('mfStats').innerHTML =
    statCard('alert-triangle','yellow',fmt(data.length),'Con olvido') +
    statCard('users','blue',pers,'Personas') +
    statCard('circle-dot','yellow',fmt(data.filter(r=>r.cant===1).length),'1 faltante') +
    statCard('circle-dot','yellow',fmt(data.filter(r=>r.cant===2).length),'2 faltantes') +
    statCard('siren','red',fmt(data.filter(r=>r.cant>=3).length),'3+ faltantes');

  const porP = {};
  data.forEach(r => { porP[r.n] = (porP[r.n] || 0) + 1; });
  const top5 = Object.entries(porP).sort((a,b) => b[1] - a[1]).slice(0,5);

  const porM = {};
  data.forEach(r => r.f.forEach(m => { porM[m] = (porM[m] || 0) + 1; }));
  const marcasOrdenadas = Object.entries(porM).sort((a,b) => b[1] - a[1]);

  document.getElementById('mfGrid').innerHTML = `
    <div class="card">
      <div class="card-title"><i data-lucide="trophy" style="width:14px;height:14px"></i> Top 5 con más olvidos</div>
      ${top5.length ? top5.map(([n,v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--color-border);font-size:var(--fs-sm)">
          <span style="font-weight:600">${n}</span><span class="cell-danger" style="font-weight:700">${v} días</span>
        </div>`).join('') : `<p style="color:var(--color-text-muted);font-size:var(--fs-sm)">Sin datos.</p>`}
    </div>
    <div class="card">
      <div class="card-title"><i data-lucide="bar-chart-3" style="width:14px;height:14px"></i> Marcas más olvidadas</div>
      ${marcasOrdenadas.length ? marcasOrdenadas.map(([m,v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--color-border);font-size:var(--fs-sm)">
          <span>${m}</span><span style="font-weight:700">${fmt(v)}</span>
        </div>`).join('') : `<p style="color:var(--color-text-muted);font-size:var(--fs-sm)">Sin datos.</p>`}
    </div>
  `;
  if(window.lucide) window.lucide.createIcons();
}

function arrow(col){ return sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'; }

function paintTable(){
  document.getElementById('mfTableCount').textContent = fmt(filtered.length) + ' registros';
  const thead = document.getElementById('mfThead');
  thead.innerHTML = `<tr>
    <th data-sort="fecha">Fecha${arrow('fecha')}</th><th data-sort="dia">Día${arrow('dia')}</th>
    <th data-sort="n">Empleado${arrow('n')}</th><th>Departamento</th>
    <th>Entrada Mañana</th><th>Salida Mañana</th><th>Entrada Tarde</th><th>Salida Tarde</th>
    <th data-sort="cant">Faltantes${arrow('cant')}</th><th>¿Cuáles?</th><th>Ver</th>
  </tr>`;
  thead.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => sortBy(th.dataset.sort)));

  const tbody = document.getElementById('mfTbody');
  if(!filtered.length){
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--color-text-muted)">Sin registros con olvidos para estos filtros.</td></tr>`;
    return;
  }
  const shown = filtered.slice(0, 500);
  tbody.innerHTML = shown.map(r => `
    <tr>
      <td class="cell-strong">${r.fecha}</td><td>${r.dia || '—'}</td>
      <td style="font-weight:600;min-width:150px">${r.n}</td>
      <td><span class="chip ${deptChipClass(r.d)}"><span class="chip-dot" style="background:${DEPT_COLORS_HEX[r.d]||'#9aa5b8'}"></span>${r.d}</span></td>
      <td>${horaMiss(r.em)}</td><td>${horaMiss(r.sm)}</td>
      <td>${horaMiss(r.et)}</td><td>${horaMiss(r.st)}</td>
      <td><span class="chip ${r.cant>=3?'chip-danger':r.cant===2?'chip-warn':'chip-warn'}">${r.cant}</span></td>
      <td style="font-size:var(--fs-xs);color:var(--brand-red-600);font-weight:600">${r.f.join(', ')}</td>
      <td><button class="btn btn-primary btn-sm" data-ver="${encodeURIComponent(r.n)}">Ver</button></td>
    </tr>`).join('');
  if(filtered.length > 500){
    tbody.innerHTML += `<tr><td colspan="11" style="text-align:center;padding:10px;background:var(--brand-yellow-100);color:var(--brand-yellow-600);font-size:var(--fs-xs);font-weight:700">⚠️ Mostrando 500 de ${fmt(filtered.length)}. Usa los filtros para reducir.</td></tr>`;
  }
  tbody.querySelectorAll('[data-ver]').forEach(btn => {
    btn.addEventListener('click', () => openEmployeePanel(decodeURIComponent(btn.dataset.ver)));
  });
}

function exportCSV(){
  const h = ['Fecha','Día','Empleado','Departamento','Entrada Mañana','Salida Mañana','Entrada Tarde','Salida Tarde','Cant. Faltantes','Marcas Faltantes'];
  const rows = filtered.map(r => [r.fecha,r.dia,`"${r.n}"`,r.d,r.em||'FALTA',r.sm||'FALTA',r.et||'FALTA',r.st||'FALTA',r.cant,`"${r.f.join(', ')}"`].join(','));
  const blob = new Blob(['\uFEFF' + [h.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'registros_olvidos.csv'; a.click();
  showToast('CSV exportado');
}

function skeleton(){
  return `
    <div class="filter-bar">
      <div class="filter-group"><label>Mes</label><select id="mfFMes"><option value="">Todos</option>${MESES_ORD.map(m=>`<option>${m}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Día</label><select id="mfFDia"><option value="">Todos</option>${DIAS.map(d=>`<option>${d}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Departamento</label><select id="mfFDept"><option value="">Todos</option><option>Administración</option><option>Campo</option><option>Taller</option><option>Transformadores</option></select></div>
      <div class="filter-group"><label>Empleado</label><select id="mfFPers"><option value="">Todos</option></select></div>
      <div class="filter-group"><label>Marca faltante</label><select id="mfFOlvido"><option value="">Todas</option>${MARCAS.map(m=>`<option>${m}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Desde</label><input type="date" id="mfFDesde"></div>
      <div class="filter-group"><label>Hasta</label><input type="date" id="mfFHasta"></div>
      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" id="mfClear"><i data-lucide="rotate-ccw"></i> Limpiar</button>
        <button class="btn btn-success btn-sm" id="mfExport"><i data-lucide="download"></i> CSV</button>
      </div>
    </div>

    <div class="grid stagger" id="mfStats" style="grid-template-columns:repeat(5,1fr)"></div>

    <div class="grid grid-2" id="mfGrid"></div>

    <div class="table-card">
      <div class="table-card-head">
        <h3>⚠️ Registros con marcas faltantes</h3>
        <span class="table-count" id="mfTableCount">0</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead id="mfThead"></thead>
          <tbody id="mfTbody"></tbody>
        </table>
      </div>
    </div>
  `;
}

export function render(firstMount){
  const container = document.getElementById('view-marcas');
  if(firstMount){
    container.innerHTML = skeleton();
    populateEmployeeSelect();
    ['mfFMes','mfFDia','mfFDept','mfFPers','mfFOlvido','mfFDesde','mfFHasta'].forEach(id => {
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('mfClear').addEventListener('click', () => {
      ['mfFMes','mfFDia','mfFDept','mfFPers','mfFOlvido','mfFDesde','mfFHasta'].forEach(id => document.getElementById(id).value = '');
      applyFilters();
    });
    document.getElementById('mfExport').addEventListener('click', exportCSV);
    document.addEventListener('data:refresh', applyFilters);
    document.addEventListener('data:export-current', () => { if(document.getElementById('view-marcas').classList.contains('active')) exportCSV(); });
    if(window.lucide) window.lucide.createIcons();
    applyFilters();
  }
}
