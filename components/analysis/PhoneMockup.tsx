'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScreenDescription } from '@/types/session';

const TAILWIND_HTML_WRAPPER = (html: string) => `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=390, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #060607; color: #fcfcfc; width: 390px; min-height: 844px; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 0; }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            surface: '#18181b',
            'surface-2': '#232325',
            accent: '#0485f7',
            muted: '#a1a1aa',
            border: '#28282c',
            success: '#17c964',
            warning: '#f7b750',
            danger: '#db3b3e',
          },
          fontFamily: { inter: ['Inter', 'sans-serif'] }
        }
      }
    }
  </script>
</head>
<body>
${html}
</body>
</html>`;

interface Props {
  screens: ScreenDescription[];
}

export function PhoneMockup({ screens }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (screens.length === 0) return null;

  const current = screens[activeIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Экраны ({screens.length})
        </h3>
        {/* Screen tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
          {screens.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                i === activeIndex
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Phone frame */}
        <div className="shrink-0 relative">
          {/* Device shell */}
          <div className="relative w-[280px] rounded-[3rem] border-4 border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden">
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-white/80">9:41</span>
              <div className="w-16 h-4 bg-zinc-900 rounded-full" />
              <div className="flex gap-1 items-center">
                <div className="w-3 h-2 border border-white/60 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-white/60 w-2/3" />
                </div>
              </div>
            </div>

            {/* Screen content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
                style={{ height: '600px' }}
              >
                {current.htmlContent ? (
                  <iframe
                    srcDoc={TAILWIND_HTML_WRAPPER(current.htmlContent)}
                    className="w-full h-full border-0"
                    style={{ transform: 'scale(0.717)', transformOrigin: 'top left', width: '390px', height: '836px', marginTop: '12px' }}
                    sandbox="allow-same-origin"
                    title={current.screenName}
                  />
                ) : (
                  <div className="w-full h-full bg-[#060607] flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
                    {current.screenName}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Home indicator */}
            <div className="flex justify-center pb-2 pt-1 bg-[#060607]">
              <div className="w-24 h-1 bg-white/30 rounded-full" />
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="p-1.5 rounded-full bg-muted/30 hover:bg-muted/60 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setActiveIndex(Math.min(screens.length - 1, activeIndex + 1))}
              disabled={activeIndex === screens.length - 1}
              className="p-1.5 rounded-full bg-muted/30 hover:bg-muted/60 disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Screen details */}
        <div className="flex-1 space-y-4 pt-2">
          <div>
            <h4 className="font-semibold text-base mb-1">{current.screenName}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.purpose}</p>
          </div>

          {current.components.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Компоненты</p>
              <div className="flex flex-wrap gap-1">
                {current.components.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md border border-border text-xs text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {current.interactions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Взаимодействия</p>
              <ul className="space-y-1">
                {current.interactions.map((int, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-foreground/30 shrink-0">·</span>{int}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {current.notes && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">{current.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
