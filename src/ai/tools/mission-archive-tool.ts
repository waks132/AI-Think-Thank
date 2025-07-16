'use server';
/**
 * @fileOverview A Genkit tool for querying the mission archives in Firestore.
 */

import { ai } from '@/ai/genkit';
import { searchCollection } from '@/services/firestore-service';
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
    input: {
      schema: z.object({
        query: z.string().describe('Keywords or phrases to search for in the mission archives. Be specific to get relevant results.'),
      })
    },
    output: {
      schema: z.array(MissionArchiveSchema).describe("A list of archived missions that match the query."),
    },
  },
  async (input) => {
    console.log(`[Mission Archive Tool] Querying for: "${input.query}"`);
    const results = await searchCollection<any>('mission-archives', input.query);
    console.log(`[Mission Archive Tool] Found ${results.length} results.`);
    
    // Map full results to the simplified schema for the AI
    return results.map(doc => ({
      id: doc.id,
      missionText: doc.missionText,
      createdAt: doc.createdAt,
      executiveSummary: doc.result?.executiveSummary || 'N/A',
      reasoning: doc.result?.reasoning || 'N/A',
    }));
  }
);