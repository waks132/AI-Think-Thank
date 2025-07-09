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
 * Searches the knowledge base for documents.
 * The search is case-insensitive and checks the filename, the extracted ID, and the full content of the document.
 * 
 * @param query The string to search for (can be a specific ID, a keyword, or a phrase).
 * @returns A promise that resolves to an array of matching documents.
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
    const allDocuments = await listKnowledgeBase();
    if (!query) {
        return allDocuments;
    }

    const lowerCaseQuery = query.toLowerCase().trim();

    const matchingDocuments = allDocuments.filter(doc => {
        const inContent = doc.content.toLowerCase().includes(lowerCaseQuery);
        const inFilename = doc.filename.toLowerCase().includes(lowerCaseQuery);
        const inId = doc.id ? doc.id.toLowerCase().includes(lowerCaseQuery) : false;
        
        return inContent || inFilename || inId;
    });

    return matchingDocuments;
}
