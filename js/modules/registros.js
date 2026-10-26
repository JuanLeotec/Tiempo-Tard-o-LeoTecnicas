// ============================================================
// registros.js — Vista "Registros" (misma lógica que renderAsistencia original)
// ============================================================
import { fmt, deptChipClass, DEPT_COLORS_HEX, MESES_ORD, showToast } from '../core/utils.js';
import { openEmployeePanel } from '../components/sidePanel.js';

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

let filtered = [];
let sortCol = 'fecha';
let sortAsc = true;

function getData(){ return window.FULL_DATA || []; }
function getUltimoSabado(){ return window.ULTIMO_SABADO; }

function getF(){
  return {
    mes: document.getElementById('rgFMes').value,
    dia: document.getElementById('rgFDia').value,
    dept: document.getElementById('rgFDept').value,
    pers: document.getElementById('rgFPers').value,
    tardio: document.getElementById('rgFTardio').value,
    desde: document.getElementById('rgFDesde').value,
    hasta: document.getElementById('rgFHasta').value
  };
}

function applyFilters(){
  const f = getF();
  filtered = getData().filter(r =>
    (!f.mes || r.mes === f.mes) && (!f.dia || r.dia === f.dia) && (!f.dept || r.d === f.dept) &&
    (!f.pers || r.n === f.pers) && (f.tardio === '' || (f.tardio === '1' ? r.tt > 0 : r.tt <= 0)) &&
    (!f.desde || r.fecha >= f.desde) && (!f.hasta || r.fecha <= f.hasta)
  );
  sortData();
  paintTable();
  paintStats();
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

function horaOk(h){
  return h ? `<span style="font-variant-numeric:tabular-nums">${h}</span>` : `<span class="cell-muted">—</span>`;
}
function horaSab(h){
  return h ? `<span style="font-variant-numeric:tabular-nums">${h}</span>` : `<span class="cell-muted" style="font-size:var(--fs-2xs)">Turno corto</span>`;
}

function populateEmployeeSelect(){
  const sel = document.getElementById('rgFPers');
  if(sel.dataset.filled) return;
  const names = [...new Set(getData().map(r => r.n))].sort();
  names.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  sel.dataset.filled = '1';
}

function paintStats(){
  const data = filtered;
  const conT = data.filter(r => r.tt > 0).length;
  document.getElementById('rgStats').innerHTML = `
    ${statCard('clipboard-list','blue',fmt(data.length),'Registros')}
    ${statCard('alarm-clock','red',fmt(conT),'Con tardío')}
    ${statCard('sunrise','yellow',fmt(data.reduce((s,r)=>s+r.mm,0)),'Min tardío mañana')}
    ${statCard('sunset','yellow',fmt(data.reduce((s,r)=>s+r.mt,0)),'Min tardío tarde')}
    ${statCard('alert-triangle','red',fmt(data.reduce((s,r)=>s+r.tt,0)),'Total min tardíos')}
  `;
  if(window.lucide) window.lucide.createIcons();
}
function statCard(icon,tone,value,label){
  return `<div class="metric-card" style="padding:14px 16px">
    <div class="metric-icon tone-${tone}" style="width:38px;height:38px"><i data-lucide="${icon}" style="width:17px;height:17px"></i></div>
    <div class="metric-body"><div class="metric-label">${label}</div><div class="metric-value" style="font-size:var(--fs-lg)">${value}</div></div>
  </div>`;
}

function arrow(col){ return sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'; }

function paintTable(){
  document.getElementById('rgTableCount').textContent = fmt(filtered.length) + ' registros';
  const thead = document.getElementById('rgThead');
  thead.innerHTML = `<tr>
    <th data-sort="fecha">Fecha${arrow('fecha')}</th><th data-sort="dia">Día${arrow('dia')}</th>
    <th data-sort="n">Empleado${arrow('n')}</th><th>Departamento</th>
    <th>Entrada Mañana</th><th>Salida Mañana</th><th>Entrada Tarde</th><th>Salida Tarde</th>
    <th>Ret.M</th><th>Ret.T</th><th>Min M</th><th>Min T</th>
    <th data-sort="tt">Total${arrow('tt')}</th><th>H.Extra</th><th>Ver</th>
  </tr>`;
  thead.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => sortBy(th.dataset.sort)));

  const tbody = document.getElementById('rgTbody');
  const ULTIMO_SABADO = getUltimoSabado();
  if(!filtered.length){
    tbody.innerHTML = `<tr><td colspan="15" style="text-align:center;padding:40px;color:var(--color-text-muted)">Sin registros para estos filtros.</td></tr>`;
    return;
  }
  const shown = filtered.slice(0, 500);
  tbody.innerHTML = shown.map(r => {
    const esSab = (r.dia === 'Sábado' && r.fecha === ULTIMO_SABADO);
    return `<tr>
      <td class="cell-strong">${r.fecha}</td><td>${r.dia || '—'}</td>
      <td style="font-weight:600;min-width:150px">${r.n}</td>
      <td><span class="chip ${deptChipClass(r.d)}"><span class="chip-dot" style="background:${DEPT_COLORS_HEX[r.d]||'#9aa5b8'}"></span>${r.d}</span></td>
      <td>${horaOk(r.em)}</td><td>${esSab ? horaSab(r.sm) : horaOk(r.sm)}</td>
      <td>${esSab ? horaSab(r.et) : horaOk(r.et)}</td><td>${esSab ? horaSab(r.st) : horaOk(r.st)}</td>
      <td>${r.rm ? '<span class="chip chip-danger">Sí</span>' : '<span class="chip chip-ok">No</span>'}</td>
      <td>${r.rt ? '<span class="chip chip-danger">Sí</span>' : '<span class="chip chip-ok">No</span>'}</td>
      <td>${r.mm > 0 ? fmt(r.mm) : '<span class="cell-muted">0</span>'}</td>
      <td>${r.mt > 0 ? fmt(r.mt) : '<span class="cell-muted">0</span>'}</td>
      <td>${r.tt > 0 ? `<span class="chip chip-danger">${fmt(r.tt)}</span>` : '<span class="cell-muted">0</span>'}</td>
      <td>${r.es ? '<span class="chip chip-warn">Sí</span>' : '<span class="cell-muted">—</span>'}</td>
      <td><button class="btn btn-primary btn-sm" data-ver="${encodeURIComponent(r.n)}">Ver</button></td>
    </tr>`;
  }).join('');
  if(filtered.length > 500){
    tbody.innerHTML += `<tr><td colspan="15" style="text-align:center;padding:10px;background:var(--brand-yellow-100);color:var(--brand-yellow-600);font-size:var(--fs-xs);font-weight:700">⚠️ Mostrando 500 de ${fmt(filtered.length)}. Usa los filtros para reducir.</td></tr>`;
  }
  tbody.querySelectorAll('[data-ver]').forEach(btn => {
    btn.addEventListener('click', () => openEmployeePanel(decodeURIComponent(btn.dataset.ver)));
  });
}

function exportCSV(){
  const h = ['Fecha','Día','Empleado','Departamento','Entrada Mañana','Salida Mañana','Entrada Tarde','Salida Tarde','Ret.Mañana','Ret.Tarde','Min Mañana','Min Tarde','Total Min','H.Extra'];
  const rows = filtered.map(r => [r.fecha,r.dia,`"${r.n}"`,r.d,r.em||'',r.sm||'',r.et||'',r.st||'',r.rm?'Sí':'No',r.rt?'Sí':'No',r.mm,r.mt,r.tt,r.es?'Sí':'No'].join(','));
  const blob = new Blob(['\uFEFF' + [h.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'registros_asistencia.csv'; a.click();
  showToast('CSV exportado');
}

function skeleton(){
  return `
    <div class="filter-bar">
      <div class="filter-group"><label>Mes</label><select id="rgFMes"><option value="">Todos</option>${MESES_ORD.map(m=>`<option>${m}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Día</label><select id="rgFDia"><option value="">Todos</option>${DIAS.map(d=>`<option>${d}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Departamento</label><select id="rgFDept"><option value="">Todos</option><option>Administración</option><option>Campo</option><option>Taller</option><option>Transformadores</option></select></div>
      <div class="filter-group"><label>Empleado</label><select id="rgFPers"><option value="">Todos</option></select></div>
      <div class="filter-group"><label>Tardíos</label><select id="rgFTardio"><option value="">Todos</option><option value="1">Con tardío</option><option value="0">Sin tardío</option></select></div>
      <div class="filter-group"><label>Desde</label><input type="date" id="rgFDesde"></div>
      <div class="filter-group"><label>Hasta</label><input type="date" id="rgFHasta"></div>
      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" id="rgClear"><i data-lucide="rotate-ccw"></i> Limpiar</button>
        <button class="btn btn-success btn-sm" id="rgExport"><i data-lucide="download"></i> CSV</button>
      </div>
    </div>

    <div class="grid grid-4 stagger" id="rgStats" style="grid-template-columns:repeat(5,1fr)"></div>

    <div class="table-card">
      <div class="table-card-head">
        <h3>📅 Registro diario de asistencia</h3>
        <span class="table-count" id="rgTableCount">0</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead id="rgThead"></thead>
          <tbody id="rgTbody"></tbody>
        </table>
      </div>
    </div>
  `;
}

export function render(firstMount){
  const container = document.getElementById('view-registros');
  if(firstMount){
    container.innerHTML = skeleton();
    populateEmployeeSelect();
    ['rgFMes','rgFDia','rgFDept','rgFPers','rgFTardio','rgFDesde','rgFHasta'].forEach(id => {
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('rgClear').addEventListener('click', () => {
      ['rgFMes','rgFDia','rgFDept','rgFPers','rgFTardio','rgFDesde','rgFHasta'].forEach(id => document.getElementById(id).value = '');
      applyFilters();
    });
    document.getElementById('rgExport').addEventListener('click', exportCSV);
    document.addEventListener('data:refresh', applyFilters);
    document.addEventListener('data:export-current', () => { if(document.getElementById('view-registros').classList.contains('active')) exportCSV(); });
    if(window.lucide) window.lucide.createIcons();
    applyFilters();
  }
}
