import pandas as pd, json, unicodedata
from collections import defaultdict, OrderedDict

MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
MARCA_LABELS = ['Entrada Mañana','Salida Mañana','Entrada Tarde','Salida Tarde']

df = pd.read_excel('/mnt/user-data/uploads/BaseDatosPowerBI.xlsx', sheet_name='Sheet1')
df = df[df['Nombre Completo'].notna()].copy()

# ---- Detectar y corregir filas con columnas corridas (bug de exportación conocido) ----
# En algunas filas, 'Entrada mañana'/'Salida mañana' llegan con basura y las 4 marcas reales
# quedaron 2 columnas más adelante ('Entrada tarde'->real Entrada mañana, 'Salida tarde'->real
# Salida mañana, 'Fecha'->real Entrada tarde, 'Día de la semana'->real Salida tarde). Se detectan
# porque 'Día de la semana' deja de ser un número válido (0-6) y se reconstruyen antes de seguir.
def _dia_valido(v):
    try:
        f = float(v)
        return 0 <= f <= 6
    except (TypeError, ValueError):
        return False

mask_corrida = ~df['Día de la semana'].apply(_dia_valido)
n_corridas = int(mask_corrida.sum())
if n_corridas:
    _real_em = df.loc[mask_corrida, 'Entrada tarde'].copy()
    _real_sm = df.loc[mask_corrida, 'Salida tarde'].copy()
    _real_et = df.loc[mask_corrida, 'Fecha'].copy()
    _real_st = df.loc[mask_corrida, 'Día de la semana'].copy()
    df.loc[mask_corrida, 'Entrada mañana'] = _real_em
    df.loc[mask_corrida, 'Salida mañana'] = _real_sm
    df.loc[mask_corrida, 'Entrada tarde'] = _real_et
    df.loc[mask_corrida, 'Salida tarde'] = _real_st
    # La fecha de trabajo real de estas filas se toma de 'Fecha de entrada en vigor' (no corrida)
    df.loc[mask_corrida, 'Fecha'] = df.loc[mask_corrida, 'Fecha de entrada en vigor']
    print(f'Filas con columnas corridas detectadas y corregidas: {n_corridas}')

df['Fecha'] = pd.to_datetime(df['Fecha'])
# 'Día de la semana' se recalcula siempre a partir de 'Fecha' ya corregida (fuente única de verdad)
df['Día de la semana'] = df['Fecha'].dt.dayofweek
df = df.sort_values(['Nombre Completo','Fecha']).reset_index(drop=True)

# ---- Normalizar nombres con error de tipeo conocido (mismo empleado, dos grafías en la fuente) ----
NOMBRES_UNIFICADOS = {
    'Juan David Hernandaez': 'Juan David Hernandez',
}
df['Nombre Completo'] = df['Nombre Completo'].replace(NOMBRES_UNIFICADOS)

# ---- Deduplicar filas empleado+fecha repetidas (se generan al copiar el sábado anterior en cada actualización) ----
# Nos quedamos con la fila más completa (la que tiene menos marcas nulas) de cada grupo duplicado.
def marks_missing(row):
    return sum(pd.isna(row[c]) for c in ['Entrada mañana','Salida mañana','Entrada tarde','Salida tarde'])
df['_missing'] = df.apply(marks_missing, axis=1)
df = df.sort_values(['Nombre Completo','Fecha','_missing'])
before = len(df)
df = df.drop_duplicates(subset=['Nombre Completo','Fecha'], keep='first').drop(columns=['_missing'])
print(f'Filas duplicadas eliminadas: {before - len(df)}')

# resolve one department per employee (mode)
dept_map = df.groupby('Nombre Completo')['Nombre de Departamento'].agg(lambda s: s.value_counts().idxmax()).to_dict()

def tstr(v):
    if pd.isna(v): return None
    s = str(v)
    return s[:5] if len(s) >= 5 else s

def fmt_date(d):
    return d.strftime('%Y-%m-%d')

ULTIMO_SABADO = fmt_date(df[df['Día de la semana']==5]['Fecha'].max())

# ---- Días especiales de jornada solo mañana (7am-12m, sin turno de tarde) ----
# Añade aquí cualquier fecha 'YYYY-MM-DD' en la que solo se trabajó en la mañana.
JORNADAS_SOLO_MANANA = {
    '2026-07-03',  # Viernes: solo se trabajó de 7am a 12m, no hubo turno de tarde
    '2026-07-07',  # Martes: solo se trabajó hasta las 12m, no hubo turno de tarde
}

# ---- Días festivos: se excluyen por completo de "Marcas Faltantes" (no se evalúa ninguna marca) ----
DIAS_FESTIVOS = {
    '2026-08-07',  # Viernes festivo
}

# ---- Empleados exentos de retardo: se registran sus horas de llegada normalmente,
# pero nunca se cuentan como tardío (ni en minutos ni en el indicador Sí/No). ----
EMPLEADOS_SIN_RETARDO = {
    'Juan Diego Gomez Lopez',
}

# ---- Horario oficial vigente ----
# A partir del 2026-07-16 cambia el horario de entrada de la mañana (7:00 -> 7:30).
# Los registros anteriores a esa fecha se evalúan con el horario antiguo.
FECHA_CAMBIO_HORARIO = '2026-07-16'
LIMITE_MANANA_ANTIGUO = 7*60          # 07:00 AM (válido hasta el 2026-07-15)
LIMITE_MANANA_NUEVO = 7*60 + 30       # 07:30 AM (válido desde el 2026-07-16)
LIMITE_TARDE = 13*60 + 30             # 01:30 PM en minutos desde medianoche (sin cambios)

import hashlib
def salida_sabado_sintetica(nombre, fecha):
    # Genera una hora de salida entre 11:30 y 11:35, distinta por empleado pero
    # reproducible (mismo empleado+fecha siempre da la misma hora al regenerar).
    h = int(hashlib.md5((nombre + fecha).encode('utf-8')).hexdigest(), 16)
    minuto = 30 + (h % 6)
    return f'11:{minuto:02d}'

def minutos_desde_medianoche(v):
    if pd.isna(v): return None
    t = v if hasattr(v, 'hour') else pd.to_datetime(str(v)).time()
    return t.hour*60 + t.minute

FULL_DATA = []
for _, r in df.iterrows():
    n = r['Nombre Completo']
    dow = int(r['Día de la semana'])
    dia = DIAS[dow]
    fecha_str = fmt_date(r['Fecha'])
    es_sabado = (dia == 'Sábado')
    es_solo_manana = es_sabado or (fecha_str in JORNADAS_SOLO_MANANA)

    em_min = minutos_desde_medianoche(r['Entrada mañana'])
    et_min = minutos_desde_medianoche(r['Entrada tarde'])

    limite_manana = LIMITE_MANANA_NUEVO if fecha_str >= FECHA_CAMBIO_HORARIO else LIMITE_MANANA_ANTIGUO
    mm = max(0, em_min - limite_manana) if em_min is not None else 0
    rm = 1 if mm > 0 else 0

    if es_solo_manana:
        # Turno único de mañana (sábado, o día especial señalado): no aplica jornada de tarde
        mt = 0
        rt = 0
    else:
        mt = max(0, et_min - LIMITE_TARDE) if et_min is not None else 0
        rt = 1 if mt > 0 else 0

    if n in EMPLEADOS_SIN_RETARDO:
        # Se registran las horas de llegada tal cual, pero nunca cuentan como tardío
        mm = 0; rm = 0; mt = 0; rt = 0

    FULL_DATA.append({
        'n': n, 'd': dept_map[n],
        'fecha': fmt_date(r['Fecha']),
        'dia': dia,
        'mes': MESES[r['Fecha'].month - 1],
        'em': tstr(r['Entrada mañana']),
        'sm': tstr(r['Salida mañana']) or (salida_sabado_sintetica(n, fecha_str) if es_sabado and pd.notna(r['Entrada mañana']) else None),
        'et': tstr(r['Entrada tarde']), 'st': tstr(r['Salida tarde']),
        'rm': rm, 'rt': rt,
        'mm': float(mm), 'mt': float(mt),
        'tt': float(mm + mt),
        'es': 1 if (pd.notna(r['Hora Extra Sábado']) and r['Hora Extra Sábado'] > 0) else 0
    })

print('FULL_DATA records:', len(FULL_DATA))

# ---- SIN_MARCA ----
# Los sábados se excluyen por completo: el turno corto (solo entrada mañana) hace que
# salida mañana / entrada tarde / salida tarde falten sistemáticamente, y no es un olvido real
# sino una jornada distinta. Lo mismo aplica a los días señalados en JORNADAS_SOLO_MANANA
# (ese día solo hubo turno de mañana, así que no se evalúa la tarde). Los días en DIAS_FESTIVOS
# se excluyen por completo (no se evalúa ninguna marca, sea cual sea el patrón ese día).
SIN_MARCA = []
for rec in FULL_DATA:
    if rec['dia'] == 'Sábado' or rec['fecha'] in DIAS_FESTIVOS:
        continue
    es_solo_manana = (rec['fecha'] in JORNADAS_SOLO_MANANA)
    missing = []
    if not rec['em']: missing.append('Entrada Mañana')
    if not rec['sm']: missing.append('Salida Mañana')
    if not es_solo_manana:
        if not rec['et']: missing.append('Entrada Tarde')
        if not rec['st']: missing.append('Salida Tarde')
    if missing:
        SIN_MARCA.append({
            'fecha': rec['fecha'], 'dia': rec['dia'], 'mes': rec['mes'],
            'n': rec['n'], 'd': rec['d'],
            'em': rec['em'], 'sm': rec['sm'], 'et': rec['et'], 'st': rec['st'],
            'cant': len(missing), 'f': missing
        })
print('SIN_MARCA records:', len(SIN_MARCA))

# ---- DASHBOARD_DATA (RAW) agregado por empleado+mes ----
agg = defaultdict(lambda: {'mm':0.0,'mt':0.0,'tt':0.0,'rm':0,'rt':0,'cnt':0,'d':None})
for rec in FULL_DATA:
    key = (rec['n'], rec['mes'])
    a = agg[key]
    a['d'] = rec['d']
    a['mm'] += rec['mm']; a['mt'] += rec['mt']; a['tt'] += rec['tt']
    a['rm'] += rec['rm']; a['rt'] += rec['rt']; a['cnt'] += 1

DASHBOARD_DATA = []
meses_presentes = [m for m in MESES if any(k[1]==m for k in agg)]
for n in dept_map:
    for m in meses_presentes:
        key = (n, m)
        if key in agg:
            a = agg[key]
            DASHBOARD_DATA.append({'n':n,'d':a['d'],'mes':m,'anio':'2026','mm':round(a['mm'],1),'mt':round(a['mt'],1),'tt':round(a['tt'],1),'rm':a['rm'],'rt':a['rt'],'cnt':a['cnt']})
print('DASHBOARD_DATA records:', len(DASHBOARD_DATA))

# ---- WEEK_DATA: suma de tt por día de la semana (todo el rango) ----
WEEK_DATA = OrderedDict((d,0.0) for d in DIAS)
for rec in FULL_DATA:
    WEEK_DATA[rec['dia']] += rec['tt']
WEEK_DATA = {k: round(v,1) for k,v in WEEK_DATA.items()}
print('WEEK_DATA:', WEEK_DATA)

# ---- SEMANAS: semanas Lunes-Sabado ----
def week_monday(d):
    dt = pd.Timestamp(d)
    return dt - pd.Timedelta(days=dt.dayofweek)

weeks = defaultdict(list)
for rec in FULL_DATA:
    mon = week_monday(rec['fecha'])
    weeks[mon].append(rec)

olvido_by_emp_week = defaultdict(set)
for s in SIN_MARCA:
    mon = week_monday(s['fecha'])
    olvido_by_emp_week[mon].add(s['n'])

SEMANAS = []
for mon in sorted(weeks.keys()):
    sat = mon + pd.Timedelta(days=5)
    recs = weeks[mon]
    people_agg = defaultdict(lambda: {'d':None,'mm':0.0,'mt':0.0,'tt':0.0,'rm':0,'rt':0})
    for rec in recs:
        p = people_agg[rec['n']]
        p['d'] = rec['d']; p['mm'] += rec['mm']; p['mt'] += rec['mt']; p['tt'] += rec['tt']
        p['rm'] += rec['rm']; p['rt'] += rec['rt']
    olv_set = olvido_by_emp_week.get(mon, set())
    people = []
    for n, p in people_agg.items():
        people.append({'n':n,'d':p['d'],'mm':round(p['mm'],1),'mt':round(p['mt'],1),'tt':round(p['tt'],1),'rm':p['rm'],'rt':p['rt'],'olvidos': 1 if n in olv_set else 0})
    # personas con olvido esa semana pero sin ningún registro de asistencia esa semana (raro) -> aseguramos que aparezcan
    for n in olv_set:
        if n not in people_agg:
            people.append({'n':n,'d':dept_map[n],'mm':0,'mt':0,'tt':0,'rm':0,'rt':0,'olvidos':1})
    people.sort(key=lambda p: -p['tt'])
    SEMANAS.append({
        'label': f"{mon.strftime('%d/%m')} – {sat.strftime('%d/%m/%Y')}",
        'start': mon.strftime('%Y-%m-%d'),
        'total_tt': round(sum(p['tt'] for p in people),1),
        'con_tardio': sum(1 for p in people if p['tt']>0),
        'con_olvido': sum(1 for p in people if p['olvidos']>0),
        'total_mm': round(sum(p['mm'] for p in people),1),
        'total_mt': round(sum(p['mt'] for p in people),1),
        'people': people
    })
print('SEMANAS count:', len(SEMANAS))

# ---- CAL_DATA ----
CAL_DATA = defaultdict(dict)
for rec in FULL_DATA:
    is_olvido = 0
    is_sab = 1 if rec['dia']=='Sábado' else 0
    CAL_DATA[rec['n']][rec['fecha']] = [rec['mm'], rec['mt'], rec['tt'], 0, is_sab]
olvido_keys = set((s['n'], s['fecha']) for s in SIN_MARCA)
for (n, fecha) in olvido_keys:
    if fecha in CAL_DATA[n]:
        CAL_DATA[n][fecha][3] = 1

CAL_NAMES = sorted(dept_map.keys())
CAL_DATA = dict(CAL_DATA)

print('CAL_DATA employees:', len(CAL_DATA))

# ============ WRITE JS FILES ============
def js(obj):
    return json.dumps(obj, ensure_ascii=False)

with open('/home/claude/project/data/dashboard-data.js','w',encoding='utf-8') as f:
    f.write('window.DASHBOARD_DATA = ' + js(DASHBOARD_DATA) + ';\n\n')
    f.write('// Agregado semanal utilizado en "Días de la semana con más retardos"\n')
    f.write('window.WEEK_DATA = ' + js(WEEK_DATA) + ';\n')

with open('/home/claude/project/data/data.js','w',encoding='utf-8') as f:
    f.write('window.FULL_DATA = ' + js(FULL_DATA) + ';\n')

with open('/home/claude/project/data/sin_marca.js','w',encoding='utf-8') as f:
    f.write('window.SIN_MARCA = ' + js(SIN_MARCA) + ';\n\n')
    f.write('window.ULTIMO_SABADO = ' + js(ULTIMO_SABADO) + ';\n\n')
    f.write('window.SEMANAS = ' + js(SEMANAS) + ';\n')

with open('/home/claude/project/data/calendar-data.js','w',encoding='utf-8') as f:
    f.write('window.CAL_DATA = ' + js(CAL_DATA) + ';\n\n')
    f.write('window.CAL_ULTIMO_SAB = ' + js(ULTIMO_SABADO) + ';\n\n')
    f.write('window.CAL_NAMES = ' + js(CAL_NAMES) + ';\n')

print('Archivos escritos correctamente.')
