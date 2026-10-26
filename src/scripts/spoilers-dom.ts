import { getState, subscribe } from '../lib/progress-store';

/**
 * Activa los bloques <Spoiler> renderizados por Astro. El texto real está en un
 * <template>, así que sin JavaScript (o sin progreso) nunca llega a mostrarse.
 */
function isRevealed(el: HTMLElement): boolean {
  if (el.dataset.forced === 'true') return true;
  const state = getState();
  if (!state.shield) return true;
  const done = state.sagas[el.dataset.saga ?? '']?.[el.dataset.game ?? ''];
  // Misma regla que sanitizeProgress: valores manipulados (1.5, Infinity) no revelan de más.
  return typeof done === 'number' && Number.isFinite(done) && Math.trunc(done) > Number(el.dataset.chapter);
}

function update(el: HTMLElement) {
  const body = el.querySelector<HTMLElement>(':scope > [data-spoiler-body]');
  const template = el.querySelector<HTMLTemplateElement>(':scope > template');
  if (!body || !template) return;
  const revealed = isRevealed(el);
  const wasRevealed = el.dataset.revealed === 'true';
  if (revealed && !wasRevealed) {
    body.append(template.content.cloneNode(true));
    body.hidden = false;
    el.dataset.revealed = 'true';
    // Puede haber spoilers anidados (un personaje oculto con datos aún más tardíos).
    process(body);
  } else if (!revealed && wasRevealed) {
    body.replaceChildren();
    body.hidden = true;
    el.dataset.revealed = 'false';
  }
}

/**
 * El contenido de un <template> no forma parte del DOM, así que aquí solo aparecen
 * los spoilers de primer nivel y los que están dentro de un bloque ya revelado.
 */
function process(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-spoiler]').forEach(update);
  updateFogGroups();
}

/** Spoilers de primer nivel de un grupo (sin contar los anidados dentro de cada uno). */
function groupItems(group: HTMLElement): HTMLElement[] {
  return [...group.querySelectorAll<HTMLElement>(':scope > ul > [data-spoiler], :scope > ol > [data-spoiler]')];
}

/** Cada grupo de niebla resume cuántos elementos siguen ocultos dentro de él. */
function updateFogGroups() {
  document.querySelectorAll<HTMLElement>('[data-fog-group]').forEach((group) => {
    const count = groupItems(group).filter((el) => el.dataset.revealed !== 'true').length;
    const summary = group.querySelector<HTMLElement>(':scope > [data-fog-summary]');
    const label = group.querySelector<HTMLElement>('[data-fog-count]');
    if (label) label.textContent = `${count} ${count === 1 ? group.dataset.singular : group.dataset.plural}`;
    if (summary) summary.hidden = count === 0;
  });
}

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const groupButton = target.closest<HTMLElement>('[data-fog-reveal]');
  const group = groupButton?.closest<HTMLElement>('[data-fog-group]');
  if (group) {
    const items = groupItems(group).filter((el) => el.dataset.revealed !== 'true');
    for (const el of items) {
      el.dataset.forced = 'true';
      update(el);
    }
    updateFogGroups();
    items[0]?.querySelector<HTMLElement>(':scope > [data-spoiler-body]')?.focus();
    return;
  }
  const button = target.closest<HTMLElement>('[data-spoiler-reveal]');
  const el = button?.closest<HTMLElement>('[data-spoiler]');
  if (!el) return;
  el.dataset.forced = 'true';
  update(el);
  updateFogGroups();
  el.querySelector<HTMLElement>(':scope > [data-spoiler-body]')?.focus();
});

process(document);
subscribe(() => process(document));
