"use client";

import { BrainCircuit } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { t } from '@/lib/i18n';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function Header() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              {t.header.title[language]}
            </span>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('fr')}
            className={cn(language === 'fr' && 'bg-accent text-accent-foreground')}
          >
            {t.header.lang_fr[language]}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('en')}
            className={cn(language === 'en' && 'bg-accent text-accent-foreground')}
          >
            {t.header.lang_en[language]}
          </Button>
        </div>
      </div>
    </header>
  );
}

    