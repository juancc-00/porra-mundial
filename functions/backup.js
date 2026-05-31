const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "porra-mundial-91819"
});

const db = admin.firestore();



async function backupPredicciones() {
  const test = await db.collection("predicciones").get();
  console.log("porras size:", test.size);

  const backup = {};

  const uidsSnap = await db.collection("usuarios").get();
  const uids = uidsSnap.docs.map(d => d.id);

  for (const uid of uids) {
    backup[uid] = {};
    const fases = ["general", "grupos", "dieciseisavos", "octavos", "cuartos", "semifinales", "final"];

    for (const fase of fases) {
      const faseSnap = await db
        .collection("predicciones")
        .doc(uid)
        .collection(fase)
        .get();

      if (faseSnap.empty) continue;

      backup[uid][fase] = {};
      faseSnap.docs.forEach(d => {
        backup[uid][fase][d.id] = d.data();
      });
    }
  }

  // Nombre del archivo con fecha y hora
  const ahora = new Date();
  const timestamp = ahora.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const nombreArchivo = `backup-predicciones-${timestamp}.json`;

  // Guardar fuera de /functions, en /backups
  const carpeta = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta);

  const rutaArchivo = path.join(carpeta, nombreArchivo);
  fs.writeFileSync(rutaArchivo, JSON.stringify(backup, null, 2), "utf8");

  console.log(`Backup guardado en: ${rutaArchivo}`);
}

backupPredicciones().catch(console.error);