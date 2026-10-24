import { z } from 'zod';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Debe ser un slug en minúsculas con guiones');

/** Momento de la historia en el que se descubre algo: juego + índice de etapa. */
export const markerSchema = z.object({
  game: slug,
  chapter: z.number().int().min(0),
});

export const RELATION_KINDS = ['aliado', 'enemigo', 'familia', 'romance', 'mentor', 'rival'] as const;

export const gameSchema = z.object({
  id: slug,
  title: z.string().min(1),
  year: z.number().int().min(1980).max(2100),
  chapters: z.array(z.string().min(1)).min(1),
});

export const characterSchema = z.object({
  id: slug,
  name: z.string().min(1),
  role: z.string().min(1),
  intro: z.string().min(1),
  /** Si falta, el personaje se conoce desde el principio (portada, publicidad). */
  appears: markerSchema.optional(),
  reveals: z.array(z.object({ text: z.string().min(1), at: markerSchema })).default([]),
});

export const eventSchema = z.object({
  id: slug,
  title: z.string().min(1),
  date: z.string().min(1),
  /** Orden cronológico dentro del universo (no de lanzamiento). */
  order: z.number(),
  branch: z.string().min(1).optional(),
  at: markerSchema,
  text: z.string().min(1),
  characters: z.array(slug).default([]),
  major: z.boolean().default(false),
});

export const relationSchema = z.object({
  from: slug,
  to: slug,
  kind: z.enum(RELATION_KINDS),
  detail: z.string().min(1),
  at: markerSchema,
});

export const sagaSchema = z.object({
  id: slug,
  title: z.string().min(1),
  tagline: z.string().min(1).max(100),
  studio: z.string().min(1),
  genre: z.string().min(1),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  synopsis: z.string().min(1),
  games: z.array(gameSchema).min(1),
  characters: z.array(characterSchema).min(1),
  events: z.array(eventSchema).min(1),
  relations: z.array(relationSchema).default([]),
});

export type Marker = z.infer<typeof markerSchema>;
export type Game = z.infer<typeof gameSchema>;
export type Character = z.infer<typeof characterSchema>;
export type LoreEvent = z.infer<typeof eventSchema>;
export type Relation = z.infer<typeof relationSchema>;
export type RelationKind = (typeof RELATION_KINDS)[number];
export type Saga = z.infer<typeof sagaSchema>;
