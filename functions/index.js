/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

admin.initializeApp();
const db = admin.firestore();

exports.updateMatch = onSchedule("every 15 minutes", async (event) => {
    try {
      // 1. Llamada a Wikipedia API
      const url =
        "https://es.wikipedia.org/w/api.php?action=parse&page=Anexo:Segunda_ronda_de_la_clasificación_de_UEFA_para_la_Copa_Mundial_de_Fútbol_de_2026&format=json";

      const res = await fetch(url);
      const data = await res.json();

      const html = data.parse.text["*"];

      // 2. Cargar HTML con cheerio
      const $ = cheerio.load(html);

      let result = null;

      // 3. Buscar tabla del partido
      $("table").each((i, table) => {
        const text = $(table).text();

        if (
          text.includes("Suecia") &&
          text.includes("Polonia") &&
          text.includes("31 de marzo")
        ) {
          // 4. Buscar marcador o "vs."
          const scoreMatch = text.match(/\b\d{1,2}:\d{1,2}\b/);

          if (scoreMatch && !text.includes("vs.")) {
            result = scoreMatch[0];
            } else {
            result = "vs.";
          }
        }
      });

      console.log("Resultado encontrado:", result);

      // 5. Guardar en Firestore
      await db.collection("matches").doc("suecia-polonia").set({
        result: result,
        updatedAt: new Date(),
      });

      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  });
