// ============================================================
// header.js — cabecera con saludo, fecha/hora y accesos rápidos
// ============================================================
import { appMeta } from '../core/state.js';
import { openDrawer } from './settingsDrawer.js';
import { showToast } from '../core/utils.js';

const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function greeting(hour){
  if(hour < 12) return 'Buenos días';
  if(hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function tick(){
  const now = new Date();
  const h = document.getElementById('headerGreeting');
  const d = document.getElementById('headerDate');
  const t = document.getElementById('headerTime');
  if(h) h.textContent = greeting(now.getHours());
  if(d) d.textContent = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]}`;
  if(t) t.textContent = now.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
}

export function renderHeader(){
  const header = document.getElementById('appHeader');
  header.innerHTML = `
    <div class="header-greeting">
      <h2 id="headerGreeting">Buenos días</h2>
      <p id="headerDate">—</p>
    </div>
    <div class="header-spacer"></div>
    <div class="header-meta">
      <span>Última actualización</span>
      <strong>${appMeta.ultimaActualizacion}</strong>
    </div>
    <span id="headerTime" style="font-size:var(--fs-sm);font-weight:700;color:var(--gray-700);margin-right:4px"></span>
    <button class="icon-btn" id="btnRefresh" title="Actualizar">
      <i data-lucide="refresh-cw"></i>
    </button>
    <button class="icon-btn" id="btnSettings" title="Configuración">
      <i data-lucide="settings"></i>
    </button>
  `;

  document.getElementById('btnRefresh').addEventListener('click', (e) => {
    e.currentTarget.classList.add('spinning');
    setTimeout(() => e.currentTarget.classList.remove('spinning'), 700);
    document.dispatchEvent(new CustomEvent('data:refresh'));
    showToast('Datos actualizados');
  });

  document.getElementById('btnSettings').addEventListener('click', openDrawer);

  tick();
  setInterval(tick, 30000);
  if(window.lucide) window.lucide.createIcons();
}
