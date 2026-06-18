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

const KnowledgeQueryInput = z.object({
  query: z.string().describe('A keyword, phrase, or a specific document ID (e.g., "REPORT-TEST-NEXUS-PRIME-05") to search for in the knowledge base. Be specific to get the best results.'),
});

async function knowledgeBaseHandler(input: { query: string }) {
  console.log(`[Knowledge Base Tool] Querying for: "${input.query}"`);
  const results = await searchKnowledgeBase(input.query);

  // BORNAGE (perf endpoints gratuits) : sans limite, une requête large peut
  // renvoyer ~120k tokens et faire « étouffer » le modèle (lenteur/timeouts).
  // On garde les plus pertinents (searchKnowledgeBase trie par pertinence) et
  // on tronque le contenu de chaque document.
  const MAX_DOCS = 6;
  const MAX_CHARS = 1500;
  const limited = results.slice(0, MAX_DOCS).map((d) => ({
    ...d,
    content:
      d.content.length > MAX_CHARS
        ? d.content.slice(0, MAX_CHARS) + '\n…[contenu tronqué]'
        : d.content,
  }));
  console.log(
    `[Knowledge Base Tool] Found ${results.length} results -> ${limited.length} renvoyés (tronqués).`
  );
  return limited;
}

export const queryKnowledgeBaseTool = ai.defineTool(
  {
    name: 'queryKnowledgeBaseTool',
    description: "Searches the internal knowledge base of corrected analyses, best practices, and cognitive patterns to find relevant information. Use this to fill knowledge gaps, learn from past mistakes, and improve the quality of your reasoning. You can search by keywords or by a specific document ID.",
    inputSchema: KnowledgeQueryInput,
    outputSchema: z.array(KnowledgeDocumentSchema).describe("A list of documents from the knowledge base that match the query."),
  },
  knowledgeBaseHandler
);

// ALIAS DE ROBUSTESSE : certains modèles (ex. Kimi) fusionnent les noms
// "queryKnowledgeBaseTool" et "queryMissionArchiveTool" en inventant
// "queryKnowledgeArchiveTool". On enregistre cet alias pour que l'appel
// fonctionne quand même (il interroge la base de connaissances).
export const queryKnowledgeArchiveTool = ai.defineTool(
  {
    name: 'queryKnowledgeArchiveTool',
    description: "Alias of queryKnowledgeBaseTool. Searches the internal knowledge base. Prefer queryKnowledgeBaseTool, but this works identically.",
    inputSchema: KnowledgeQueryInput,
    outputSchema: z.array(KnowledgeDocumentSchema).describe("A list of documents from the knowledge base that match the query."),
  },
  knowledgeBaseHandler
);
