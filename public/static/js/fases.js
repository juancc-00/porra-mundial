const fases = {

  grupos: {
    activaDesde: null,
    bloqueadaDesde: new Date("2026-06-11T21:00")
  },

  dieciseisavos: {
    activaDesde: new Date("2026-06-28T06:00"),
    bloqueadaDesde: new Date("2026-06-28T21:00")
  },

  octavos: {
    activaDesde: new Date("2026-07-04T06:00"),
    bloqueadaDesde: new Date("2026-07-04T19:00")
  },

  cuartos: {
    activaDesde: new Date("2026-07-08T00:00"),
    bloqueadaDesde: new Date("2026-07-09T22:00")
  }, 

  semifinales: {
    activaDesde: new Date("2026-07-12T06:00"),
    bloqueadaDesde: new Date("2026-07-14T21:00")
  },

  final: {
    activaDesde: new Date("2026-07-15T23:00"),
    bloqueadaDesde: new Date("2026-07-18T23:00")
  }

};

function obtenerEstadoFase(nombreFase) {

  const ahora = new Date();
  // const ahora = new Date("2026-07-14T16:00");
  // const ahora = new Date("2026-07-11T16:00");

  const fase = fases[nombreFase];

  if (!fase) return "inactiva";

  if (fase.activaDesde && ahora < fase.activaDesde) {
    return "inactiva";
  }

  if (ahora >= fase.bloqueadaDesde) {
    return "bloqueada";
  }

  return "activa";
}