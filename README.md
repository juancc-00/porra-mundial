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
- [ ] Estética
- [X] Eliminar clasificación
- [ ] Nombres y distribución de botones, etc
- [ ] Optimizar para movil

## Cloud functions

- [ ] Al acabar fase de grupos, ejecutar funcion vez unica para crear enfrentamientos dieciseisavos
- [ ] Comprobar en tiempo real que funciona correctamente
- [ ] Limpiar logs -> quitar o agrupar los sin puntos 

- [ ] En la final, sumar también puntos por predicciones generales (campeon y sub)

## Home


## Información

(Alberto)
- [ ] Info general de la página
- [ ] Bases, instrucciones, puntuaciones, fechas, etc

## Mis porras

(Alberto)
- [X] Poner limite 12 participantes

## Porra

(Juan)
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
    - [ ] Gestionar cuando mostrar cada fase (usar funcion obtenerEstadoFase dentro de fases.js)
- [ ] Gestionar correspondencia numero partido - que partido es para eje X grafica progreso
- [X] Gestionar empate en clasificacion
- [X] Procesados no tienen por que estar en orden cronologico
- [X] Tarjetas mas estrechas

## Calendario y resultados

(Juan)
- [X] Meter acrónimos en vista calendario
- [ ] Cambiar el bruteforce por leer procesados+partidos para resultados reales
- [ ] Quitar "ver grupos"

## Mis predicciones

(Alberto)
- [X] Prediccion general: llamar "Iniciales" o algo asi, cambiar Campeon y subcampeon. 
- [X] Granularidad en tiempo faltante (horas, minutos al final)
- [ ] Extender bloqueo de predicciones no solo no poder acceder a la pagina, sino bloqueo write de firebase

## Prediccion Inicial

(Alberto)
- [X] Quitar hover ilumina paises
- [X] Boton guardar prediccion: posicion absoluta en pantalla
- [X] Mensaje: "Todas las predicciones completadas. Puedes modificarlas hasta...", o "Faltan x", etc. 
- [ ] Simular fase eliminatoria: Info con para que esta ahi, cambiar estetica, boton ocultar, poner fase de grupos debajo

## Prediccion Siguientes fases

(Alberto)
- [ ] Hacer
- [ ] Gestionar dislexia: partidos aparecen como Diesciseisafsdfaos 
- [ ] Funcionalidad penaltis: cambiar estetica y distribucion; explicar
- [ ] Logica penalties: en vez de equipo ganador, escribir 0/1 en Partidos