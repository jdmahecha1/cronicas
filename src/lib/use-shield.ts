import { useMemo, useSyncExternalStore } from 'react';
import { getServerState, getState, subscribe } from './progress-store';
import type { Saga } from './schema';
import { sanitizeProgress, type Shield } from './spoilers';

/** Escudo de una saga para las islas de React; se actualiza al cambiar el progreso en cualquier parte. */
export function useShield(saga: Saga): Shield {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return useMemo(
    () => ({ enabled: state.shield, progress: sanitizeProgress(saga, state.sagas[saga.id]) }),
    [state, saga],
  );
}

export function useShieldEnabled(): boolean {
  return useSyncExternalStore(subscribe, getState, getServerState).shield;
}
