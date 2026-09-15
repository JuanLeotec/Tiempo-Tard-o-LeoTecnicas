// ============================================================
// metricCard.js — tarjeta de métrica reutilizable
// ============================================================
import { animateCounter, fmt } from '../core/utils.js';

/**
 * @param {Object} cfg
 * @param {string} cfg.id        id único para poder actualizar el valor luego
 * @param {string} cfg.icon      nombre de ícono lucide
 * @param {string} cfg.tone      'blue'|'green'|'yellow'|'red'
 * @param {string} cfg.label     etiqueta superior
 * @param {number} cfg.value     valor numérico (se anima)
 * @param {string} [cfg.sub]     texto secundario
 * @param {boolean} [cfg.raw]    si true, value se imprime tal cual (no numérico)
 */
export function metricCardHTML(cfg){
  return `
    <div class="metric-card" id="${cfg.id}">
      <div class="metric-icon tone-${cfg.tone}"><i data-lucide="${cfg.icon}"></i></div>
      <div class="metric-body">
        <div class="metric-label">${cfg.label}</div>
        <div class="metric-value" data-value="${cfg.raw ? '' : cfg.value}">${cfg.raw ? cfg.value : '0'}</div>
        ${cfg.sub ? `<div class="metric-sub">${cfg.sub}</div>` : ''}
      </div>
    </div>
  `;
}

/** Anima todos los .metric-value con data-value dentro de un contenedor. */
export function animateMetricCards(container){
  container.querySelectorAll('.metric-value[data-value]').forEach(node => {
    const val = Number(node.dataset.value);
    if(!isNaN(val) && node.dataset.value !== '') animateCounter(node, val);
  });
}

/** Actualiza un valor de tarjeta existente (para refrescos sin re-render completo). */
export function updateMetricCard(id, value, sub){
  const card = document.getElementById(id);
  if(!card) return;
  const valNode = card.querySelector('.metric-value');
  valNode.dataset.value = value;
  animateCounter(valNode, value);
  if(sub !== undefined){
    const subNode = card.querySelector('.metric-sub');
    if(subNode) subNode.textContent = sub;
  }
}
