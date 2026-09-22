// ============================================================
// main.js — arranque de la aplicación
// ============================================================
import { applySettings } from './core/state.js';
import { registerModule, navigate, initRouter } from './core/router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { runSplash } from './components/splash.js';
import { attachRipple } from './core/utils.js';
import * as dashboard from './modules/dashboard.js';
import * as registros from './modules/registros.js';
import * as marcasFaltantes from './modules/marcasFaltantes.js';
import * as reporteSemanal from './modules/reporteSemanal.js';
import * as calendario from './modules/calendario.js';

applySettings();
attachRipple(document);

renderSidebar();
renderHeader();

registerModule('dashboard', dashboard);
registerModule('registros', registros);
registerModule('marcas', marcasFaltantes);
registerModule('semanal', reporteSemanal);
registerModule('calendario', calendario);

initRouter('dashboard');
runSplash();
