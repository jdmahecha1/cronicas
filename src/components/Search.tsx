import { useEffect, useRef, useState } from 'react';
import { safeExcerpt, safeResultUrl } from '../lib/search';

interface Result {
  url: string;
  title: string;
  excerpt: string;
}

interface Pagefind {
  init: () => Promise<void>;
  debouncedSearch: (
    query: string,
    options?: object,
    ms?: number,
  ) => Promise<{ results: { data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }> }[] } | null>;
}

interface Props {
  /** Ruta base del sitio, para encontrar /pagefind/ en GitHub Pages. */
  base: string;
}

/**
 * Búsqueda estática con Pagefind: el índice se genera al compilar y solo contiene
 * texto sin spoilers (los bloques ocultos llevan data-pagefind-ignore).
 */
export default function Search({ base }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const pagefind = useRef<Pagefind | null>(null);

  async function load() {
    if (pagefind.current || status === 'unavailable') return pagefind.current;
    setStatus('loading');
    try {
      const path = `${base.replace(/\/$/, '')}/pagefind/pagefind.js`;
      const mod = (await import(/* @vite-ignore */ path)) as Pagefind;
      await mod.init();
      pagefind.current = mod;
      setStatus('ready');
      return mod;
    } catch {
      setStatus('unavailable');
      return null;
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    (async () => {
      const pf = await load();
      if (!pf) return;
      const search = await pf.debouncedSearch(term, {}, 200);
      if (!search || cancelled) return;
      const data = await Promise.all(search.results.slice(0, 12).map((r) => r.data()));
      if (cancelled) return;
      setResults(
        data.flatMap((d) => {
          const url = safeResultUrl(d.url);
          return url ? [{ url, title: d.meta.title ?? url, excerpt: safeExcerpt(d.excerpt) }] : [];
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="search">
      <label htmlFor="buscar" className="search__label">
        Busca una saga, un personaje o un lugar
      </label>
      <input
        id="buscar"
        type="search"
        className="search__input"
        placeholder="Ej.: Hyrule, Arthur Morgan, Ciri…"
        value={query}
        onFocus={load}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <p className="search__status muted" aria-live="polite">
        {status === 'unavailable'
          ? 'La búsqueda se activa en la versión compilada del sitio (npm run build).'
          : query.trim() && status === 'ready'
            ? `${results.length} resultados · el índice no incluye spoilers`
            : 'El índice de búsqueda no incluye spoilers.'}
      </p>
      <ul className="search__results">
        {results.map((r) => (
          <li key={r.url}>
            <a href={r.url}>
              <strong>{r.title.replace(/ · Crónicas$/, '')}</strong>
              {/* Extracto filtrado con safeExcerpt: solo admite <mark>. */}
              <span dangerouslySetInnerHTML={{ __html: r.excerpt }} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
