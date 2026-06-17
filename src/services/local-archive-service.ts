'use server';
/**
 * @fileOverview Mémoire des missions — STOCKAGE LOCAL (fichiers).
 *
 * Équivalent local de la collection Firestore "mission-archives" : la mémoire à
 * long terme inter-sessions des agents (missions passées + résultats), utilisée
 * par queryMissionArchiveTool pour « apprendre des expériences précédentes ».
 *
 * Persistant, 100% local (aucune base externe), côté serveur via fs — comme la
 * base de connaissances. Les données vivent dans .data/mission-archives.json
 * (dossier ignoré par git).
 */
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), '.data');
const archiveFile = path.join(dataDir, 'mission-archives.json');
const MAX_ENTRIES = 200; // borne la taille du fichier

async function readAll(): Promise<any[]> {
  try {
    const raw = await fs.readFile(archiveFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // fichier absent / illisible : mémoire vide
  }
}

async function writeAll(items: any[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(archiveFile, JSON.stringify(items, null, 2), 'utf-8');
}

/** Ajoute une mission à l'archive locale. Renvoie l'id généré. */
export async function addArchive(data: Record<string, any>): Promise<string> {
  const items = await readAll();
  const id = `mission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  items.push({ id, ...data });
  await writeAll(items.slice(-MAX_ENTRIES));
  return id;
}

/**
 * Recherche dans l'archive locale. Sans requête, renvoie les missions les plus
 * récentes ; sinon filtre par inclusion (insensible à la casse), comme l'ancien
 * searchCollection Firestore.
 */
export async function searchArchives(query: string): Promise<any[]> {
  const items = await readAll();
  const q = (query || '').toLowerCase().trim();
  if (!q) return items.slice(-20).reverse();
  return items.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
}
