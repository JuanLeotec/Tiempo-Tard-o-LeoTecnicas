// ============================================================
// sidebar.js — navegación principal fija
// ============================================================
import { navigate } from '../core/router.js';

const ITEMS = [
  { route:'dashboard', label:'Dashboard', icon:'layout-dashboard' },
  { route:'registros', label:'Registros', icon:'clipboard-list' },
  { route:'marcas', label:'Marcas Faltantes', icon:'alert-triangle' },
  { route:'semanal', label:'Reporte Semanal', icon:'bar-chart-3' },
  { route:'calendario', label:'Calendario', icon:'calendar-days' },
];

export function renderSidebar(){
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = ITEMS.map(it => `
    <div class="nav-item" data-route="${it.route}" role="button" tabindex="0">
      <span class="nav-icon"><i data-lucide="${it.icon}"></i></span>
      <span class="nav-label">${it.label}</span>
    </div>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.route));
    item.addEventListener('keydown', (e) => { if(e.key === 'Enter') navigate(item.dataset.route); });
  });

  if(window.lucide) window.lucide.createIcons();
}
