// ATFM Dashboard v1.2 — app.ui.js
(function () {
  const S = window.APP_STATE;
  const U = window.APP_UTILS;

  function poblarFiltroAerolinea() {
    const select = document.getElementById('filtroAerolinea');
    const aerolineas = new Set();
    if (S.idx.AERO >= 0) {
      S.data.rows.forEach(fila => {
        const val = fila[S.idx.AERO];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          aerolineas.add(String(val).trim());
        }
      });
    }
    select.innerHTML = `<option value="">Todas</option>` +
      Array.from(aerolineas).sort().map(a => `<option value="${U.escapeHtml(a)}">${U.escapeHtml(a)}</option>`).join('');
  }

  function poblarFiltroHora() {
    const select = document.getElementById('filtroHora');
    select.innerHTML = `<option value="">Todas</option>` +
      Array.from({ length: 24 }, (_, h) => `<option value="${h}">${U.pad2(h)}:00</option>`).join('');
  }

  function bindEventos() {
    const selA = document.getElementById('filtroAerolinea');
    const selH = document.getElementById('filtroHora');
    const selT = document.getElementById('filtroTipo');
    const btnL = document.getElementById('btnLimpiar');

    selA.addEventListener('change', () => {
      S.filters.airline = selA.value;
      window.APP_MAIN.procesarYRender();
    });

    selT.addEventListener('change', () => {
      S.filters.tipo = selT.value;
      window.APP_MAIN.procesarYRender();
    });

    selH.addEventListener('change', () => {
      const val = selH.value;
      S.selectedHour = val === '' ? null : parseInt(val, 10);
      S.selectedQuarter = null;
      window.APP_MAIN.procesarYRender();
    });

    btnL.addEventListener('click', () => {
      S.selectedHour = null;
      S.selectedQuarter = null;
      S.filters.airline = '';
      S.filters.tipo = '';
      selH.value = '';
      selA.value = '';
      selT.value = '';
      window.APP_MAIN.procesarYRender();
    });
  }

  function updateTotal(llegadas, salidas, llegadas15, salidas15) {
    const totalEl = document.getElementById('total');
    let totalOps = 0;
    if (S.selectedQuarter !== null) {
      totalOps = (llegadas15[S.selectedQuarter] || 0) + (salidas15[S.selectedQuarter] || 0);
    } else if (S.selectedHour !== null) {
      totalOps = (llegadas[S.selectedHour] || 0) + (salidas[S.selectedHour] || 0);
    } else {
      totalOps = U.sum(llegadas) + U.sum(salidas);
    }
    totalEl.textContent = `Total de operaciones: ${totalOps}`;
  }

  function renderDetalle(detalle) {
    const container = document.getElementById('detalleContainer');
    const tbodyDet = document.querySelector('#tablaDetalle tbody');
    tbodyDet.innerHTML = '';

    let filas = [];
    if (S.selectedQuarter !== null) {
      const start = S.selectedQuarter * 15;
      const end = start + 15;
      filas = detalle.filter(op => op.minutos >= start && op.minutos < end);
    } else if (S.selectedHour !== null) {
      filas = detalle.filter(op => Math.floor(op.minutos / 60) === S.selectedHour);
    }

    if ((S.selectedQuarter !== null || S.selectedHour !== null) && filas.length) {
      filas.sort((a, b) => a.minutos - b.minutos || a.operacion.localeCompare(b.operacion) || a.aero.localeCompare(b.aero));
      const rowsHtml = filas.map(op => `
        <tr>
          <td>${U.escapeHtml(op.aero)}</td>
          <td>${U.escapeHtml(op.vuelo)}</td>
          <td>${op.operacion}</td>
          <td>${op.hora}</td>
          <td>${U.escapeHtml(op.orig)}</td>
          <td>${U.escapeHtml(op.dest)}</td>
        </tr>
      `).join('');
      tbodyDet.innerHTML = rowsHtml;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  window.APP_UI = { poblarFiltroAerolinea, poblarFiltroHora, bindEventos, updateTotal, renderDetalle };
})();