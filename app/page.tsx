'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ScanSearch, ArrowRight, Sparkles } from 'lucide-react';
import type { SessionMode } from '@/types/session';

const MODES: Array<{
  mode: SessionMode;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  colorClass: string;
}> = [
  {
    mode: 'ideation',
    icon: <Lightbulb className="w-7 h-7" />,
    title: 'Идея → Экраны',
    subtitle: 'Превращает сырую идею в готовые экраны с дизайном',
    features: [
      'Загрузи PRD, заметки или изображения',
      'AI извлекает цели, механики, суть задачи',
      'Уточняющие вопросы при необходимости',
      'Генерирует детализированные экраны по компонентам HeroUI',
    ],
    colorClass: 'from-violet-500/10 to-purple-500/5 border-violet-500/20 hover:border-violet-500/50',
  },
  {
    mode: 'flow-review',
    icon: <ScanSearch className="w-7 h-7" />,
    title: 'Ревью флоу',
    subtitle: 'Анализирует существующий дизайн как целостный сценарий',
    features: [
      'Загрузи скриншоты по порядку',
      'AI анализирует весь флоу — не отдельные экраны',
      'Оценка ясности каждого экрана + слабые места',
      'Выявляет точки оттока и логические пробелы',
    ],
    colorClass: 'from-cyan-500/10 to-sky-500/5 border-cyan-500/20 hover:border-cyan-500/50',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<SessionMode | null>(null);

  async function handleSelectMode(mode: SessionMode) {
    setLoading(mode);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const { sessionId } = await res.json();
      router.push(`/session/${sessionId}`);
    } catch {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI Product Copilot
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            От хаоса к ясности{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              за минуты
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Симуляция продуктовой команды. Превращает сырые идеи или готовые дизайны
            в структурированные, проверенные продуктовые решения.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODES.map(({ mode, icon, title, subtitle, features, colorClass }, i) => (
            <motion.button
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 * (i + 1) }}
              onClick={() => handleSelectMode(mode)}
              disabled={loading !== null}
              className={`
                relative text-left p-6 rounded-2xl border bg-gradient-to-br
                transition-all duration-200 group cursor-pointer
                disabled:opacity-60 disabled:cursor-not-allowed
                ${colorClass}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-background/60 border border-border/50">
                  {icon}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 mt-1" />
              </div>

              <h2 className="text-lg font-semibold mb-1">
                {loading === mode ? 'Создаю сессию...' : title}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">{subtitle}</p>

              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-foreground/40 mt-0.5 shrink-0">—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Оба режима завершаются ревью от PM, Design Lead и Разработчика.
        </p>
      </motion.div>
    </main>
  );
}
