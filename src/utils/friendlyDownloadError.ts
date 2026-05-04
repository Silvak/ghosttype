const DETAIL_MAX = 120;

function truncateDetail(message: string): string {
  const t = message.trim();
  if (t.length <= DETAIL_MAX) return t;
  return `${t.slice(0, DETAIL_MAX)}…`;
}

/**
 * User-facing download error for the options "Modelos locales" section.
 * Keeps a short technical tail for ONNX/WASM failures to aid debugging.
 */
export function friendlyDownloadError(message: string): string {
  const m = message.toLowerCase();
  const detail = truncateDetail(message);

  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Sin conexión o Hugging Face no responde. Comprueba tu red e inténtalo de nuevo.';
  }
  if (m.includes('wasm') || m.includes('onnx')) {
    return (
      'No se pudo iniciar el motor local (ONNX/WASM). Actualiza Chrome, recarga GhostType en ' +
      'chrome://extensions y vuelve a pulsar Descargar. ' +
      `Detalle: ${detail}`
    );
  }
  if (m.includes('offscreen')) {
    return 'No se pudo iniciar el motor local. Actualiza Chrome a la versión 116+ y recarga la extensión.';
  }
  return message.length > 160 ? `${message.slice(0, 160)}…` : message;
}
