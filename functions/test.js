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

admin.initializeApp();
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

  // ordenar por id
  matches
    .filter((m) => m.id !== undefined)
    .sort((a, b) => a.id - b.id)
    .forEach((m) => {
      console.log(
        `Match ${m.id}: ${m.team1} vs ${m.team2} | g1:${m.g1} g2:${m.g2} p1:${m.p1} p2:${m.p2}`
      );
    });
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


async function actualizarActividad(partidosNuevos) {
  const db = admin.firestore();

  const now = new Date().toISOString();

  // 1. Leer todas las porras
  const porrasSnap = await db.collection("porras").get();

  let porras = [];
  let userSet = new Set();

  porrasSnap.forEach(doc => {
    const data = doc.data();
    porras.push({ id: doc.id, ...data });

    data.miembros.forEach(uid => userSet.add(uid));
  });

  const userIds = Array.from(userSet);

  // 2. Leer usuarios UNA VEZ
  const usersSnap = await db.getAll(
    ...userIds.map(uid => db.collection("usuarios").doc(uid))
  );

  let usersMap = {};
  usersSnap.forEach(doc => {
    usersMap[doc.id] = doc.data();
  });

  console.log(usersMap);

  // 3. Leer predicciones UNA VEZ por usuario + fase
  let predicciones = {}; // { uid: { fase: { matchId: pred } } }

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
        const data = snap.data(); // { "57": {g1, g2, w}, ... }

        // ⚡ SOLO nos quedamos con los partidos necesarios
        for (let match of partidosNuevos) {
          if (match.fase !== fase) continue;

          const pred = data[match.id];
          console.log(pred);

          if (pred) {
            predicciones[uid][fase][match.id] = pred;
          }
        }
      }
    }
  }

  console.log(predicciones);

  // 4. Procesar porras
  for (let porra of porras) {
    let texto = `## 🕒 ${now}\n\n`;

    for (let match of partidosNuevos) {
      const { id, fase, g1, g2, p1, p2, team1, team2 } = match;

      // Cabecera partido
      texto += `**Final del partido:** ${team1} ${g1}`;
      if (p1 !== null) texto += ` (${p1})`;
      texto += ` - `;
      if (p2 !== null) texto += `(${p2}) `;
      texto += `${g2} ${team2}\n\n`;

      // Jugadores
      for (let uid of porra.miembros) {
        const user = usersMap[uid];
        const pred =
          predicciones[uid]?.[fase]?.[id];

        if (!pred) continue;

        const res = calcularPuntos(
          { g1, g2, p1, p2 },
          pred,
          fase
        );

        if (res.puntos > 0) {
          texto += `${user.nombre}: +${res.puntos} puntos por ${res.aciertos.join(", ")}\n`;
        }
      }

      texto += `\n`;
      console.log(texto);
    }

    // 5. Guardar log (subcolección)
    await db
      .collection("actividad")
      .doc(porra.id)
      .collection("logs")
      .add({
        timestamp: new Date(),
        texto
      });
  }
}

actualizarActividad([
  {
    id: "1",
    fase: "grupos",
    g1: 2,
    g2: 1,
    p1: null,
    p2: null,
    team1: "México",
    team2: "Sudáfrica"
  }
]);

// const real = { g1: 3, g2: 3, p1: 1, p2: 0 };
// const pred = { g1: 2, g2: 2, w: 0 };

// console.log(calcularPuntos(real, pred, "grupos"));

// getAllMatches();