// ============================================================
// charts.js — helpers centralizados para Chart.js (evita repetir opciones)
// ============================================================

const registry = {}; // canvasId -> Chart instance

function destroyIfExists(canvasId){
  if(registry[canvasId]){ registry[canvasId].destroy(); delete registry[canvasId]; }
}

export function makeDonut(canvasId, labels, data, colors, cutout = '62%'){
  destroyIfExists(canvasId);
  const ctx = document.getElementById(canvasId);
  if(!ctx) return null;
  registry[canvasId] = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:3, borderColor:'#fff' }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, cutout }
  });
  return registry[canvasId];
}

export function makeLineTrend(canvasId, labels, data, color = '#1f6fe0'){
  destroyIfExists(canvasId);
  const ctx = document.getElementById(canvasId);
  if(!ctx) return null;
  registry[canvasId] = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{
      data, borderColor:color, backgroundColor: hexToRgba(color, .08),
      tension:.35, fill:true, pointBackgroundColor:color, pointRadius:4, borderWidth:2.5
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(c)=> Math.round(c.raw).toLocaleString('es-CO') + ' min' } } },
      scales:{
        y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,.04)' }, ticks:{ font:{ size:10 } } },
        x:{ grid:{ display:false }, ticks:{ font:{ size:10 } } }
      }
    }
  });
  return registry[canvasId];
}

export function makeBar(canvasId, labels, data, colors){
  destroyIfExists(canvasId);
  const ctx = document.getElementById(canvasId);
  if(!ctx) return null;
  registry[canvasId] = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ data, backgroundColor:colors, borderRadius:8, maxBarThickness:34 }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(c)=> Math.round(c.raw).toLocaleString('es-CO') + ' min' } } },
      scales:{
        y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,.04)' }, ticks:{ font:{ size:10 } } },
        x:{ grid:{ display:false }, ticks:{ font:{ size:10 } } }
      }
    }
  });
  return registry[canvasId];
}

function hexToRgba(hex, alpha){
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
