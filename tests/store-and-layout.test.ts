// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSagas } from '../src/lib/data';
import { layoutGraph } from '../src/lib/graph-layout';

describe('progress-store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('parseState tolera JSON roto o con forma inesperada', async () => {
    const { parseState, DEFAULT_STATE } = await import('../src/lib/progress-store');
    expect(parseState(null)).toBe(DEFAULT_STATE);
    expect(parseState('{no es json')).toBe(DEFAULT_STATE);
    expect(parseState('{"shield":false,"sagas":[1,2]}')).toEqual({ shield: false, sagas: {} });
  });

  it('guarda el progreso, avisa a los suscriptores y sobrevive a una recarga', async () => {
    const store = await import('../src/lib/progress-store');
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setSagaProgress('mass-effect', { me1: 2 });
    store.setShield(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();

    vi.resetModules();
    const reloaded = await import('../src/lib/progress-store');
    expect(reloaded.getState()).toEqual({ shield: false, sagas: { 'mass-effect': { me1: 2 } } });
  });

  it('resetSaga borra solo esa saga', async () => {
    const store = await import('../src/lib/progress-store');
    store.setSagaProgress('a', { x: 1 });
    store.setSagaProgress('b', { y: 1 });
    store.resetSaga('a');
    expect(store.getState().sagas).toEqual({ b: { y: 1 } });
  });

  it('sigue funcionando si localStorage lanza errores (modo privado)', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const store = await import('../src/lib/progress-store');
    expect(() => store.setShield(false)).not.toThrow();
    expect(store.getState().shield).toBe(false);
    spy.mockRestore();
  });
});

describe('layoutGraph', () => {
  const sagas = getSagas();

  it('es determinista: el HTML del servidor y del cliente coinciden', () => {
    for (const saga of sagas) {
      const a = [...layoutGraph(saga).nodes.values()].map((n) => [n.x, n.y]);
      const b = [...layoutGraph(saga).nodes.values()].map((n) => [n.x, n.y]);
      expect(a).toEqual(b);
    }
  });

  it('todos los nodos quedan dentro del lienzo y no se superponen', () => {
    for (const saga of sagas) {
      const { width, height, nodes } = layoutGraph(saga);
      const list = [...nodes.values()];
      for (const n of list) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(width);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeLessThanOrEqual(height);
      }
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++)
          expect(Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y), saga.id).toBeGreaterThan(20);
    }
  });
});
