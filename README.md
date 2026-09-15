# Sistema de Control de Asistencia v2.0 — LeoTecnicas

## Cómo publicarlo
1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. Activa GitHub Pages apuntando a la raíz (branch main / root).
3. Listo — no requiere build ni instalación de dependencias.

## El flujo completo de datos
```
Huellero (dispositivo) → Asistencia_lista.xlsx
        ↓ etl/procesar_huellero.py
Procesado.xlsx
        ↓ (se carga a Power BI)
BaseDatosPowerBI.xlsx
        ↓ etl/build_data.py   ← lo que corres tú cada semana
data/*.js  (lo que lee la app)
```
`etl/procesar_huellero.py` es un paso aparte (antes de Power BI) que solo se toca si cambia el horario oficial de salida. `etl/build_data.py` es el que corres cada semana con el Excel nuevo.

## Cómo actualizar los datos tú mismo (cada lunes)

### 1. Instalar requisitos (una sola vez)
```
pip install pandas openpyxl
```

### 2. Pasos de cada actualización semanal
1. Reemplaza `BaseDatosPowerBI.xlsx` (en la raíz del proyecto) con el nuevo archivo.
2. Abre `js/core/state.js` y cambia la fecha en `ultimaActualizacion` (línea con `appMeta`).
3. Ejecuta desde la raíz del proyecto:
   ```
   python3 etl/build_data.py
   ```
4. Revisa lo que imprime en consola — debe verse algo así:
   ```
   Filas duplicadas eliminadas: N
   FULL_DATA records: N
   SIN_MARCA records: N
   ...
   Archivos escritos correctamente.
   ```
   Si sale un error en vez de esto, algo cambió en el formato del Excel — revisa que las columnas se llamen igual que siempre.
5. Sube todos los cambios a GitHub (arrastra la carpeta completa, o solo `data/*.js`, `js/core/state.js` y el `.xlsx` si usas git). GitHub Pages se actualiza solo.

Esto regenera automáticamente `data/dashboard-data.js`, `data/data.js`, `data/sin_marca.js` y `data/calendar-data.js`. No hay que tocar nada de `css/` ni el resto de `js/`.

### 3. Casos especiales — edítalos directamente en `etl/build_data.py`
El script tiene 4 listas de configuración, todas cerca del inicio del archivo. Agregar un caso es escribir una línea nueva; no rompe nada de lo demás.

| Situación | Qué hacer | Dónde |
|---|---|---|
| Un día se trabajó solo en la mañana (sin turno de tarde) | Agrega la fecha `'YYYY-MM-DD'` | `JORNADAS_SOLO_MANANA = { ... }` |
| Un día fue festivo (no se evalúa ninguna marca) | Agrega la fecha `'YYYY-MM-DD'` | `DIAS_FESTIVOS = { ... }` |
| Un empleado aparece con dos nombres distintos (error de tipeo) | Agrega `'Nombre mal escrito': 'Nombre correcto'` | `NOMBRES_UNIFICADOS = { ... }` |
| Un empleado no debe contar retardos (solo se registra su hora) | Agrega su nombre exacto | `EMPLEADOS_SIN_RETARDO = { ... }` |

Ejemplo — si el próximo lunes fue festivo:
```python
DIAS_FESTIVOS = {
    '2026-08-07',
    '2026-09-07',   # <-- nueva línea
}
```

### 4. Si cambia el horario oficial otra vez
Al inicio del script:
```python
FECHA_CAMBIO_HORARIO = '2026-07-16'
LIMITE_MANANA_ANTIGUO = 7*60          # 07:00 AM
LIMITE_MANANA_NUEVO = 7*60 + 30       # 07:30 AM
LIMITE_TARDE = 13*60 + 30             # 01:30 PM
```
Si vuelve a cambiar la hora de entrada de la mañana, cambia `FECHA_CAMBIO_HORARIO` a la nueva fecha de corte y `LIMITE_MANANA_NUEVO` al nuevo horario (en minutos desde medianoche: `horas*60 + minutos`). Todo lo anterior a esa fecha se sigue evaluando con `LIMITE_MANANA_ANTIGUO`, así que el historial no se altera.

Si cambia la hora de entrada de la tarde, ajusta `LIMITE_TARDE` de la misma forma (esa sí aplica igual a todo el historial, ya que hasta ahora no ha tenido fecha de corte — si necesitas que también dependa de una fecha, dímelo y lo agrego siguiendo el mismo patrón que `LIMITE_MANANA`).

### 5. La hora de salida sintética de los sábados
Cuando un sábado falta la "Salida mañana" pero sí hay "Entrada mañana", el script inventa una hora entre 11:30 y 11:35 (distinta por empleado, pero siempre la misma si vuelves a correr el script). Está en la función `salida_sabado_sintetica()`. Si el rango horario cambia, solo hay que ajustar los números `30` y `6` de esa función.

## Estructura
Ver la carpeta `css/` y `js/` — arquitectura modular ES6 documentada en cada archivo.

