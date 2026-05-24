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

## GENERAL

- [ ] Excel con estimacion de consumo lecturas/escrituras
- [ ] Trabajar en seguridad del backend (firebase bloqueado?)
- [ ] Generalizar Estética
- [X] Cambiar panel desplegable user
- [X] Eliminar clasificación
- [X] Nombres y distribución de botones, etc
- [ ] Optimizar para movil
- [X] Quitar boton info
- [X] Desplegar web

## Cloud functions

- [ ] Al acabar fase de grupos, ejecutar funcion vez unica para crear enfrentamientos dieciseisavos
- [ ] Comprobar en tiempo real que funciona correctamente
- [ ] Limpiar logs -> quitar o agrupar los sin puntos 

- [ ] En la final, sumar también puntos por predicciones generales (campeon y sub)

## Home
- (?) [ ] Quitar Zoom
- [X] Poner logo arriba izda
- [X] Cambiar slogan y texto cringe en general
- [ ] Countdown personalizado por fase
- [ ] Añadir explicacion "te parece injusto?" en puntuacion


## Información

(Alberto)
- [X] Info general de la página
- [X] Bases, instrucciones, puntuaciones, fechas, etc

## Mis porras

(Alberto)
- [X] Poner limite 12 participantes

## Porra

(Juan)
- [X] Scoreboard: muestra solo 3 o es dinamico?
- [ ] Importante! comprobar eficiencia en como se recorre, parece que se está haciendo leyendo todos los partidos cada vez
- [X] Crear diccionario IDs -> orden cronologico
- [X] Quitar brute force a todo
- [X] Leer desglose_puntos, con ello actualizar: 
    - [X] Clasificación
    - [X] Grafica progreso
    - [X] Sección partidos con "+ n" al lado de prediccion 
- [X] Leer logs + logica (5 ultimos) para actualizar actividad
- [X] Sección partidos: 
    - [X] Cambiar nombres de paises por abreviaturas
    - [X] Hacer logica de procesados + 3 partidos (diccionario IDs -> orden cronologico)
    - [X] Leer predicciones + leer partidos y displayear en las tarjetas
    - [X] Gestionar cuando mostrar cada fase (usar funcion obtenerEstadoFase dentro de fases.js)
- [X] Gestionar correspondencia numero partido - que partido es para eje X grafica progreso
- [X] Gestionar empate en clasificacion
- [X] Procesados no tienen por que estar en orden cronologico
- [X] Tarjetas mas estrechas
- [X] optimizar para movil
- [X] gestionar margenes containers
- [X] Eje X grafico quitar espacios "P 1" a "P1" 
- [X] Añadir identificador "PX" a tarjetas de partidos en la esquina

## Calendario y resultados

(Juan)
- [X] Meter acrónimos en vista calendario
- [X] Cambiar el bruteforce por leer procesados+partidos para resultados reales
- [X] Quitar "ver grupos"
- [ ] optimizar para movil
- [X] Quitar "primera fase", cambiar por fase real

## Mis predicciones

(Alberto)
- [X] Prediccion general: llamar "Iniciales" o algo asi, cambiar Campeon y subcampeon. 
- [X] Granularidad en tiempo faltante (horas, minutos al final)
- [ ] Extender bloqueo de predicciones no solo no poder acceder a la pagina, sino bloqueo write de firebase
- [ ] Poner boton Volver
- [ ] Cambiar botones por desplegable (fase testing, extender a resto predicciones)

## Prediccion Inicial

(Alberto)
- [X] Quitar hover ilumina paises
- [X] Boton guardar prediccion: posicion absoluta en pantalla
- [X] Mensaje: "Todas las predicciones completadas. Puedes modificarlas hasta...", o "Faltan x", etc. 
- [X] Simular fase eliminatoria: Info con para que esta ahi, cambiar estetica, boton ocultar, poner fase de grupos debajo
- [X] No leer de partidos: hacer html estatico

## Prediccion Siguientes fases

(Alberto)
- [X] Hacer
- [X] Gestionar dislexia: partidos aparecen como Diesciseisafsdfaos 
- [X] Funcionalidad penaltis: cambiar estetica y distribucion; explicar
- [X] Logica penalties: en vez de equipo ganador, escribir 0/1 en Partidos