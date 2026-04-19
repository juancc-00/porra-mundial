

// lógica logs en porra.html

let logsCache = [];        // 🔥 aquí guardas TODO lo que ya cargaste
let lastVisible = null;    // último documento (para paginar)
let isLoading = false;     // evitar dobles llamadas
let noMoreLogs = false;    // saber si ya no hay más

async function cargarLogsInicial(porraId) {
  const db = firebase.firestore();

  const snapshot = await db
    .collection("actividad")
    .doc(porraId)
    .collection("logs")
    .orderBy("timestamp", "desc")
    .limit(20)
    .get();

  if (snapshot.empty) {
    noMoreLogs = true;
    return;
  }

  // Guardar último doc para paginación
  lastVisible = snapshot.docs[snapshot.docs.length - 1];

  // Convertir a array
  const nuevosLogs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // 🔥 Guardar en cache
  logsCache = nuevosLogs;

  renderLogs();
}


async function cargarMasLogs(porraId) {
  if (isLoading || noMoreLogs) return;

  isLoading = true;

  const db = firebase.firestore();

  const snapshot = await db
    .collection("actividad")
    .doc(porraId)
    .collection("logs")
    .orderBy("timestamp", "desc")
    .startAfter(lastVisible)
    .limit(20)
    .get();

  if (snapshot.empty) {
    noMoreLogs = true;
    isLoading = false;
    return;
  }

  lastVisible = snapshot.docs[snapshot.docs.length - 1];

  const nuevosLogs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // 🔥 CLAVE: append al cache (no reemplazar)
  logsCache = logsCache.concat(nuevosLogs);

  isLoading = false;

  renderLogs();
}

function renderLogs() {
  const container = document.getElementById("logs");

  container.innerHTML = "";

  // Ordenar ASC para lectura (antiguo → nuevo)
  const logsOrdenados = [...logsCache].sort(
    (a, b) => a.timestamp.seconds - b.timestamp.seconds
  );

  logsOrdenados.forEach(log => {
    const div = document.createElement("div");
    div.className = "log";

    div.innerText = log.texto;

    container.appendChild(div);
  });
}

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {
    cargarMasLogs(porraId);
  }
});