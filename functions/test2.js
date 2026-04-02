const cheerio = require("cheerio");

// En Node 18+ no necesitas node-fetch
// pero si quieres usarlo:
// const fetch = require("node-fetch");

async function getAllMatches() {
  try {
    const url =
      "https://es.wikipedia.org/w/api.php?action=parse&page=Copa_Mundial_de_F%C3%BAtbol_de_2022&format=json";

    const res = await fetch(url);
    const data = await res.json();

    // ✅ AQUÍ defines html
    const html = data.parse.text["*"];

    // ✅ AQUÍ defines $
    const $ = cheerio.load(html);

    const matches = [];

    $("table.collapsible").each((i, table) => {
      const tds = $(table).find("td");

      // Evitar tablas raras
      if (tds.length < 3) return;

      const team1 = $(tds[1]).text().trim();
      const team2 = $(tds[3]).text().trim();
      const date = $(tds[0]).text().trim();

      const resultCell = $(tds[2]);
      const divs = resultCell.find("div");

      let g1 = null;
      let g2 = null;
      let p1 = null;
      let p2 = null;

      divs.each((i, div) => {
        const text = $(div).text().replace(/\s+/g, " ").trim();

        // Resultado principal
        if (g1 === null) {
          const match = text.match(/\b(\d{1,2}):(\d{1,2})\b/);
          if (match) {
            g1 = parseInt(match[1]);
            g2 = parseInt(match[2]);
          }
        }

        // Penaltis
        const penMatch = text.match(/\((\d{1,2}):(\d{1,2})\s*p\.\)/);
        if (penMatch) {
          p1 = parseInt(penMatch[1]);
          p2 = parseInt(penMatch[2]);
        }
      });

      matches.push({
        team1,
        team2,
        date,
        g1,
        g2,
        p1,
        p2,
      });
    });

    console.log("TOTAL partidos detectados:", matches.length);

    matches.forEach((m, i) => {
      console.log(
        `${i + 1}. ${m.team1} vs ${m.team2} | ${m.g1}:${m.g2} | pen: ${m.p1}:${m.p2}`
      );
    });
  } catch (err) {
    console.error(err);
  }
}

getAllMatches();