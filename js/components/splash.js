// ============================================================
// splash.js — pantalla de bienvenida (≈5s) con fade out
// ============================================================
export function runSplash(onDone){
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');

  setTimeout(() => {
    splash.classList.add('fade-out');
    app.classList.add('ready');
    setTimeout(() => { splash.remove(); if(onDone) onDone(); }, 650);
  }, 5000);
}
