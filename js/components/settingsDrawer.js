// ============================================================
// settingsDrawer.js — Centro de Control (panel lateral desde la derecha)
// ============================================================
import { settings, saveSettings, resetWidgets, appMeta } from '../core/state.js';
import { showToast, fmt } from '../core/utils.js';

let built = false;

function widgetRow(key, label){
  return `
    <label class="settings-row" style="cursor:pointer">
      <span>${label}</span>
      <span class="switch">
        <input type="checkbox" data-widget="${key}" ${settings.widgets[key] ? 'checked' : ''}>
        <span class="switch-track"></span>
      </span>
    </label>
  `;
}

function dataStats(){
  const data = window.DASHBOARD_DATA || [];
  const totalRegistros = data.reduce((s, r) => s + (r.cnt || 0), 0);
  const empleados = new Set(data.map(r => r.n)).size;
  return { totalRegistros, empleados };
}

function build(){
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawerOverlay';

  const stats = dataStats();

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'settingsDrawer';
  drawer.innerHTML = `
    <div class="drawer-head">
      <i data-lucide="sliders-horizontal" style="width:20px;height:20px;color:var(--brand-blue-600)"></i>
      <h3>Centro de Control</h3>
      <div style="flex:1"></div>
      <button class="icon-btn" id="drawerClose"><i data-lucide="x"></i></button>
    </div>
    <div class="drawer-body">

      <div class="settings-section">
        <h4><i data-lucide="palette" style="width:13px;height:13px"></i> Apariencia</h4>
        <div class="segmented" id="themeSeg">
          <button data-theme="light">Claro</button>
          <button data-theme="dark">Oscuro</button>
          <button data-theme="auto">Automático</button>
        </div>
        <label class="settings-row" style="cursor:pointer">
          <span>Animaciones<span class="settings-row-desc">Transiciones y efectos fluidos</span></span>
          <span class="switch"><input type="checkbox" id="toggleMotion" ${settings.motion ? 'checked' : ''}><span class="switch-track"></span></span>
        </label>
        <label class="settings-row" style="cursor:pointer">
          <span>Tablas compactas<span class="settings-row-desc">Reduce el alto de las filas</span></span>
          <span class="switch"><input type="checkbox" id="toggleDensity" ${settings.density === 'compact' ? 'checked' : ''}><span class="switch-track"></span></span>
        </label>
        <label class="settings-row" style="cursor:pointer">
          <span>Tamaño de fuente<span class="settings-row-desc">Normal o compacto</span></span>
          <span class="switch"><input type="checkbox" id="toggleFont" ${settings.fontSize === 'compact' ? 'checked' : ''}><span class="switch-track"></span></span>
        </label>
      </div>

      <div class="settings-section">
        <h4><i data-lucide="layout-grid" style="width:13px;height:13px"></i> Dashboard</h4>
        ${widgetRow('top10', 'Top de empleados')}
        ${widgetRow('tendencia', 'Tendencia mensual')}
        ${widgetRow('departamento', 'Tiempo por departamento')}
        ${widgetRow('turnos', 'Retardos Mañana vs Tarde')}
        ${widgetRow('resumen', 'Resumen General')}
        <button class="btn btn-outline btn-sm" id="btnResetWidgets" style="align-self:flex-start">
          <i data-lucide="rotate-ccw"></i> Restablecer distribución por defecto
        </button>
      </div>

      <div class="settings-section">
        <h4><i data-lucide="database" style="width:13px;height:13px"></i> Gestión de Datos</h4>
        <div class="card" style="padding:14px 16px">
          <div class="data-summary-row"><span>Archivo</span><span>${appMeta.fuente}</span></div>
          <div class="data-summary-row"><span>Registros</span><span>${fmt(stats.totalRegistros)}</span></div>
          <div class="data-summary-row"><span>Empleados</span><span>${stats.empleados}</span></div>
          <div class="data-summary-row"><span>Última actualización</span><span>${appMeta.ultimaActualizacion}</span></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" id="btnReloadData"><i data-lucide="refresh-cw"></i> Recargar datos</button>
          <button class="btn btn-success btn-sm" id="btnExportCsv"><i data-lucide="download"></i> Exportar CSV</button>
          <button class="btn btn-outline btn-sm" id="btnRegenStats"><i data-lucide="calculator"></i> Regenerar estadísticas</button>
        </div>
      </div>

      <div class="settings-section">
        <h4><i data-lucide="info" style="width:13px;height:13px"></i> Información del Sistema</h4>
        <div class="info-card">
          <strong>Sistema de Control de Asistencia</strong>
          <span>LeoTecnicas · v${appMeta.version}</span>
          <span>Última actualización: ${appMeta.ultimaActualizacion}</span>
          <p>Sistema interno para el análisis de asistencia y puntualidad del personal.</p>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  overlay.addEventListener('click', closeDrawer);
  drawer.querySelector('#drawerClose').addEventListener('click', closeDrawer);

  // Tema
  const themeSeg = drawer.querySelector('#themeSeg');
  themeSeg.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === settings.theme);
    b.addEventListener('click', () => {
      settings.theme = b.dataset.theme;
      themeSeg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      saveSettings();
    });
  });

  drawer.querySelector('#toggleMotion').addEventListener('change', (e) => {
    settings.motion = e.target.checked; saveSettings();
  });
  drawer.querySelector('#toggleDensity').addEventListener('change', (e) => {
    settings.density = e.target.checked ? 'compact' : 'normal'; saveSettings();
  });
  drawer.querySelector('#toggleFont').addEventListener('change', (e) => {
    settings.fontSize = e.target.checked ? 'compact' : 'normal'; saveSettings();
  });

  drawer.querySelectorAll('[data-widget]').forEach(chk => {
    chk.addEventListener('change', (e) => {
      settings.widgets[e.target.dataset.widget] = e.target.checked;
      saveSettings();
    });
  });
  drawer.querySelector('#btnResetWidgets').addEventListener('click', () => {
    resetWidgets();
    drawer.querySelectorAll('[data-widget]').forEach(chk => chk.checked = settings.widgets[chk.dataset.widget]);
    showToast('Distribución restablecida');
  });

  drawer.querySelector('#btnReloadData').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('data:refresh'));
    showToast('Datos recargados');
  });
  drawer.querySelector('#btnExportCsv').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('data:export-current'));
  });
  drawer.querySelector('#btnRegenStats').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('data:refresh'));
    showToast('Estadísticas regeneradas');
  });

  if(window.lucide) window.lucide.createIcons();
  built = true;
}

export function openDrawer(){
  if(!built) build();
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('settingsDrawer').classList.add('show');
}
export function closeDrawer(){
  document.getElementById('drawerOverlay')?.classList.remove('show');
  document.getElementById('settingsDrawer')?.classList.remove('show');
}
