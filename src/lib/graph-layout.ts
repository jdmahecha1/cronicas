import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { Saga } from './schema';

export interface LayoutNode extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
  degree: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: Map<string, LayoutNode>;
}

/**
 * Posiciones fijas para el grafo, calculadas con TODAS las relaciones: así los
 * nodos no saltan de sitio cuando el jugador avanza y se revelan conexiones nuevas.
 * Es determinista (sin Math.random) para que el HTML del servidor y el cliente coincidan.
 */
export function layoutGraph(saga: Saga, width = 640, height = 500): GraphLayout {
  const degree = new Map<string, number>();
  for (const r of saga.relations) {
    degree.set(r.from, (degree.get(r.from) ?? 0) + 1);
    degree.set(r.to, (degree.get(r.to) ?? 0) + 1);
  }

  // Semilla en espiral (filotaxis): reparte los nodos sin aleatoriedad.
  const nodes: LayoutNode[] = saga.characters.map((c, i) => {
    const radius = 22 * Math.sqrt(i + 0.5);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return {
      id: c.id,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
      degree: degree.get(c.id) ?? 0,
    };
  });

  const links: SimulationLinkDatum<LayoutNode>[] = saga.relations.map((r) => ({
    source: r.from,
    target: r.to,
  }));

  const simulation = forceSimulation(nodes)
    .randomSource(mulberry32(saga.id.length * 7919))
    .force('link', forceLink<LayoutNode, SimulationLinkDatum<LayoutNode>>(links).id((n) => n.id).distance(105).strength(0.5))
    .force('charge', forceManyBody().strength(-420))
    .force('collide', forceCollide<LayoutNode>().radius(44))
    .force('center', forceCenter(width / 2, height / 2))
    .stop();

  for (let i = 0; i < 400; i++) simulation.tick();

  // Encaja el resultado en el lienzo con margen para las etiquetas.
  const margin = 56;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min(
    (width - margin * 2) / Math.max(maxX - minX, 1),
    (height - margin * 2) / Math.max(maxY - minY, 1),
  );
  for (const n of nodes) {
    n.x = Math.round(margin + (n.x - minX) * scale + ((width - margin * 2) - (maxX - minX) * scale) / 2);
    n.y = Math.round(margin + (n.y - minY) * scale + ((height - margin * 2) - (maxY - minY) * scale) / 2);
  }

  return { width, height, nodes: new Map(nodes.map((n) => [n.id, n])) };
}

/** Generador pseudoaleatorio pequeño con semilla, para que d3 sea reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
