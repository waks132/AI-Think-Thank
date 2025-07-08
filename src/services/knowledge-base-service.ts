'use server';

import fs from 'fs/promises';
import path from 'path';

const knowledgeBasePath = path.join(process.cwd(), 'src', 'lib', 'knowledge-base');

export interface KnowledgeDocument {
    filename: string;
    content: string;
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
                return { filename, content };
            })
        );
        return documents;
    } catch (error) {
        console.error("Error reading knowledge base directory:", error);
        // If the directory doesn't exist, return an empty array.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Searches the knowledge base for documents containing the query string.
 * @param query The string to search for.
 * @returns A promise that resolves to an array of matching documents.
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
    const allDocuments = await listKnowledgeBase();
    if (!query) {
        return allDocuments;
    }

    const lowerCaseQuery = query.toLowerCase();

    const matchingDocuments = allDocuments.filter(doc => 
        doc.content.toLowerCase().includes(lowerCaseQuery)
    );

    return matchingDocuments;
}
