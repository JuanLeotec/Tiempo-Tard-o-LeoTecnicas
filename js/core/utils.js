// ============================================================
// utils.js — funciones puras reutilizadas por todos los módulos
// ============================================================

/** Formatea un número como entero con separador de miles es-CO (idéntico al original). */
export function fmt(n){
  return Math.round(n || 0).toLocaleString('es-CO');
}

/** Recorta un nombre largo para mostrarlo en espacios reducidos (ej. barras del top 10). */
export function truncateName(name, max = 20){
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

/** Genera las iniciales (máx 2 letras) de un nombre completo, para avatares. */
export function initials(name){
  const parts = (name || '').replace(/\bnan\b/g, '').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '—';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

/** Devuelve un elemento del DOM por id (azúcar sintáctico). */
export const $ = (id) => document.getElementById(id);

/** Crea un elemento HTML a partir de una cadena (para inyectar fragmentos). */
export function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Anima un contador numérico desde 0 hasta un valor final. */
export function animateCounter(node, endValue, duration = 900){
  if(document.documentElement.dataset.motion === 'off'){
    node.textContent = fmt(endValue);
    return;
  }
  const start = performance.now();
  const from = 0;
  function tick(now){
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(from + (endValue - from) * eased);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** Colores de departamento centralizados (antes duplicados en index.html y detalle.html). */
export const DEPT_COLORS = {
  'Taller': 'var(--dept-taller)',
  'Campo': 'var(--dept-campo)',
  'Administración': 'var(--dept-administracion)',
  'Transformadores': 'var(--dept-transformadores)'
};
export const DEPT_COLORS_HEX = {
  'Taller': '#1450b4',
  'Campo': '#3fb765',
  'Administración': '#c99a00',
  'Transformadores': '#6b7688'
};
export function deptChipClass(dept){
  const map = {
    'Taller':'chip-taller','Campo':'chip-campo',
    'Administración':'chip-administracion','Transformadores':'chip-transformadores'
  };
  return map[dept] || 'chip-transformadores';
}

const MESES_CANON = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesesPresentes = new Set((window.DASHBOARD_DATA || []).map(r => r.mes));
export const MESES_ORD = MESES_CANON.filter(m => mesesPresentes.has(m));

/** Pequeño helper de "toast" para confirmaciones (Configuración → recargar/exportar). */
export function showToast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = el(`<div class="toast" id="toast"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span></span></div>`);
    document.body.appendChild(t);
  }
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2400);
}

/** Ripple effect reutilizable para botones. */
export function attachRipple(root = document){
  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn');
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(ripple);
    setTimeout(()=>ripple.remove(), 520);
  });
}
