# porra-mundial
Sitio web para hacer porras del mundial de fútbol 2026


Firestore database:
Colecciones: 
- partidos
    ID de cada tabla: número del partido
    Variables:
        - Estadio
        - Fase
        - Fecha
        - Hora
        - Numero
        - Pais1
        - Pais2
        - Resultado
- porras
    ID generado aleatoriamente
    Variables:
        - ID
        - fecha_creacion
        - miembros (array)
        - nombre
        - owner
- predicciones
    ID: id de google del usuario (uid)
    Variables: 
        - {Numero partido: {g1, g2}}
- usuarios
    ID: id de google del usuario (uid)
    Variables:
        - creado
        - email
        - nombre

TODO:

- Decidir: 
	- Qué se predice
	- Cuántos puntos se suma por cada cosa
	- Criterio prorrogas y penalties

ALBERTO: 
- Terminar paginas de predicciones
- Lógica de activar/bloquear predicciones
- Versión de paginas empezó/no empezó el mundial
- Lógica API futbol
- Meter 'Jugados' en la tabla de clasificación de las predicciones
- Separador por jornadas en predicciones (2+2+2 partidos)

JUAN: 
- Info no loggeado (clasificación, cuadro, resultados y calendario + vista de calendario): verificar reglas desempates y clasificación. 
- Página de porra: 
	- Leaderboard con función que actualiza
	- Pantalla de logs
	- Gráfica progresión clasi
	- Jugadores clickables -> pagina de sus predicciones/puntos sumados

## GENERAL

- [ ] Trabajar en seguridad del backend (firebase bloqueado?)
- [ ] Estética
- [ ] Eliminar clasificación
- [ ] Nombres y distribución de botones, etc
- [ ] Optimizar para movil

## Cloud functions

- [ ] Al acabar fase de grupos, ejecutar funcion vez unica para crear enfrentamientos dieciseisavos
- [ ] Comprobar en tiempo real que funciona correctamente

- [ ] En la final, sumar también puntos por predicciones generales (campeon y sub)

## Home


## Información

(Alberto)
- [ ] Info general de la página
- [ ] Bases, instrucciones, puntuaciones, fechas, etc

## Mis porras

(Alberto)
- [ ] Poner limite 12 participantes

## Porra

(Juan)
- [ ] Crear diccionario IDs -> orden cronologico
- [ ] Quitar brute force a todo
- [ ] Leer desglose_puntos, con ello actualizar: 
    - [ ] Clasificación
    - [ ] Grafica progreso
    - [ ] Sección partidos con "+ n" al lado de prediccion 
- [ ] Leer logs + logica (5 ultimos) para actualizar actividad
- [ ] Sección partidos: 
    - [ ] Cambiar nombres de paises por abreviaturas
    - [ ] Hacer logica de procesados + 3 partidos (diccionario IDs -> orden cronologico)
    - [ ] Leer predicciones + leer partidos y displayear en las tarjetas
    - [ ] Gestionar cuando mostrar cada fase (usar funcion obtenerEstadoFase dentro de fases.js)
- [ ] Gestionar correspondencia numero partido - que partido es para eje X grafica progreso

## Calendario y resultados

(Juan)
- [X] Meter acrónimos en vista calendario
- [ ] Cambiar el bruteforce por leer procesados+partidos para resultados reales
- [ ] Quitar "ver grupos"

## Mis predicciones

(Alberto)
- [ ] Prediccion general: llamar "Iniciales" o algo asi, cambiar Campeon y subcampeon. 
- [ ] Granularidad en tiempo faltante (horas, minutos al final)
- [ ] Extender bloqueo de predicciones no solo no poder acceder a la pagina, sino bloqueo write de firebase

## Prediccion Inicial

(Alberto)
- [ ] Quitar hover ilumina paises
- [ ] Boton guardar prediccion: posicion absoluta en pantalla
- [ ] Mensaje: "Todas las predicciones completadas. Puedes modificarlas hasta...", o "Faltan x", etc. 
- [ ] Simular fase eliminatoria: Info con para que esta ahi, cambiar estetica, boton ocultar, poner fase de grupos debajo

## Prediccion Siguientes fases

(Alberto)
- [ ] Hacer
- [ ] Gestionar dislexia: partidos aparecen como Diesciseisafsdfaos 
- [ ] Funcionalidad penaltis: cambiar estetica y distribucion; explicar
- [ ] Logica penalties: en vez de equipo ganador, escribir 0/1 en Partidos