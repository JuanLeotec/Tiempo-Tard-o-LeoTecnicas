// ============================================================
// dashboard.js — Vista principal (misma lógica que index.html original)
// ============================================================
import { fmt, truncateName, DEPT_COLORS_HEX, deptChipClass, MESES_ORD } from '../core/utils.js';
import { metricCardHTML, animateMetricCards } from '../components/metricCard.js';
import { makeDonut, makeLineTrend, makeBar } from '../components/charts.js';
import { settings } from '../core/state.js';

const RAW = window.DASHBOARD_DATA;      // dataset sin modificar (ver data/dashboard-data.js)
const WEEK = window.WEEK_DATA;

function getFiltered(){
  const mes = document.getElementById('dbFMes').value;
  const dept = document.getElementById('dbFDept').value;
  const pers = document.getElementById('dbFPers').value;
  return RAW.filter(r => (!mes || r.mes === mes) && (!dept || r.d === dept) && (!pers || r.n === pers));
}

function aggByPerson(data){
  const g = {};
  data.forEach(r => {
    if(!g[r.n]) g[r.n] = { n:r.n, d:r.d, mm:0, mt:0, tt:0, rm:0, rt:0, cnt:0 };
    g[r.n].mm += r.mm; g[r.n].mt += r.mt; g[r.n].tt += r.tt;
    g[r.n].rm += r.rm; g[r.n].rt += r.rt; g[r.n].cnt += r.cnt;
  });
  return Object.values(g);
}

function populateEmployeeSelect(){
  const sel = document.getElementById('dbFPers');
  if(sel.dataset.filled) return;
  const names = [...new Set(RAW.map(r => r.n))].sort();
  names.forEach(n => {
    const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o);
  });
  sel.dataset.filled = '1';
}

function widgetVisible(key){ return settings.widgets[key] !== false; }

function skeleton(){
  return `
    <div class="filter-bar">
      <div class="filter-group"><label>Año</label>
        <select id="dbFAnio"><option value="">Todos</option><option value="2026" selected>2026</option></select>
      </div>
      <div class="filter-group"><label>Mes</label>
        <select id="dbFMes"><option value="">Todos</option>${MESES_ORD.map(m=>`<option>${m}</option>`).join('')}</select>
      </div>
      <div class="filter-group"><label>Departamento</label>
        <select id="dbFDept"><option value="">Todos</option><option>Administración</option><option>Campo</option><option>Taller</option><option>Transformadores</option></select>
      </div>
      <div class="filter-group"><label>Empleado</label><select id="dbFPers"><option value="">Todos</option></select></div>
      <div class="filter-group"><label>Mostrar</label>
        <select id="dbFTipo"><option value="tt">Tardío total</option><option value="mm">Solo mañana</option><option value="mt">Solo tarde</option></select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" id="dbClear"><i data-lucide="rotate-ccw"></i> Limpiar</button>
      </div>
    </div>

    <div class="grid grid-4 stagger" id="dbMetrics"></div>

    <div class="card" id="dbTrendCard">
      <div class="card-title"><i data-lucide="trending-up" style="width:14px;height:14px"></i> Tendencia mensual de tiempo tardío</div>
      <div style="position:relative;width:100%;height:230px"><canvas id="dbTrendChart"></canvas></div>
    </div>

    <div class="grid grid-2" id="dbSecondRow">
      <div class="card" id="dbDeptCard">
        <div class="card-title"><i data-lucide="building-2" style="width:14px;height:14px"></i> Tiempo tardío por departamento</div>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="position:relative;width:140px;height:140px;flex-shrink:0;overflow:hidden"><canvas id="dbDonutChart"></canvas></div>
          <table style="flex:1;min-width:0;font-size:var(--fs-sm)"><tbody id="dbDonutLegend"></tbody></table>
        </div>
      </div>
      <div class="card" id="dbTurnosCard">
        <div class="card-title"><i data-lucide="sunrise" style="width:14px;height:14px"></i> Retardo mañana vs tarde</div>
        <div style="display:flex;gap:10px;justify-content:space-around;align-items:center;text-align:center;padding:6px 0">
          <div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted);margin-bottom:4px">Mañana</div>
            <div id="dbMmVal" style="font-size:var(--fs-xl);font-weight:800;color:var(--brand-blue-700)">0</div>
            <div id="dbMmPct" style="font-size:var(--fs-xs);color:var(--brand-blue-700);font-weight:600">0%</div></div>
          <div style="width:110px;height:110px;position:relative;flex-shrink:0;overflow:hidden"><canvas id="dbHalfChart"></canvas></div>
          <div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted);margin-bottom:4px">Tarde</div>
            <div id="dbMtVal" style="font-size:var(--fs-xl);font-weight:800;color:var(--brand-green-700)">0</div>
            <div id="dbMtPct" style="font-size:var(--fs-xs);color:var(--brand-green-700);font-weight:600">0%</div></div>
        </div>
        <div style="font-size:var(--fs-2xs);color:var(--color-text-muted);text-align:center;margin-top:6px" id="dbHalfNote"></div>
      </div>
    </div>

    <div class="card" id="dbTop10Card">
      <div class="card-title"><i data-lucide="trophy" style="width:14px;height:14px"></i> Top 10 — tiempo tardío</div>
      <div id="dbBarChart" style="display:flex;flex-direction:column;gap:7px"></div>
    </div>

    <div class="table-card" id="dbTableCard">
      <div class="table-card-head">
        <h3>Resumen detallado por empleado</h3>
        <span class="table-count" id="dbTableCount">0</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Empleado</th><th>Departamento</th><th>Ret. Mañana (min)</th><th>Ret. Tarde (min)</th><th>Total (min)</th><th>Retardos</th></tr></thead>
          <tbody id="dbDetTbody"></tbody>
        </table>
      </div>
    </div>
  `;
}

function paint(){
  const filtered = getFiltered();
  const tipo = document.getElementById('dbFTipo').value;
  const people = aggByPerson(filtered);
  people.sort((a,b) => b[tipo] - a[tipo]);

  const totTT = people.reduce((s,p)=>s+p.tt,0);
  const totMM = people.reduce((s,p)=>s+p.mm,0);
  const totMT = people.reduce((s,p)=>s+p.mt,0);
  const persWT = people.filter(p=>p.tt>0).length;
  const prom = people.length ? Math.round(totTT/people.length) : 0;
  const maxP = people[0] || { n:'—', tt:0, mm:0, mt:0 };
  const totalRegistros = filtered.reduce((s,r)=>s+r.cnt,0);
  const mesesSet = new Set(filtered.map(r=>r.mes).filter(Boolean));

  // ---- Métricas ----
  const metricsEl = document.getElementById('dbMetrics');
  metricsEl.innerHTML =
    metricCardHTML({ id:'mcTot', icon:'timer', tone:'blue', label:'Tiempo tardío total', value:totTT, sub:'minutos' }) +
    metricCardHTML({ id:'mcPers', icon:'users', tone:'green', label:'Empleados con retardos', value:persWT, sub:`de ${people.length} empleados` }) +
    metricCardHTML({ id:'mcProm', icon:'gauge', tone:'yellow', label:'Promedio por empleado', value:prom, sub:'minutos' }) +
    metricCardHTML({ id:'mcMax', icon:'award', tone:'red', label:'Mayor tiempo tardío', value:maxP.tt, sub:maxP.n });
  animateMetricCards(metricsEl);
  if(window.lucide) window.lucide.createIcons();

  // ---- Top 10 barras ----
  const top = people.slice(0,10);
  const maxVal = Math.max(...top.map(p=>p[tipo]), 1);
  document.getElementById('dbBarChart').innerHTML = top.map(p => {
    const v = p[tipo];
    const pct = Math.round(v/maxVal*100);
    const color = pct>70 ? 'var(--color-danger)' : pct>40 ? 'var(--color-warning)' : 'var(--brand-blue-600)';
    return `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:var(--fs-xs);color:var(--gray-600);width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0" title="${p.n}">${truncateName(p.n)}</span>
        <div style="flex:1;height:13px;background:var(--gray-100);border-radius:var(--radius-full);overflow:hidden">
          <div style="height:100%;border-radius:var(--radius-full);width:${pct}%;background:${color};transition:width .6s ease"></div>
        </div>
        <span style="font-size:var(--fs-xs);font-weight:700;color:var(--gray-800);min-width:42px;text-align:right">${fmt(v)}</span>
      </div>`;
  }).join('') || `<p style="color:var(--color-text-muted);font-size:var(--fs-sm)">Sin datos para este filtro.</p>`;

  // ---- Donut departamentos ----
  const dAgg = {};
  filtered.forEach(r => { dAgg[r.d] = (dAgg[r.d]||0) + r.tt; });
  const totalDept = Object.values(dAgg).reduce((s,v)=>s+v,0);
  const depts = Object.entries(dAgg).sort((a,b)=>b[1]-a[1]);
  makeDonut('dbDonutChart', depts.map(d=>d[0]), depts.map(d=>d[1]), depts.map(d=>DEPT_COLORS_HEX[d[0]]||'#9aa5b8'));
  document.getElementById('dbDonutLegend').innerHTML = depts.map(([d,v]) => `
    <tr>
      <td style="padding:4px 0"><span class="chip ${deptChipClass(d)}"><span class="chip-dot" style="background:${DEPT_COLORS_HEX[d]||'#9aa5b8'}"></span>${d}</span></td>
      <td style="text-align:right;font-weight:700">${fmt(v)}</td>
      <td style="text-align:right;color:var(--color-text-muted);font-size:var(--fs-xs)">${totalDept?Math.round(v/totalDept*100):0}%</td>
    </tr>`).join('') + `<tr style="border-top:1px solid var(--color-border)"><td style="padding-top:6px;font-weight:700">Total</td><td style="text-align:right;padding-top:6px;font-weight:700">${fmt(totalDept)}</td><td style="padding-top:6px"></td></tr>`;

  // ---- Media donut mañana/tarde ----
  const mmPct = totTT ? Math.round(totMM/totTT*100) : 0;
  const mtPct = totTT ? Math.round(totMT/totTT*100) : 0;
  document.getElementById('dbMmVal').textContent = fmt(totMM);
  document.getElementById('dbMmPct').textContent = mmPct + '%';
  document.getElementById('dbMtVal').textContent = fmt(totMT);
  document.getElementById('dbMtPct').textContent = mtPct + '%';
  document.getElementById('dbHalfNote').textContent = `Los retardos en la mañana representan el ${mmPct}% del total`;
  makeDonut('dbHalfChart', ['Mañana','Tarde'], [totMM, totMT], ['#1450b4','#3fb765'], '58%');

  // ---- Tendencia mensual ----
  const mesSel = document.getElementById('dbFMes').value;
  const mesesLabels = mesSel ? [mesSel] : MESES_ORD;
  const mByMonth = {}; MESES_ORD.forEach(m => mByMonth[m]=0);
  filtered.forEach(r => { if(r.mes) mByMonth[r.mes] = (mByMonth[r.mes]||0) + r.tt; });
  makeLineTrend('dbTrendChart', mesesLabels, mesesLabels.map(m=>mByMonth[m]||0));

  // ---- Días de la semana (dato estático original) ----
  // Se mantiene fuera de esta vista para no duplicar innecesariamente un canvas
  // que en el diseño original acompañaba a la tendencia; aquí se conserva el dato
  // disponible por si se reincorpora una variante futura del panel.

  // ---- Tabla detallada ----
  const topP = people.filter(p=>p.tt>0);
  let rowsHtml = topP.map(p => `
    <tr>
      <td class="cell-strong">${p.n}</td>
      <td><span class="chip ${deptChipClass(p.d)}"><span class="chip-dot" style="background:${DEPT_COLORS_HEX[p.d]||'#9aa5b8'}"></span>${p.d}</span></td>
      <td style="text-align:right">${fmt(p.mm)}</td>
      <td style="text-align:right">${fmt(p.mt)}</td>
      <td style="text-align:right" class="cell-danger">${fmt(p.tt)}</td>
      <td style="text-align:right">${p.rm+p.rt}</td>
    </tr>`).join('');
  if(topP.length){
    const tMm = topP.reduce((s,p)=>s+p.mm,0), tMt = topP.reduce((s,p)=>s+p.mt,0), tTt = topP.reduce((s,p)=>s+p.tt,0), tR = topP.reduce((s,p)=>s+p.rm+p.rt,0);
    rowsHtml += `<tr class="row-total"><td>Total</td><td></td><td style="text-align:right">${fmt(tMm)}</td><td style="text-align:right">${fmt(tMt)}</td><td style="text-align:right">${fmt(tTt)}</td><td style="text-align:right">${tR}</td></tr>`;
  }
  document.getElementById('dbDetTbody').innerHTML = rowsHtml || `<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted)">Sin registros para este filtro.</td></tr>`;
  document.getElementById('dbTableCount').textContent = fmt(totalRegistros) + ' registros';

  applyWidgetVisibility();
}

function applyWidgetVisibility(){
  toggleCard('dbTop10Card', widgetVisible('top10'));
  toggleCard('dbTrendCard', widgetVisible('tendencia'));
  toggleCard('dbDeptCard', widgetVisible('departamento'));
  toggleCard('dbTurnosCard', widgetVisible('turnos'));
  const secondRow = document.getElementById('dbSecondRow');
  secondRow.style.display = (widgetVisible('departamento') || widgetVisible('turnos')) ? 'grid' : 'none';
}
function toggleCard(id, visible){
  const node = document.getElementById(id);
  if(node) node.style.display = visible ? '' : 'none';
}

export function render(firstMount){
  const container = document.getElementById('view-dashboard');
  if(firstMount){
    container.innerHTML = skeleton();
    populateEmployeeSelect();
    ['dbFMes','dbFDept','dbFPers','dbFTipo','dbFAnio'].forEach(id => {
      document.getElementById(id).addEventListener('change', paint);
    });
    document.getElementById('dbClear').addEventListener('click', () => {
      ['dbFAnio','dbFMes','dbFDept','dbFPers'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('dbFTipo').value = 'tt';
      paint();
    });
    document.addEventListener('settings:changed', applyWidgetVisibility);
    document.addEventListener('data:refresh', paint);
    if(window.lucide) window.lucide.createIcons();
  }
  paint();
}
