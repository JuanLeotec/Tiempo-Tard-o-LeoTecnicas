// ============================================================
// state.js — estado compartido de la aplicación (Configuración)
// ============================================================

const STORAGE_KEY = 'leo-asistencia-settings-v1';

const DEFAULTS = {
  theme: 'light',          // 'light' | 'dark' | 'auto'
  motion: true,             // animaciones activas
  density: 'normal',        // 'normal' | 'compact'
  fontSize: 'normal',       // 'normal' | 'compact'
  widgets: {
    top10: true,
    tendencia: true,
    departamento: true,
    turnos: true,
    resumen: true
  }
};

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...JSON.parse(raw), widgets:{...DEFAULTS.widgets, ...(JSON.parse(raw).widgets||{})} };
  }catch(e){
    return structuredClone(DEFAULTS);
  }
}

export const settings = load();

export function saveSettings(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applySettings();
  document.dispatchEvent(new CustomEvent('settings:changed'));
}

export function resetWidgets(){
  settings.widgets = structuredClone(DEFAULTS.widgets);
  saveSettings();
}

/** Aplica el estado actual al DOM (data-attributes leídos por variables.css). */
export function applySettings(){
  const root = document.documentElement;
  let theme = settings.theme;
  if(theme === 'auto'){
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.dataset.theme = theme;
  root.dataset.motion = settings.motion ? 'on' : 'off';
  root.dataset.density = settings.density;
}

export const appMeta = {
  fuente: 'BaseDatosPowerBI.xlsx',
  ultimaActualizacion: '14/09/2026 08:00 a.m.',
  version: '2.0.0'
};
