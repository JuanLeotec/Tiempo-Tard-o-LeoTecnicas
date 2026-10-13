// ============================================================
// calendario.js — Vista "Calendario" (misma lógica que renderCal/initCalendario original)
// Diferencia de UX respecto al original: el detalle de cada día se muestra
// en un panel lateral al hacer clic, en vez de un tooltip flotante al hover.
// ============================================================
import { fmt } from '../core/utils.js';

const MESES_CANON = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesesConDatos = new Set();
Object.values(window.CAL_DATA || {}).forEach(recs => {
  Object.keys(recs).forEach(fecha => mesesConDatos.add(parseInt(fecha.slice(5,7),10) - 1));
});
const MESES_IDX = [...mesesConDatos].sort((a,b)=>a-b);
const MESES = MESES_CANON;
const DHDR = ['L','M','X','J','V','S','D'];

let calTurno = 'total';
let inited = false;

function getData(){
  return { CAL_DATA: window.CAL_DATA, CAL_NAMES: window.CAL_NAMES, CAL_ULTIMO_SAB: window.CAL_ULTIMO_SAB, FULL_DATA: window.FULL_DATA };
}

function getCalMin(v){ return calTurno === 'manana' ? v[0] : calTurno === 'tarde' ? v[1] : v[2]; }
function initials2(n){ return n.split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase(); }

function populateEmployeeSelect(){
  const { CAL_NAMES } = getData();
  const sel = document.getElementById('calEmp');
  if(sel.dataset.filled) return;
  CAL_NAMES.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  sel.dataset.filled = '1';
  sel.value = CAL_NAMES[0];
}

function setTurno(t){
  calTurno = t;
  document.querySelectorAll('.segmented[data-cal-turno] button').forEach(b => b.classList.toggle('active', b.dataset.turno === t));
  renderCal();
}

function dayTooltipText(key, isSab, isUltSab, olvido, min, v){
  const turnoLbl = calTurno === 'total' ? 'Total' : calTurno === 'manana' ? 'Mañana' : 'Tarde';
  let txt = `${key} — ${isSab ? 'Sábado (turno 7am–11am)' : 'Lunes a Viernes'}. `;
  if(isSab && calTurno === 'tarde') txt += 'No hay turno tarde los sábados.';
  else if(isUltSab) txt += 'Último sábado — salida pendiente.';
  else if(olvido && min > 0) txt += `Tardío ${turnoLbl}: +${Math.round(min)} min. Olvido de marca.`;
  else if(olvido) txt += 'Olvido de marca.';
  else if(min > 0) txt += `Tardío ${turnoLbl}: +${Math.round(min)} min.`;
  else txt += 'Puntual.';
  if(calTurno === 'total' && !isSab) txt += ` (Mañana: ${Math.round(v[0])}min · Tarde: ${Math.round(v[1])}min)`;
  return txt;
}

function openDayPanel(name, key, v, isSab, isUltSab){
  const overlay = document.getElementById('calDayOverlay');
  const panel = document.getElementById('calDayPanel');
  const min = isSab && calTurno === 'tarde' ? 0 : getCalMin(v);
  const olvido = v[3] === 1;
  const txt = dayTooltipText(key, isSab, isUltSab, olvido, min, v);
  document.getElementById('calDayPanelBody').innerHTML = `
    <div style="text-align:center;padding:8px 0 20px">
      <div style="font-size:var(--fs-2xl);font-weight:800;color:var(--gray-900)">${key}</div>
      <div style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-top:4px">${name}</div>
    </div>
    <div class="card" style="padding:16px">
      <p style="font-size:var(--fs-sm);line-height:1.6">${txt}</p>
    </div>
    <div class="grid grid-2" style="margin-top:14px">
      <div class="metric-card" style="flex-direction:column;align-items:flex-start;gap:4px;padding:14px">
        <div class="metric-label">Mañana</div><div class="metric-value" style="font-size:var(--fs-lg)">${Math.round(v[0])} min</div>
      </div>
      <div class="metric-card" style="flex-direction:column;align-items:flex-start;gap:4px;padding:14px">
        <div class="metric-label">Tarde</div><div class="metric-value" style="font-size:var(--fs-lg)">${Math.round(v[1])} min</div>
      </div>
    </div>
  `;
  overlay.classList.add('show');
  panel.classList.add('show');
}
function closeDayPanel(){
  document.getElementById('calDayOverlay')?.classList.remove('show');
  document.getElementById('calDayPanel')?.classList.remove('show');
}

function renderCal(){
  const { CAL_DATA, CAL_ULTIMO_SAB, FULL_DATA } = getData();
  const name = document.getElementById('calEmp').value;
  const mesFlt = document.getElementById('calMes').value;
  if(!name) return;
  const recs = CAL_DATA[name] || {};

  const allVals = Object.values(recs);
  const conT = allVals.filter(v => getCalMin(v) > 0).length;
  const olv = allVals.filter(v => v[3] === 1).length;
  const punt = allVals.filter(v => getCalMin(v) === 0 && v[3] === 0).length;
  const sumM = allVals.reduce((s,v) => s + getCalMin(v), 0);
  const pct = allVals.length > 0 ? Math.round(punt / allVals.length * 100) : 0;

  const empRec = FULL_DATA.find(r => r.n === name);
  const dept = empRec ? empRec.d : '';

  document.getElementById('calAvatar').textContent = initials2(name);
  document.getElementById('calNombre').textContent = name;
  document.getElementById('calDept').textContent = dept;
  document.getElementById('calStP').textContent = punt;
  document.getElementById('calStT').textContent = conT;
  document.getElementById('calStO').textContent = olv;
  document.getElementById('calStM').textContent = fmt(sumM) + ' min';
  document.getElementById('calStPct').textContent = pct + '%';

  const container = document.getElementById('calMonths');
  container.innerHTML = '';
  const mesesRender = mesFlt !== '' ? [parseInt(mesFlt)] : MESES_IDX;
  container.style.gridTemplateColumns = mesesRender.length === 1 ? '1fr' : mesesRender.length <= 2 ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  mesesRender.forEach(m => {
    const firstDay = new Date(2026, m, 1);
    const lastDay = new Date(2026, m + 1, 0);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const mKey = `2026-${String(m+1).padStart(2,'0')}`;
    const mRecs = Object.entries(recs).filter(([k]) => k.startsWith(mKey));
    const mMin = mRecs.reduce((s,[,v]) => s + getCalMin(v), 0);
    const mT = mRecs.filter(([,v]) => getCalMin(v) > 0).length;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '14px';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
        <strong style="font-size:var(--fs-sm)">${MESES[m]} 2026</strong>
        <span style="font-size:var(--fs-2xs);color:${mT>0?'var(--color-danger)':'var(--color-text-muted)'}">${mT>0 ? mT+' tardíos · '+fmt(mMin)+' min' : 'Sin tardíos'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px">
        ${DHDR.map(d=>`<div style="text-align:center;font-size:9px;color:var(--color-text-muted);font-weight:700">${d}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px" id="cd-${m}"></div>
    `;
    container.appendChild(card);

    const dDiv = card.querySelector(`#cd-${m}`);
    for(let i = 0; i < startDow; i++){
      const e = document.createElement('div');
      dDiv.appendChild(e);
    }

    for(let day = 1; day <= lastDay.getDate(); day++){
      const date = new Date(2026, m, day);
      const dow = date.getDay();
      const isSun = dow === 0;
      const key = `2026-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const v = recs[key];
      const el = document.createElement('div');
      el.style.cssText = 'aspect-ratio:1;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;gap:1px;cursor:default;transition:transform .15s ease';

      if(isSun){
        el.style.color = 'var(--gray-300)';
        el.innerHTML = `<span>${day}</span>`;
      } else if(!v){
        el.style.color = 'var(--gray-300)';
        el.innerHTML = `<span>${day}</span>`;
      } else {
        const isSab = v[4] === 1;
        const isUltSab = (key === CAL_ULTIMO_SAB);
        const min = isSab && calTurno === 'tarde' ? 0 : getCalMin(v);
        const olvido = v[3] === 1;
        let bg, fg, icon;
        if(isSab){
          if(calTurno === 'tarde'){ bg = 'var(--gray-100)'; fg='var(--gray-500)'; icon = 'S'; }
          else if(olvido){ bg = 'var(--brand-yellow-100)'; fg='var(--brand-yellow-600)'; icon = '!'; }
          else if(min > 30){ bg = 'var(--brand-red-100)'; fg='var(--brand-red-600)'; icon = '+'+Math.round(min); }
          else if(min > 0){ bg = 'var(--brand-yellow-100)'; fg='var(--brand-yellow-600)'; icon = '+'+Math.round(min); }
          else{ bg = 'var(--brand-green-100)'; fg='var(--brand-green-700)'; icon = '✓'; }
        } else {
          if(olvido && min > 0){ bg = 'var(--brand-red-100)'; fg='var(--brand-red-600)'; icon = '!+'; }
          else if(olvido){ bg = 'var(--brand-yellow-100)'; fg='var(--brand-yellow-600)'; icon = '!'; }
          else if(min > 30){ bg = 'var(--brand-red-100)'; fg='var(--brand-red-600)'; icon = '+'+Math.round(min); }
          else if(min > 15){ bg = 'var(--brand-yellow-100)'; fg='var(--brand-yellow-600)'; icon = '+'+Math.round(min); }
          else if(min > 0){ bg = 'var(--brand-yellow-100)'; fg='var(--brand-yellow-600)'; icon = '+'+Math.round(min); }
          else{ bg = 'var(--brand-green-100)'; fg='var(--brand-green-700)'; icon = '✓'; }
        }
        el.style.background = bg; el.style.color = fg; el.style.cursor = 'pointer';
        el.innerHTML = `<span style="font-weight:700;color:var(--gray-700)">${day}</span><span style="font-weight:800">${icon}</span>`;
        el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.12)');
        el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');
        el.addEventListener('click', () => openDayPanel(name, key, v, isSab, isUltSab));
      }
      dDiv.appendChild(el);
    }
  });

  if(window.lucide) window.lucide.createIcons();
}

function skeleton(){
  return `
    <div class="filter-bar" style="align-items:center">
      <div class="filter-group"><label>Empleado</label><select id="calEmp"></select></div>
      <div class="filter-group" style="flex:0 0 220px"><label>Ver tardíos de</label>
        <div class="segmented" data-cal-turno>
          <button data-turno="total" class="active">Total</button>
          <button data-turno="manana">Mañana</button>
          <button data-turno="tarde">Tarde</button>
        </div>
      </div>
      <div class="filter-group" style="flex:0 0 180px"><label>Mes</label>
        <select id="calMes"><option value="">Todos</option>${MESES_IDX.map(i=>`<option value="${i}">${MESES[i]}</option>`).join('')}</select>
      </div>
    </div>

    <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="width:50px;height:50px;border-radius:50%;background:var(--brand-gradient);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800" id="calAvatar"></div>
      <div style="min-width:160px">
        <div style="font-weight:800;color:var(--gray-900)" id="calNombre"></div>
        <div style="font-size:var(--fs-xs);color:var(--color-text-muted)" id="calDept"></div>
      </div>
      <div style="flex:1"></div>
      <div style="display:flex;gap:22px;text-align:center">
        <div><div style="font-size:var(--fs-lg);font-weight:800;color:var(--brand-green-700)" id="calStP"></div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted)">Puntuales</div></div>
        <div><div style="font-size:var(--fs-lg);font-weight:800;color:var(--brand-red-600)" id="calStT"></div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted)">Con tardío</div></div>
        <div><div style="font-size:var(--fs-lg);font-weight:800;color:var(--brand-yellow-600)" id="calStO"></div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted)">Olvidos</div></div>
        <div><div style="font-size:var(--fs-lg);font-weight:800" id="calStM"></div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted)">Total tardío</div></div>
        <div><div style="font-size:var(--fs-lg);font-weight:800;color:var(--brand-blue-700)" id="calStPct"></div><div style="font-size:var(--fs-2xs);color:var(--color-text-muted)">Puntualidad</div></div>
      </div>
    </div>

    <div class="grid" id="calMonths" style="grid-template-columns:repeat(3,1fr)"></div>

    <div class="overlay" id="calDayOverlay"></div>
    <aside class="side-panel" id="calDayPanel">
      <div class="side-panel-head"><h3>Detalle del día</h3><button class="icon-btn" id="calDayPanelClose"><i data-lucide="x"></i></button></div>
      <div class="side-panel-body" id="calDayPanelBody"></div>
    </aside>
  `;
}

export function render(firstMount){
  const container = document.getElementById('view-calendario');
  if(firstMount){
    container.innerHTML = skeleton();
    populateEmployeeSelect();
    document.getElementById('calEmp').addEventListener('change', renderCal);
    document.getElementById('calMes').addEventListener('change', renderCal);
    document.querySelectorAll('.segmented[data-cal-turno] button').forEach(b => {
      b.addEventListener('click', () => setTurno(b.dataset.turno));
    });
    document.getElementById('calDayOverlay').addEventListener('click', closeDayPanel);
    document.getElementById('calDayPanelClose').addEventListener('click', closeDayPanel);
    if(window.lucide) window.lucide.createIcons();
    inited = true;
  }
  if(inited) renderCal();
}
