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
 * Searches the knowledge base for documents containing the query string or matching an ID.
 * @param query The string to search for (can be a keyword or an ID like "ID: MY-DOC-01").
 * @returns A promise that resolves to an array of matching documents.
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
    const allDocuments = await listKnowledgeBase();
    if (!query) {
        return allDocuments;
    }

    const lowerCaseQuery = query.toLowerCase();

    // Check if query is an ID search (e.g., "ID: REPORT-101" or just "REPORT-101")
    const idSearchMatch = lowerCaseQuery.match(/^(id:\s*)?([\w-]+)$/);
    if (idSearchMatch) {
        const searchId = idSearchMatch[2];
        const results = allDocuments.filter(doc => doc.id && doc.id.toLowerCase() === searchId);
        if (results.length > 0) {
            return results;
        }
    }

    // If no ID match or query is not just an ID, search content
    const matchingDocuments = allDocuments.filter(doc => 
        doc.content.toLowerCase().includes(lowerCaseQuery)
    );

    return matchingDocuments;
}
