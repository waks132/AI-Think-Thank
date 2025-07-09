'use server';

import fs from 'fs/promises';
import path from 'path';

const knowledgeBasePath = path.join(process.cwd(), 'src', 'lib', 'knowledge-base');

export interface KnowledgeDocument {
    id: string | null;
    filename: string;
    content: string;
}

/**
 * Extracts the ID from the first line of a document's content.
 * @param content The content of the document.
 * @returns The extracted ID or null if not found.
 */
function extractIdFromContent(content: string): string | null {
    const firstLine = content.split('\n')[0];
    const idMatch = firstLine.match(/^ID:\s*([\w-]+)/);
    return idMatch ? idMatch[1] : null;
}

/**
 * Lists all documents in the knowledge base.
 */
export async function listKnowledgeBase(): Promise<KnowledgeDocument[]> {
    try {
        const filenames = await fs.readdir(knowledgeBasePath);
        const documents = await Promise.all(
            filenames.map(async (filename) => {
                const filePath = path.join(knowledgeBasePath, filename);
                const content = await fs.readFile(filePath, 'utf-8');
                const id = extractIdFromContent(content);
                return { id, filename, content };
            })
        );
        return documents;
    } catch (error) {
        console.error("Error reading knowledge base directory:", error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Searches the knowledge base for documents. This function has two modes:
 * 1.  **Strict ID Search:** If the query looks like a document ID (e.g., "FRAMEWORK-IA-CONTROL-01"),
 *     it will perform an exact, case-insensitive match on the document's ID. It will return
 *     only the matching document(s) or an empty array if not found. There is NO fallback to
 *     a text search in this mode to ensure precision.
 * 2.  **Full-Text Search:** If the query does not look like an ID (e.g., it contains spaces
 *     or is a general keyword), it will perform a case-insensitive search across the
 *     entire content of all documents.
 * 
 * @param query The string to search for (can be a specific ID or a keyword/phrase).
 * @returns A promise that resolves to an array of matching documents.
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
    const allDocuments = await listKnowledgeBase();
    if (!query) {
        return allDocuments;
    }

    const lowerCaseQuery = query.toLowerCase().trim();

    // Heuristic to determine if a query is likely a specific document ID.
    // IDs are typically single 'words' (no spaces) and longer than a common keyword.
    // e.g., "FRAMEWORK-IA-CONTROL-01", "report-test-nexus-prime-05"
    const isIdLike = !lowerCaseQuery.includes(' ') && lowerCaseQuery.length > 5;

    // If the query looks like an ID, perform a strict, infallible ID-only search.
    if (isIdLike) {
        const results = allDocuments.filter(doc => doc.id && doc.id.toLowerCase() === lowerCaseQuery);
        // Return results directly. If empty, it means the ID was not found. No fallback.
        // This ensures precision for agents requesting specific documents.
        return results;
    }

    // If the query is not ID-like (e.g., it's a keyword phrase like "ia control"),
    // perform a broad, full-text search across all document content.
    const matchingDocuments = allDocuments.filter(doc => 
        doc.content.toLowerCase().includes(lowerCaseQuery)
    );

    return matchingDocuments;
}
