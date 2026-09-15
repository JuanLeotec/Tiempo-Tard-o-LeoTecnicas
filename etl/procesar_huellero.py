import pandas as pd
from datetime import datetime

# Cargar archivo
mytable = pd.read_excel('Asistencia_lista.xlsx')  # Ubicar nuevamente el mismo nombre de excel

# Obtener columna de registro
time_column = None
for col in mytable.columns:
    if 'Hora de Registro' in col:
        time_column = col
        break

# --- CAMBIO 1: calcular Fecha y Día de la semana ANTES de clasificar marcas ---
# (antes se calculaba después; ahora lo necesitamos primero para saber si es lunes)
mytable['Fecha'] = pd.to_datetime(mytable['Fecha de entrada en vigor'], errors='coerce')
mytable['Día de la semana'] = mytable['Fecha'].dt.dayofweek  # 0=Lunes, ..., 5=Sábado

# Clasificar marcas
def clasificar_marcas(marcas_str, dia_semana):
    entrada_manana = ""
    salida_manana = ""
    entrada_tarde = ""
    salida_tarde = ""

    if pd.isna(marcas_str):
        return pd.Series([entrada_manana, salida_manana, entrada_tarde, salida_tarde])

    marcas = marcas_str.split(';')
    marcas = sorted(marcas)  # Orden cronológico

    # --- CAMBIO 2: umbral de "Salida tarde" según el día ---
    # Lunes salen a las 4:00 PM -> umbral 15:45 (con margen antes de la hora oficial)
    # Martes a viernes salen a las 5:00 PM -> se mantiene el umbral original 16:30
    limite_salida_tarde = "15:45" if dia_semana == 0 else "16:30"

    for m in marcas:
        hora = m.strip()[:5]
        if hora < "09:00" and entrada_manana == "":
            entrada_manana = m.strip()
        elif "11:30" <= hora <= "12:30":
            salida_manana = m.strip()
        elif "13:00" <= hora <= "14:30" and entrada_tarde == "":
            entrada_tarde = m.strip()
        elif hora >= limite_salida_tarde:
            salida_tarde = m.strip()

    return pd.Series([entrada_manana, salida_manana, entrada_tarde, salida_tarde])

# Aplicar clasificación de marcas (ahora fila por fila, para pasar el día de la semana)
if time_column:
    mytable[['Entrada mañana', 'Salida mañana', 'Entrada tarde', 'Salida tarde']] = mytable.apply(
        lambda row: clasificar_marcas(row[time_column], row['Día de la semana']), axis=1
    )
    mytable.drop(time_column, axis=1, inplace=True)
else:
    print("No se encontró la columna de 'Hora de Registro'.")

# Combinar nombre completo
mytable['Nombre Completo'] = mytable['Nombre'].astype(str) + ' ' + mytable['Apellido'].astype(str)
mytable.drop(['Nombre', 'Apellido'], axis=1, inplace=True)

# Reordenar columnas
columnas = mytable.columns.tolist()
columnas.remove("Nombre Completo")
columnas.insert(1, "Nombre Completo")
mytable = mytable[columnas]

# Ordenar por ID
mytable = mytable.sort_values(by='ID de Usuario').reset_index(drop=True)

# Limpiar horas
def limpiar_hora(hora_str):
    if pd.isna(hora_str) or not isinstance(hora_str, str):
        return None
    try:
        return datetime.strptime(hora_str.strip()[:5], "%H:%M").time()
    except:
        return None

mytable['Hora Entrada Mañana'] = mytable['Entrada mañana'].apply(limpiar_hora)
mytable['Hora Entrada Tarde'] = mytable['Entrada tarde'].apply(limpiar_hora)

# Tiempos límite
hora_limite_manana = datetime.strptime("07:30", "%H:%M").time()
hora_limite_tarde = datetime.strptime("13:30", "%H:%M").time()

# Retardo mañana
mytable['Retardo Mañana'] = mytable['Hora Entrada Mañana'].apply(
    lambda h: h > hora_limite_manana if h else False
)

# Retardo tarde (excepto sábados)
mytable['Retardo Tarde'] = mytable.apply(
    lambda row: row['Hora Entrada Tarde'] > hora_limite_tarde if row['Día de la semana'] != 5 and row['Hora Entrada Tarde'] else False,
    axis=1
)

# Cálculo de minutos de retardo
def minutos_retardo(hora, limite):
    if hora and hora > limite:
        h1 = datetime.combine(datetime.today(), hora)
        h2 = datetime.combine(datetime.today(), limite)
        return int((h1 - h2).total_seconds() // 60)
    return 0

mytable['Minutos Retardo Mañana'] = mytable['Hora Entrada Mañana'].apply(
    lambda h: minutos_retardo(h, hora_limite_manana)
)

mytable['Minutos Retardo Tarde'] = mytable.apply(
    lambda row: minutos_retardo(row['Hora Entrada Tarde'], hora_limite_tarde) if row['Día de la semana'] != 5 else 0,
    axis=1
)

# Identificar posibles horas extra los sábados (marca después de 13:30 p.m.)
mytable['Hora Extra Sábado'] = mytable.apply(
    lambda row: row['Hora Entrada Tarde'] > hora_limite_tarde if row['Día de la semana'] == 5 and row['Hora Entrada Tarde'] else False,
    axis=1
)

# Mostrar resultado
display(mytable)

# Exportar resultado como documento excel
mytable.to_excel("Procesado.xlsx", index=False)
