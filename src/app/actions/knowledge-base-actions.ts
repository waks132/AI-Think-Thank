'use server';

import { listKnowledgeBase, type KnowledgeDocument } from "@/services/knowledge-base-service";

export async function getKnowledgeBaseDocuments(): Promise<KnowledgeDocument[]> {
    return await listKnowledgeBase();
}
