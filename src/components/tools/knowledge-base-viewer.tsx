"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getKnowledgeBaseDocuments } from "@/app/actions/knowledge-base-actions";
import type { KnowledgeDocument } from "@/services/knowledge-base-service";
import { Book, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { t } from "@/lib/i18n";

export default function KnowledgeBaseViewer() {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();

    useEffect(() => {
        async function fetchDocuments() {
            try {
                setIsLoading(true);
                const docs = await getKnowledgeBaseDocuments();
                // Sort documents by filename for consistent ordering
                const sortedDocs = docs.sort((a, b) => a.filename.localeCompare(b.filename));
                setDocuments(sortedDocs);
            } catch (error) {
                console.error("Failed to fetch knowledge base documents:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDocuments();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{t.knowledge.title[language]}</CardTitle>
                <CardDescription>{t.knowledge.description[language]}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : documents.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {documents.map((doc) => (
                            <AccordionItem value={doc.filename} key={doc.filename}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 text-left">
                                        <Book className="h-4 w-4 mt-1 self-start flex-shrink-0" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{doc.filename}</span>
                                            {doc.id && <span className="text-xs text-muted-foreground font-mono mt-1">ID: {doc.id}</span>}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-md max-h-[400px] overflow-y-auto">
                                        {doc.content}
                                    </pre>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>{t.knowledge.no_documents[language]}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
