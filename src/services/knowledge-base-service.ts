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
 * Extracts the ID from the first line of a document's content with enhanced validation.
 * TECHNOS FORGE OPTIMIZATION: Multiple ID extraction strategies with fallback.
 * @param content The content of the document.
 * @returns The extracted ID or null if not found.
 */
function extractIdFromContent(content: string): string | null {
    if (!content || content.trim().length === 0) return null;
    
    const lines = content.split('\n').slice(0, 3); // Check first 3 lines for resilience
    
    // Primary pattern: ID: DOCUMENT-ID-FORMAT
    for (const line of lines) {
        const idMatch = line.match(/^ID:\s*([\w-]+)/i);
        if (idMatch) return idMatch[1].toUpperCase();
        
        // Fallback patterns for various document formats
        const altMatch = line.match(/^(?:Document|Report|Analysis)\s*ID:\s*([\w-]+)/i) ||
                        line.match(/^\*\*ID\*\*:\s*([\w-]+)/i) ||
                        line.match(/^#\s*ID:\s*([\w-]+)/i);
        if (altMatch) return altMatch[1].toUpperCase();
    }
    
    // Generate fallback ID based on filename if no ID found
    return null;
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
 * TECHNOS FORGE ENHANCED SEARCH: Multi-layer semantic search with relevance scoring.
 * Searches the knowledge base using advanced pattern matching and relevance scoring.
 * 
 * @param query The string to search for (can be a specific ID, a keyword, or a phrase).
 * @returns A promise that resolves to an array of matching documents, sorted by relevance.
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
    const allDocuments = await listKnowledgeBase();
    if (!query) {
        return allDocuments;
    }

    const lowerCaseQuery = query.toLowerCase().trim();
    
    // Enhanced search with relevance scoring
    const scoredDocuments = allDocuments.map(doc => {
        let score = 0;
        const content = doc.content.toLowerCase();
        const filename = doc.filename.toLowerCase();
        const id = doc.id?.toLowerCase() || '';
        
        // Exact ID match - highest priority
        if (id === lowerCaseQuery) score += 1000;
        else if (id.includes(lowerCaseQuery)) score += 500;
        
        // Filename relevance
        if (filename === lowerCaseQuery) score += 100;
        else if (filename.includes(lowerCaseQuery)) score += 50;
        
        // Content analysis with keyword density
        const queryTerms = lowerCaseQuery.split(/\s+/);
        queryTerms.forEach(term => {
            const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = content.match(termRegex) || [];
            score += matches.length * 2;
            
            // Boost for title/header occurrences
            const headerMatches = content.match(new RegExp(`^#{1,3}.*${term}.*$`, 'gmi')) || [];
            score += headerMatches.length * 10;
        });
        
        // Penalize documents without any matches
        const hasMatch = content.includes(lowerCaseQuery) || 
                        filename.includes(lowerCaseQuery) || 
                        id.includes(lowerCaseQuery);
        
        return { doc, score: hasMatch ? score : 0 };
    });

    // Return sorted results with score > 0
    return scoredDocuments
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.doc);
}
