const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function getMatchResult() {
  const url = "https://es.wikipedia.org/w/api.php?action=parse&page=Anexo:Segunda_ronda_de_la_clasificación_de_UEFA_para_la_Copa_Mundial_de_Fútbol_de_2026&format=json";

  const res = await fetch(url);
  const data = await res.json();

  const html = data.parse.text["*"];

  const $ = cheerio.load(html);

  let result = null;

  $('table').each((i, table) => {
    const text = $(table).text();

    if (
      text.includes("Italia") &&
      text.includes("Irlanda del Norte")
    ) {
      const match = text.match(/\d+\s*-\s*\d+/);

      if (match) {
        result = match[0];
      }
    }
  });

  console.log("Resultado:", result);
}

getMatchResult();