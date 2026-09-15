// ============================================================
// router.js — navegación interna sin recargar la página
// ============================================================

const modules = {};       // { routeName: { render, mounted } }
let currentRoute = null;

export function registerModule(name, mod){
  modules[name] = { render: mod.render, mounted: false };
}

export function navigate(routeName){
  if(!modules[routeName]) return;
  // Ocultar todas las vistas
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + routeName);
  if(viewEl) viewEl.classList.add('active');

  // Sidebar activo
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === routeName));

  currentRoute = routeName;
  location.hash = routeName;

  // Render perezoso: solo la primera vez que se visita, luego solo refresca datos livianos
  const mod = modules[routeName];
  if(mod.render) mod.render(!mod.mounted);
  mod.mounted = true;
}

export function initRouter(defaultRoute = 'dashboard'){
  window.addEventListener('hashchange', () => {
    const r = location.hash.replace('#', '') || defaultRoute;
    if(modules[r]) navigate(r);
  });
  const initial = location.hash.replace('#', '') || defaultRoute;
  navigate(modules[initial] ? initial : defaultRoute);
}

export function getCurrentRoute(){
  return currentRoute;
}
