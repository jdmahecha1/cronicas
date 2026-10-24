import { checkCollection } from './integrity';
import { sagaSchema, type Saga } from './schema';

const files = import.meta.glob('../content/sagas/*.json', { eager: true, import: 'default' });

/** Carga y valida todas las sagas. Si un archivo está mal, la compilación falla con el motivo. */
export function loadSagas(source: Record<string, unknown> = files): Saga[] {
  const sagas = Object.entries(source).map(([path, raw]) => {
    const parsed = sagaSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
      throw new Error(`Contenido inválido en ${path}:\n${issues.join('\n')}`);
    }
    return parsed.data;
  });
  const problems = checkCollection(sagas);
  if (problems.length) throw new Error(`Referencias rotas en el contenido:\n${problems.join('\n')}`);
  return sagas.sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

let cached: Saga[] | undefined;

/** Se carga una sola vez por compilación. */
export function getSagas(): Saga[] {
  cached ??= loadSagas();
  return cached;
}

export function getSaga(id: string): Saga | undefined {
  return getSagas().find((s) => s.id === id);
}
