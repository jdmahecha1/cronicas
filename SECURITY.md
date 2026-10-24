# Seguridad

Crónicas es un sitio estático: no tiene servidor, base de datos, cuentas ni claves. Lo único que guarda es tu progreso, y solo en tu navegador (`localStorage`).

## Medidas

- **Política de seguridad de contenido (CSP)** en cada página: solo se ejecutan los scripts del propio sitio, verificados por hash; sin `eval`, sin plugins (`object-src 'none'`) y sin formularios hacia otros sitios.
- **Sin HTML de terceros**: Astro y React escapan todo el texto. La búsqueda filtra sus extractos para admitir solo `<mark>` y solo enlaza a rutas internas (`src/lib/search.ts`, con pruebas).
- **Datos del navegador tratados como no confiables**: el progreso leído de `localStorage` se valida y se recorta a rangos válidos antes de usarse.
- **Dependencias**: `npm audit` en cada ejecución de CI y Dependabot mensual. Las acciones de GitHub están fijadas a un commit concreto.
- **Workflows con permisos mínimos**: lectura por defecto; solo el job de publicación puede escribir en Pages.

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, repórtalo de forma privada desde la pestaña **Security → Report a vulnerability** del repositorio, en lugar de abrir un issue público.
