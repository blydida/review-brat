'use client';

import { motion } from 'framer-motion';
import { Monitor, Layers, MousePointer, StickyNote } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { ScreenDescription } from '@/types/session';

interface Props {
  screens: ScreenDescription[];
}

export function ScreenDescriptions({ screens }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Screen Specifications ({screens.length})
      </h3>

      <Accordion multiple className="space-y-2">
        {screens.map((screen, i) => (
          <AccordionItem
            key={i}
            value={`screen-${i}`}
            className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/20"
          >
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {screen.screenName}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">{screen.purpose}</p>

              {screen.components.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Layers className="w-3 h-3" /> Components
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {screen.components.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {screen.interactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MousePointer className="w-3 h-3" /> Interactions
                  </div>
                  <ul className="space-y-1">
                    {screen.interactions.map((int, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-foreground/30 shrink-0">·</span>{int}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {screen.notes && (
                <div className="flex items-start gap-1.5 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                  {screen.notes}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
