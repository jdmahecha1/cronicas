/**
 * Defensa en profundidad para los resultados de Pagefind. El índice lo genera el
 * propio sitio, pero el extracto se inserta como HTML: solo se deja pasar <mark>.
 */
export function safeExcerpt(html: string): string {
  return html.replace(/<(?!\/?mark>)[^>]*>?/gi, '');
}

/** Solo rutas internas del sitio: nada de javascript:, data: ni dominios externos. */
export function safeResultUrl(url: string): string | null {
  return /^\/(?!\/)[^\s"'<>\\]*$/.test(url) ? url : null;
}
