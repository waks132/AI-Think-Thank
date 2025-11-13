'use server';
/**
 * @fileOverview A Genkit tool for querying the internal knowledge base.
 */

import { ai } from '@/ai/genkit';
import { searchKnowledgeBase } from '@/services/knowledge-base-service';
import { z } from 'genkit';

const KnowledgeDocumentSchema = z.object({
  id: z.string().nullable().describe('The unique identifier of the document (e.g., "REPORT-TEST-NEXUS-PRIME-05").'),
  filename: z.string().describe('The name of the file in the knowledge base.'),
  content: z.string().describe('The full content of the document.'),
});

export const queryKnowledgeBaseTool = ai.defineTool(
  {
    name: 'queryKnowledgeBaseTool',
    description: "Searches the internal knowledge base of corrected analyses, best practices, and cognitive patterns to find relevant information. Use this to fill knowledge gaps, learn from past mistakes, and improve the quality of your reasoning. You can search by keywords or by a specific document ID.",
    inputSchema: z.object({
      query: z.string().describe('A keyword, phrase, or a specific document ID (e.g., "REPORT-TEST-NEXUS-PRIME-05") to search for in the knowledge base. Be specific to get the best results.'),
    }),
    outputSchema: z.array(KnowledgeDocumentSchema).describe("A list of documents from the knowledge base that match the query."),
  },
  async (input) => {
    console.log(`[Knowledge Base Tool] Querying for: "${input.query}"`);
    const results = await searchKnowledgeBase(input.query);
    console.log(`[Knowledge Base Tool] Found ${results.length} results.`);
    return results;
  }
);
