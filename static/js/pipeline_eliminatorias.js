/* =========================================================
   PIPELINE ELIMINATORIAS MUNDIAL
   ========================================================= */

export function generarCuadroEliminatorias(grupos, combinaciones, emparejamientos) {

  const clasificaciones = calcularTodasLasClasificaciones(grupos);

  const tercerosInfo = obtenerMejoresTerceros(clasificaciones);

  const mapaCodigos = construirMapaCodigos(clasificaciones, tercerosInfo);

  aplicarCombinacionTerceros(mapaCodigos, tercerosInfo, combinaciones);

  const cuadro = construirPartidosEliminatorios(mapaCodigos, emparejamientos);

  return cuadro;
}


function calcularClasificacion(partidos) {

  const tabla = {};

  partidos.forEach(p => {

    if (p.g1 == null || p.g2 == null) return;

    tabla[p.Pais1] ??= { pts:0,g:0,e:0,p:0,gf:0,gc:0 };
    tabla[p.Pais2] ??= { pts:0,g:0,e:0,p:0,gf:0,gc:0 };

    tabla[p.Pais1].gf += p.g1;
    tabla[p.Pais1].gc += p.g2;

    tabla[p.Pais2].gf += p.g2;
    tabla[p.Pais2].gc += p.g1;

    if (p.g1 > p.g2) {
      tabla[p.Pais1].pts += 3; tabla[p.Pais1].g++;
      tabla[p.Pais2].p++;
    }
    else if (p.g2 > p.g1) {
      tabla[p.Pais2].pts += 3; tabla[p.Pais2].g++;
      tabla[p.Pais1].p++;
    }
    else {
      tabla[p.Pais1].pts++; tabla[p.Pais2].pts++;
      tabla[p.Pais1].e++;   tabla[p.Pais2].e++;
    }

  });

  return Object.entries(tabla)
    .map(([equipo,t]) => ({ equipo, ...t, dg:t.gf - t.gc }))
    .sort((a,b)=>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf
    );
}

function calcularTodasLasClasificaciones(grupos) {

  const res = {};

  for (const nombre in grupos) {
    res[nombre] = calcularClasificacion(grupos[nombre]);
  }

  return res;
}

function obtenerMejoresTerceros(clasifs) {

  const terceros = [];

  for (const grupo in clasifs) {

    const tercero = clasifs[grupo][2];

    if (tercero) {
      terceros.push({
        ...tercero,
        grupo: grupo.replace("Grupo ", "")
      });
    }
  }

  terceros.sort((a,b)=>
    b.pts - a.pts ||
    b.dg - a.dg ||
    b.gf - a.gf
  );

  return terceros.slice(0,8);
}

function construirMapaCodigos(clasifs, terceros) {

  const mapa = {};

  for (const grupo in clasifs) {

    const letra = grupo.replace("Grupo ", "");

    const tabla = clasifs[grupo];

    if (tabla[0]) mapa["1"+letra] = tabla[0].equipo;
    if (tabla[1]) mapa["2"+letra] = tabla[1].equipo;

    const tercero = tabla[2];

    if (terceros.find(t => t.equipo === tercero?.equipo)) {
      mapa["3"+letra] = tercero.equipo;
    }
  }

  return mapa;
}

function aplicarCombinacionTerceros(mapa, terceros, combinaciones) {

  const gruposTerceros = terceros
    .map(t => "3" + t.grupo)
    .sort()
    .join(",");

  const combinacion = combinaciones.find(c => {

    const valores = Object.values(c)
      .filter(v => v.startsWith("3"))
      .sort()
      .join(",");

    return valores === gruposTerceros;
  });

  if (!combinacion) {
    console.warn("No se encontró combinación de terceros");
    return;
  }

  for (const clave in combinacion) {

    if (!clave.startsWith("X")) continue;

    const codigoTercero = combinacion[clave];

    mapa[clave] = mapa[codigoTercero];
  }
}

function construirPartidosEliminatorios(mapa, emparejamientos) {

  const partidos = {};

  emparejamientos.forEach(e => {

    const p1 = resolverCodigo(e.pais1, mapa, partidos);
    const p2 = resolverCodigo(e.pais2, mapa, partidos);

    partidos[e.Numero] = {
      Numero: e.Numero,
      Pais1: p1,
      Pais2: p2,
      g1: null,
      g2: null
    };
  });

  return partidos;
}

function resolverCodigo(cod, mapa, partidos) {

  if (!cod) return null;

  if (mapa[cod]) return mapa[cod];

  if (cod.startsWith("W")) {
    return partidos[cod.slice(1)]?.ganador ?? null;
  }

  if (cod.startsWith("L")) {
    return partidos[cod.slice(1)]?.perdedor ?? null;
  }

  return null;
}

export function actualizarResultado(partidos, numero, g1, g2) {

  const p = partidos[numero];

  p.g1 = g1;
  p.g2 = g2;

  if (g1 > g2) {
    p.ganador = p.Pais1;
    p.perdedor = p.Pais2;
  } else if (g2 > g1) {
    p.ganador = p.Pais2;
    p.perdedor = p.Pais1;
  }
}