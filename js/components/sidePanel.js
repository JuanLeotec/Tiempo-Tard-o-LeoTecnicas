// ============================================================
// sidePanel.js — panel lateral de detalle de empleado (reutilizable)
// ============================================================
import { fmt, deptChipClass, DEPT_COLORS_HEX } from '../core/utils.js';

let built = false;

function ensureDom(){
  if(built) return;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'employeeOverlay';

  const panel = document.createElement('aside');
  panel.className = 'side-panel';
  panel.id = 'employeePanel';
  panel.innerHTML = `
    <div class="side-panel-head">
      <h3>Detalle del empleado</h3>
      <button class="icon-btn" id="employeePanelClose"><i data-lucide="x"></i></button>
    </div>
    <div class="side-panel-body" id="employeePanelBody"></div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  overlay.addEventListener('click', closeEmployeePanel);
  panel.querySelector('#employeePanelClose').addEventListener('click', closeEmployeePanel);
  built = true;
}

function cellHora(v, esSab){
  if(esSab && !v) return `<span style="color:var(--color-text-muted);font-size:var(--fs-2xs)">T.C</span>`;
  if(v) return `<span style="font-variant-numeric:tabular-nums;font-size:var(--fs-2xs)">${v.slice(0,5)}</span>`;
  return `<span style="color:var(--color-danger);font-weight:700;font-size:var(--fs-2xs)">✗</span>`;
}

export function openEmployeePanel(name){
  ensureDom();
  const FULL_DATA = window.FULL_DATA, SIN_MARCA = window.SIN_MARCA, ULTIMO_SABADO = window.ULTIMO_SABADO;
  const pd = FULL_DATA.filter(r => r.n === name).sort((a,b) => a.fecha.localeCompare(b.fecha));
  const od = SIN_MARCA.filter(r => r.n === name);
  const dept = pd[0]?.d || '';

  const body = document.getElementById('employeePanelBody');
  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--brand-gradient);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:var(--fs-md)">${name.split(' ')[0][0]}${(name.split(' ')[1]||'')[0]||''}</div>
      <div>
        <div style="font-weight:800;font-size:var(--fs-md);color:var(--gray-900)">${name}</div>
        <span class="chip ${deptChipClass(dept)}"><span class="chip-dot" style="background:${DEPT_COLORS_HEX[dept]||'#9aa5b8'}"></span>${dept}</span>
      </div>
    </div>
    <div class="card" style="padding:14px 16px;margin-bottom:16px">
      <div class="data-summary-row"><span>Total registros</span><span>${pd.length}</span></div>
      <div class="data-summary-row"><span>Días con tardío</span><span class="cell-danger">${pd.filter(r=>r.tt>0).length}</span></div>
      <div class="data-summary-row"><span>Total min tardíos</span><span class="cell-danger">${fmt(pd.reduce((s,r)=>s+r.tt,0))} min</span></div>
      <div class="data-summary-row"><span>Min tardío mañana</span><span>${fmt(pd.reduce((s,r)=>s+r.mm,0))} min</span></div>
      <div class="data-summary-row"><span>Min tardío tarde</span><span>${fmt(pd.reduce((s,r)=>s+r.mt,0))} min</span></div>
      <div class="data-summary-row"><span>⚠️ Días con olvido</span><span style="color:var(--color-warning);font-weight:700">${od.length} días</span></div>
    </div>
    <div class="card-title" style="margin-bottom:8px"><i data-lucide="history" style="width:13px;height:13px"></i> Historial</div>
    <div class="table-scroll" style="max-height:400px">
      <table class="data-table" style="font-size:var(--fs-xs)">
        <thead><tr><th>Fecha</th><th>Ent.M</th><th>Sal.M</th><th>Ent.T</th><th>Sal.T</th><th>Min</th></tr></thead>
        <tbody>
          ${pd.slice(0,200).map(r => {
            const esSab = (r.dia === 'Sábado' && r.fecha === ULTIMO_SABADO);
            return `<tr>
              <td>${r.fecha}<br><small style="color:var(--color-text-muted)">${r.dia}</small></td>
              <td>${cellHora(r.em,false)}</td><td>${cellHora(r.sm,esSab)}</td>
              <td>${cellHora(r.et,esSab)}</td><td>${cellHora(r.st,esSab)}</td>
              <td style="font-weight:700;color:${r.tt>0?'var(--color-danger)':'var(--brand-green-700)'}">${r.tt>0?r.tt:'✓'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('employeeOverlay').classList.add('show');
  document.getElementById('employeePanel').classList.add('show');
  if(window.lucide) window.lucide.createIcons();
}

export function closeEmployeePanel(){
  document.getElementById('employeeOverlay')?.classList.remove('show');
  document.getElementById('employeePanel')?.classList.remove('show');
}
