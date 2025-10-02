// Función para cargar el TAF
async function loadTAF() {
  try {
    const response = await fetch('data/taf-today.txt');
    if (!response.ok) throw new Error('No se pudo cargar el TAF');
    const tafText = await response.text();
    document.getElementById('taf').innerText = tafText || "TAF no disponible por el momento.";
  } catch (err) {
    document.getElementById('taf').innerText = `Error: ${err.message}`;
  }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', loadTAF);
