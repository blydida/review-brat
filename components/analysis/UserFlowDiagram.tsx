'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FlowDiagram } from '@/types/session';

interface Props {
  diagram: FlowDiagram;
}

export function UserFlowDiagram({ diagram }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !diagram.mermaidSource) return;

    let cancelled = false;
    import('mermaid').then((m) => {
      if (cancelled) return;
      m.default.initialize({ startOnLoad: false, theme: 'dark', darkMode: true });
      m.default.render('flow-diagram', diagram.mermaidSource).then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch(() => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs text-muted-foreground p-4 overflow-auto">${diagram.mermaidSource}</pre>`;
        }
      });
    });

    return () => { cancelled = true; };
  }, [diagram.mermaidSource]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        User Flow
      </h3>
      <div
        ref={containerRef}
        className="overflow-auto min-h-[120px] flex items-center justify-center text-sm text-muted-foreground"
      >
        Loading diagram...
      </div>
    </motion.div>
  );
}
