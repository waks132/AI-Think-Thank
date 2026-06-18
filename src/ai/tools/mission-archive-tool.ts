'use server';
/**
 * @fileOverview A Genkit tool for querying the mission archives in Firestore.
 */

import { ai } from '@/ai/genkit';
import { searchCollection, isFirebaseEnabled } from '@/services/firestore-service';
import { searchArchives } from '@/services/local-archive-service';
import { z } from 'genkit';

// Simplified schema for the output to avoid overwhelming the model
const MissionArchiveSchema = z.object({
  id: z.string().describe('The unique identifier of the archived mission.'),
  missionText: z.string().describe('The original mission statement.'),
  createdAt: z.string().describe('The timestamp when the mission was archived.'),
  executiveSummary: z.string().describe('The executive summary of the mission outcome.'),
  reasoning: z.string().describe('The reasoning provided for the final synthesis.'),
});

export const queryMissionArchiveTool = ai.defineTool(
  {
    name: 'queryMissionArchiveTool',
    description: "Searches the mission archives stored in Firestore. Use this to find information about past missions, their outcomes, and the reasoning behind them. This helps in learning from past experiences to inform current tasks.",
    inputSchema: z.object({
      query: z.string().describe('Keywords or phrases to search for in the mission archives. Be specific to get relevant results.'),
    }),
    outputSchema: z.array(MissionArchiveSchema).describe("A list of archived missions that match the query."),
  },
  async (input) => {
    console.log(`[Mission Archive Tool] Querying for: "${input.query}"`);
    // Route selon le mode : Firestore si activé, sinon archive locale (fichiers).
    const results = isFirebaseEnabled()
      ? await searchCollection<any>('mission-archives', input.query)
      : await searchArchives(input.query);
    console.log(`[Mission Archive Tool] Found ${results.length} results.`);

    // Bornage (perf) : 5 missions max, champs longs tronqués.
    const trunc = (s: string, n = 800) => (s && s.length > n ? s.slice(0, n) + '…' : s);
    return results.slice(0, 5).map((doc) => ({
      id: String(doc.id ?? 'unknown'),
      missionText: trunc(doc.missionText ?? 'N/A', 400),
      createdAt: doc.createdAt ?? '',
      executiveSummary: trunc(doc.result?.executiveSummary ?? 'N/A'),
      reasoning: trunc(doc.result?.reasoning ?? 'N/A'),
    }));
  }
);