// ATFM Dashboard v1.2 — app.data.js
(function () {
  const { URL_EXCEL, BASE_AIRPORT } = window.APP_CONFIG;
  const S = window.APP_STATE;
  const U = window.APP_UTILS;

  async function cargarDatos() {
    const resp = await fetch(URL_EXCEL);
    const arrayBuffer = await resp.arrayBuffer();
    const libro = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true });
    prepararDatos(data);
  }

  function prepararDatos(data) {
    const hdrIndex = data.findIndex(row =>
      Array.isArray(row) &&
      row.some(v => v && v.toString().toUpperCase().includes('ETA')) &&
      row.some(v => v && v.toString().toUpperCase().includes('ETD'))
    );
    const totalEl = document.getElementById('total');
    if (hdrIndex === -1) {
      totalEl.textContent = 'No se encontraron columnas de hora.';
      return;
    }

    S.data.header = data[hdrIndex];
    S.data.rows = data.slice(hdrIndex + 1);

    const upper = S.data.header.map(h => (h ? h.toString().toUpperCase() : ''));
    S.idx.ETA    = upper.findIndex(s => s.includes('ETA'));
    S.idx.ETD    = upper.findIndex(s => s.includes('ETD'));
    S.idx.AERO   = upper.findIndex(s => s.includes('AEROL') || s.includes('AERO LINEA') || s.includes('AIRLINE'));
    S.idx.ORIG   = upper.findIndex(s => s.includes('ORIG'));
    S.idx.DEST   = upper.findIndex(s => s.includes('DEST'));
    S.idx.ARRNUM = upper.findIndex(s => s.includes('ARR'));
    S.idx.DEPNUM = upper.findIndex(s => s.includes('DEP'));

    window.APP_UI.poblarFiltroAerolinea();
    window.APP_UI.poblarFiltroHora();
    window.APP_MAIN.procesarYRender();
  }

  // Aplica filtros, computa agregados y devuelve detalle base
  function computeAggregates() {
    const filtroAero = S.filters.airline;
    const filtroTipo = S.filters.tipo; // '', 'Llegada', 'Salida'

    const llegadas = Array(24).fill(0);
    const salidas = Array(24).fill(0);
    const llegadas15 = Array(96).fill(0);
    const salidas15 = Array(96).fill(0);
    const detalle = [];

    S.data.rows.forEach(fila => {
      if (!Array.isArray(fila)) return;

      // Filtro por aerolínea
      if (filtroAero && S.idx.AERO >= 0) {
        const val = fila[S.idx.AERO] ? String(fila[S.idx.AERO]).trim() : '';
        if (val !== filtroAero) return;
      }

      // Llegadas
      const minsETA = U.getMinutesFromCell(fila[S.idx.ETA]);
      if (minsETA !== null && (filtroTipo === '' || filtroTipo === 'Llegada')) {
        const h = Math.floor(minsETA / 60);
        const q = Math.floor(minsETA / 15);
        if (h >= 0 && h < 24) llegadas[h]++;
        if (q >= 0 && q < 96) llegadas15[q]++;
        detalle.push({
          aero: U.safeStr(fila[S.idx.AERO]),
          vuelo: U.safeStr(fila[S.idx.ARRNUM]),
          operacion: 'Llegada',
          hora: U.formatMinutes(minsETA),
          minutos: minsETA,
          orig: U.safeStr(fila[S.idx.ORIG]),
          dest: BASE_AIRPORT
        });
      }

      // Salidas
      const minsETD = U.getMinutesFromCell(fila[S.idx.ETD]);
      if (minsETD !== null && (filtroTipo === '' || filtroTipo === 'Salida')) {
        const h = Math.floor(minsETD / 60);
        const q = Math.floor(minsETD / 15);
        if (h >= 0 && h < 24) salidas[h]++;
        if (q >= 0 && q < 96) salidas15[q]++;
        detalle.push({
          aero: U.safeStr(fila[S.idx.AERO]),
          vuelo: U.safeStr(fila[S.idx.DEPNUM]),
          operacion: 'Salida',
          hora: U.formatMinutes(minsETD),
          minutos: minsETD,
          orig: BASE_AIRPORT,
          dest: U.safeStr(fila[S.idx.DEST])
        });
      }
    });

    return { llegadas, salidas, llegadas15, salidas15, detalle };
  }

  window.APP_DATA = { cargarDatos, prepararDatos, computeAggregates };
})();