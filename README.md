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

## Calendario y resultados

copiar layout de [aquí](https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=&wtw-filter=ALL)

- [ ] Meter acrónimos en vista calendario
- [ ] cuadro a partir de eliminatoria

