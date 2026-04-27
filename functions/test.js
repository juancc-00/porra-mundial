const {setGlobalOptions} = require("firebase-functions");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");

// process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
// console.log("Credenciales:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
// $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\alber\Documents\credenciales_proyecto_porra\porra-mundial-91819-firebase-adminsdk-fbsvc-e2e344b07b.json"
// admin.initializeApp({
//   projectId: "porra-mundial-91819",
// });

// admin.initializeApp();
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "porra-mundial-91819"
});
const db = admin.firestore();

// cargar JSON local
const matchesData = JSON.parse(fs.readFileSync("matches.json", "utf8"));

function normalize(str) {
  return str.toLowerCase().trim();
}

function findMatchId(team1, team2, date) {
  // como fecha en Wikipedia es local, hay que permitir margen +1 dia en fecha española
  team1 = team1.replace("República Democrática del Congo", "RD Congo");
  team2 = team2.replace("República Democrática del Congo", "RD Congo");
  return matchesData.find((m) => {
    const sameTeams =
      normalize(m.Pais1) === normalize(team1) &&
      normalize(m.Pais2) === normalize(team2);

    if (!sameTeams) return false;

    // 👉 Parsear fechas
    const dbDate = parseFecha(m.Fecha);
    const wikiDate = parseFechaWiki(date);

    // 👉 Diferencia en días
    const diffDays = Math.floor(
      (dbDate - wikiDate) / (1000 * 60 * 60 * 24)
    );

    // 👉 Permitimos mismo día (0) o día siguiente (1)
    return diffDays === 0 || diffDays === 1;
  })?.Numero;
}

function parseFechaWiki(fechaStr) {
  const meses = {
    junio: 5,
    julio: 6,
  };
  const match = fechaStr.match(/(\d{1,2}) de (\w+) de (\d{4})/);
  if (!match) return null;
  const dia = parseInt(match[1]);
  const mes = meses[match[2].toLowerCase()];
  const anio = parseInt(match[3]);

  return new Date(anio, mes, dia);
}

function parseFecha(fechaStr) {
    const [d, m, a] = fechaStr.split("/");
    return new Date(a, m - 1, d);
}

// function formatearFechaLarga(fechaStr) {
//         const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
//         const date = parseFecha(fechaStr);
//         return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
//     }

function getFaseFromId(id) {
  if (id >= 1 && id <= 72) return "grupos";
  if (id >= 73 && id <= 88) return "dieciseisavos";
  if (id >= 89 && id <= 96) return "octavos";
  if (id >= 97 && id <= 100) return "cuartos";
  if (id === 101 || id === 102) return "semifinales";
  if (id === 103) return "tercer";
  if (id === 104) return "final";
  return null;
}

let matchesGlobal = [];

async function getAllMatches() {
  // Esta función lee de la página de Wikipedia, detecta todos los partidos y extrae los resultados
  // Además, asigna a cada partido su ID, y devuelve todos los partidos con ID y resultado según Wikipedia

  // Versión oficial: leyendo de wikipedia
  // const url =
  //   "https://es.wikipedia.org/w/api.php?action=parse&page=Copa_Mundial_de_Fútbol_de_2026&format=json";

  // const res = await fetch(url);
  // const data = await res.json();

  // const html = data.parse.text["*"];

  // Versión pruebas: leyendo de dummy
  const html = fs.readFileSync("../utils/dummy_wiki.html", "utf-8");


  const $ = cheerio.load(html);

  let matches = [];
  let matchesLeidos = [];

  $("table.vevent").each((i, table) => {
    const tds = $(table).find("td");

    if (tds.length < 4) return;

    const date = $(tds[0]).text().trim().replace(/\s+/g, " ");
    const team1 = $(tds[1]).text().trim();
    const team2 = $(tds[3]).text().trim();

    const resultCell = $(table).find("td").eq(2);

    // TODOS los divs dentro del resultado
    const divs = resultCell.find("div");

    let g1 = null;
    let g2 = null;
    let p1 = null;
    let p2 = null;

    divs.each((i, div) => {
      const text = $(div).text().replace(/\s+/g, " ").trim();

      // 🎯 1. Resultado principal (solo el primero que aparezca)
      if (g1 === null && g2 === null) {
        const match = text.match(/\b(\d{1,2}):(\d{1,2})\b/);
        if (match) {
          g1 = parseInt(match[1]);
          g2 = parseInt(match[2]);
        }
      }

      // 🎯 2. Penaltis (si existen)
      const penMatch = text.match(/\((\d{1,2}):(\d{1,2})\s*p\.\)/);
      if (penMatch) {
        p1 = parseInt(penMatch[1]);
        p2 = parseInt(penMatch[2]);
      }
    });

    const id = findMatchId(team1, team2, date);

    matches.push({
      id,
      date,
      team1,
      team2,
      g1,
      g2,
      p1,
      p2,
    });
  });


  // console.log("Partidos leidos en wiki: \n")
  // ordenar por id
  matches
    .filter((m) => m.id !== undefined)
    .sort((a, b) => a.id - b.id)
    .forEach((m) => {
      matchesLeidos.push({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        g1: m.g1,
        g2: m.g2,
        p1: m.p1,
        p2: m.p2,
        fase: getFaseFromId(m.id)
      });
      // console.log(
      //   `Match ${m.id}: ${m.team1} vs ${m.team2} | g1:${m.g1} g2:${m.g2} p1:${m.p1} p2:${m.p2}`
      // );
    });

  matchesGlobal = matchesLeidos;
  return matchesLeidos;
}

const POINTS = {
  grupos:        { "1x2": 1, "DG": 2, "MARCADOR": 4 },
  dieciseisavos: { "1x2": 2, "DG": 4, "MARCADOR": 9, "GE": 1 },
  octavos:       { "1x2": 3, "DG": 6, "MARCADOR": 12, "GE": 2 },
  cuartos:       { "1x2": 5, "DG": 10, "MARCADOR": 20, "GE": 3 },
  semifinales:   { "1x2": 6, "DG": 12, "MARCADOR": 27, "GE": 3 },
  tercer:        { "1x2": 6, "DG": 12, "MARCADOR": 27, "GE": 3 },
  final:         { "1x2": 8, "DG": 16, "MARCADOR": 36, "GE": 4 },
};

function calcularPuntos(real, pred, fase) {

  // Calcula los puntos que gana un jugador para un partido en función del resultado real, su predicción y la fase
  // La predicción debe tener g1, g2 y una variable w marcando 0 si gana eliminatoria el equipo1, 1 si gana equipo2
  const { g1, g2, p1, p2 } = real;
  const { g1: pg1, g2: pg2, w } = pred;

  const faseKey = fase.toLowerCase();
  const rules = POINTS[faseKey];

  let puntos = 0;
  const aciertos = [];

  // -------------------------
  // 🎯 1. 1X2 / DG / MARCADOR
  // -------------------------

  const realDiff = g1 - g2;
  const predDiff = pg1 - pg2;

  let tipoAcierto = null;

  if (g1 === pg1 && g2 === pg2) {
    tipoAcierto = "MARCADOR";
  } else if (realDiff === predDiff) {
    tipoAcierto = "DG";
  } else if (
    (g1 > g2 && pg1 > pg2) ||
    (g1 < g2 && pg1 < pg2) ||
    (g1 === g2 && pg1 === pg2)
  ) {
    tipoAcierto = "1x2";
  }

  if (tipoAcierto) {
    puntos += rules[tipoAcierto];
  }

  // -------------------------
  // 🏆 2. Gana eliminatoria (GE)
  // -------------------------

  if (faseKey !== "grupos") {
    let ganadorReal;

    if (p1 !== null && p2 !== null) {
      ganadorReal = p1 > p2 ? 0 : 1;
    } else {
      ganadorReal = g1 > g2 ? 0 : 1;
    }

    if (w === ganadorReal) {
      puntos += rules.GE;
      aciertos.push("GE");
    }
  }

  // -------------------------
  // 🎯 3. Añadir tipo principal
  // -------------------------

  if (tipoAcierto === "MARCADOR") aciertos.unshift("MARCADOR");
  else if (tipoAcierto === "DG") aciertos.unshift("DG");
  else if (tipoAcierto === "1x2") aciertos.unshift("1x2");

  return {
    puntos,
    aciertos,
  };
}

async function obtenerPartidosNuevos(matches, procesados){
  //Toma los partidos sacados de getAllMatches y compara con la variable "procesados" de firestore 
  // para obtener los partidos que deben procesarse en esta ejecución

  // Filtrar partidos con resultado y no procesados
  const partidosNuevos = matches.filter(m =>
    m.g1 !== null &&
    m.g2 !== null &&
    !procesados.includes(m.id)
  );

  console.log("Partidos nuevos: ", partidosNuevos)
  return partidosNuevos;
}


async function actualizarActividad(partidosNuevos) {
  const db = admin.firestore();
    
  const porrasSnap = await db.collection("porras").get();

  let porras = [];
  let userSet = new Set();

  porrasSnap.forEach(doc => {
    const data = doc.data();
    porras.push({ id: doc.id, ...data });
    data.miembros.forEach(uid => userSet.add(uid));
  });

  const userIds = Array.from(userSet);

  // Leer usuarios
  const usersSnap = await db.getAll(
    ...userIds.map(uid => db.collection("usuarios").doc(uid))
  );

  let usersMap = {};
  usersSnap.forEach(doc => {
    usersMap[doc.id] = doc.data();
  });

  // Predicciones
  let predicciones = {};
  const fases = [...new Set(partidosNuevos.map(p => p.fase))];

  for (let uid of userIds) {
    predicciones[uid] = {};

    for (let fase of fases) {
      const docRef = db
        .collection("predicciones")
        .doc(uid)
        .collection(fase)
        .doc("datos");

      const snap = await docRef.get();

      predicciones[uid][fase] = {};

      if (snap.exists) {
        const data = snap.data();

        for (let match of partidosNuevos) {
          if (match.fase !== fase) continue;

          const pred = data[match.id];
          if (pred) {
            predicciones[uid][fase][match.id] = pred;
          }
        }
      }
    }
  }

  // Acumulador de puntos por usuario
  let puntosPorUsuario = {}; 
  // Para evitar duplicar por partido
  let controlUsuarioPartido = new Set();

  const fechaFormateada = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Procesar porras
  for (let porra of porras) {
    
    let texto = `## 🕒 ${fechaFormateada}\n\n`;

    for (let match of partidosNuevos) {
      const { id, fase, g1, g2, p1, p2, team1, team2 } = match;

      texto += `**Final del partido:** ${team1} ${g1}`;
      if (p1 !== null) texto += ` (${p1})`;
      texto += ` - `;
      if (p2 !== null) texto += `(${p2}) `;
      texto += `${g2} ${team2}\n\n`;

      // 🔥 Leer desglose existente de la porra (una sola vez por porra)
      const refPorra = db.collection("porras").doc(porra.id);
      const porraDoc = await refPorra.get();
      const dataPorra = porraDoc.data() || {};

      let desglose = dataPorra.desglose_puntos || {};
      for (let uid of porra.miembros) {
        const user = usersMap[uid];
        const pred = predicciones[uid]?.[fase]?.[id];

        if (!pred) continue;

        const res = calcularPuntos(
          { g1, g2, p1, p2 },
          pred,
          fase
        );

        console.log("Puntos sumados: ")
        console.log(uid, res);

        if (res.puntos > 0) {
          texto += `${user.nombre}: +${res.puntos} puntos por ${res.aciertos.join(", ")}\n`;
        } else {
          texto += `${user.nombre}: No ha obtenido ningún punto. \n`;
        }

        // 🔥 CLAVE: evitar duplicar por usuario+partido
        const key = `${uid}_${id}`;
        if (!controlUsuarioPartido.has(key)) {
          controlUsuarioPartido.add(key);

          if (!puntosPorUsuario[uid]) {
            puntosPorUsuario[uid] = 0;
          }

          puntosPorUsuario[uid] += res.puntos;

          // 🔥 NUEVO: actualizar desglose
          if (!desglose[uid]) {
            desglose[uid] = {};
          }

          desglose[uid][id] = res.puntos; // id = partido
        }
      }

      // 🔥 Guardar desglose actualizado (una sola escritura)
      await refPorra.set(
        {
          desglose_puntos: desglose
        },
        { merge: true }
      );
      texto += `\n`;
      console.log("Porra: ", porra.nombre, texto);
    }

    await db
      .collection("actividad")
      .doc(porra.id)
      .collection("logs")
      .add({
        timestamp: new Date(),
        texto
      });
  }

  // 🔥 ESCRITURA OPTIMIZADA (una vez por usuario)
  const batch = db.batch();

  for (let uid in puntosPorUsuario) {
    const ref = db.collection("usuarios").doc(uid);

    batch.update(ref, {
      puntos: admin.firestore.FieldValue.increment(puntosPorUsuario[uid])
    });
  }

  await batch.commit();
}

const mapaCruces = {
  73: { nextMatchId: 90, slot: "Pais1" },
  74: { nextMatchId: 89, slot: "Pais1" },
  75: { nextMatchId: 90, slot: "Pais2" },
  76: { nextMatchId: 91, slot: "Pais1" },
  77: { nextMatchId: 89, slot: "Pais2" },
  78: { nextMatchId: 91, slot: "Pais2" },
  79: { nextMatchId: 92, slot: "Pais1" },
  80: { nextMatchId: 92, slot: "Pais2" },
  81: { nextMatchId: 94, slot: "Pais1" },
  82: { nextMatchId: 94, slot: "Pais2" },
  83: { nextMatchId: 93, slot: "Pais1" },
  84: { nextMatchId: 93, slot: "Pais2" },
  85: { nextMatchId: 96, slot: "Pais1" },
  86: { nextMatchId: 95, slot: "Pais1" },
  87: { nextMatchId: 96, slot: "Pais2" },
  88: { nextMatchId: 95, slot: "Pais2" },

  89: { nextMatchId: 97, slot: "Pais1" },
  90: { nextMatchId: 97, slot: "Pais2" },
  91: { nextMatchId: 99, slot: "Pais1" },
  92: { nextMatchId: 99, slot: "Pais2" },
  93: { nextMatchId: 98, slot: "Pais1" },
  94: { nextMatchId: 98, slot: "Pais2" },
  95: { nextMatchId: 100, slot: "Pais1" },
  96: { nextMatchId: 100, slot: "Pais2" },

  97: { nextMatchId: 101, slot: "Pais1" },
  98: { nextMatchId: 101, slot: "Pais2" },
  99: { nextMatchId: 102, slot: "Pais1" },
  100: { nextMatchId: 102, slot: "Pais2" },

  // semifinales
  101: {
    final: { matchId: 104, slot: "Pais1" },
    tercer: { matchId: 103, slot: "Pais1" }
  },
  102: {
    final: { matchId: 104, slot: "Pais2" },
    tercer: { matchId: 103, slot: "Pais2" }
  }
};


function getGanadorPerdedor(match) {
  const { team1, team2, g1, g2, p1, p2 } = match;
  let ganador, perdedor;
  if (g1 > g2) {
    ganador = team1;
    perdedor = team2;
  } else if (g2 > g1) {
    ganador = team2;
    perdedor = team1;
  } else {
    // empate → penaltis
    if (p1 > p2) {
      ganador = team1;
      perdedor = team2;
    } else {
      ganador = team2;
      perdedor = team1;
    }
  }
  return { ganador, perdedor };
}


async function actualizarPartidosReales(partidosNuevos) {
  const db = admin.firestore();
  const batch = db.batch();

  for (let match of partidosNuevos) {
    const { id, g1, g2, p1, p2, fase } = match;

    const ref = db.collection("partidos").doc(String(id));

    // 1️⃣ Actualizar resultado
    batch.update(ref, {
      g1,
      g2,
      p1,
      p2
    });

    // 2️⃣ Si NO es eliminatoria → skip
    if (fase === "grupos" || fase === "tercer" || fase === "final") {
      continue;
    }

    // 3️⃣ Calcular ganador/perdedor
    const { ganador, perdedor } = getGanadorPerdedor(match);

    const config = mapaCruces[id];
    if (!config) continue;

    // 🔥 CASO NORMAL (octavos, cuartos, etc)
    if (config.nextMatchId) {
      const nextRef = db.collection("partidos").doc(String(config.nextMatchId));

      batch.update(nextRef, {
        [config.slot]: ganador
      });
    }

    // 🔥 CASO SEMIFINALES
    if (config.final && config.tercer) {
      const finalRef = db.collection("partidos").doc(String(config.final.matchId));
      const tercerRef = db.collection("partidos").doc(String(config.tercer.matchId));

      // ganador → final
      batch.update(finalRef, {
        [config.final.slot]: ganador
      });

      // perdedor → tercer puesto
      batch.update(tercerRef, {
        [config.tercer.slot]: perdedor
      });
    }
  }

  await batch.commit();
}


async function main(){

  const db = admin.firestore();
  // 1. Obtener partidos
  const matches = await getAllMatches();

  // 2. Leer procesados
  const procDoc = await db.collection("config").doc("procesados").get();

  let procesados = [];
  if (procDoc.exists) {
    procesados = procDoc.data().ids || [];
  }

  console.log("Partidos ya procesados: ", procesados);

  const partidosNuevos = await obtenerPartidosNuevos(matches, procesados);
  console.log(partidosNuevos);

  if (partidosNuevos.length === 0) {
    console.log("No hay partidos nuevos");
    return;
  }

  actualizarPartidosReales(partidosNuevos);
  actualizarActividad(partidosNuevos);

  // Añadir partidos procesados a la variable de firestore
  const nuevosIds = partidosNuevos.map(p => p.id);
  const actualizados = [...new Set([...procesados, ...nuevosIds])];

  await db.collection("config").doc("procesados").set({
    ids: actualizados
  });
}

main();
// actualizarActividad([
//   {
//     id: "1",
//     fase: "grupos",
//     g1: 2,
//     g2: 1,
//     p1: null,
//     p2: null,
//     team1: "México",
//     team2: "Sudáfrica"
//   }
// ]);

// const real = { g1: 3, g2: 3, p1: 1, p2: 0 };
// const pred = { g1: 2, g2: 2, w: 0 };

// console.log(calcularPuntos(real, pred, "grupos"));

// getAllMatches();