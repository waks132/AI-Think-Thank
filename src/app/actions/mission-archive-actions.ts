'use server';
/**
 * Server action pour archiver une mission. Route automatiquement vers le bon
 * stockage : Firestore si Firebase est activé, sinon l'archive locale (fichiers).
 * Appelable depuis les composants client (ex. le dashboard).
 */
import { isFirebaseEnabled, addDocument } from '@/services/firestore-service';
import { addArchive } from '@/services/local-archive-service';

export async function archiveMission(data: Record<string, any>): Promise<string> {
  if (isFirebaseEnabled()) {
    return addDocument('mission-archives', data);
  }
  return addArchive(data);
}
