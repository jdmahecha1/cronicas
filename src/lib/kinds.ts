/** Sin dependencias: lo importan las islas del navegador sin arrastrar Zod al paquete. */
export const RELATION_KINDS = ['aliado', 'enemigo', 'familia', 'romance', 'mentor', 'rival'] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];
