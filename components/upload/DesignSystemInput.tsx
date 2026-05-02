'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Loader2, Layers } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DesignSystemInputProps {
  sessionId: string;
  onSaved: (componentCount: number) => void;
}

type DSMode = 'heroui' | 'figma-tokens' | 'text';

export function DesignSystemInput({ sessionId, onSaved }: DesignSystemInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<DSMode>('heroui');
  const [textValue, setTextValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [componentCount, setComponentCount] = useState<number | null>(null);

  async function handleSave() {
    setStatus('saving');
    try {
      if (mode === 'heroui') {
        const res = await fetch('/api/design-system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, type: 'preset', content: 'heroui' }),
        });
        if (!res.ok) throw new Error();
        setComponentCount(47);
        setStatus('saved');
        onSaved(47);
        return;
      }

      if (!textValue.trim()) { setStatus('idle'); return; }

      const res = await fetch('/api/design-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type: mode, content: textValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const count = data.componentNames?.length ?? null;
      setComponentCount(count);
      setStatus('saved');
      onSaved(count ?? 0);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Design System</span>
          {status === 'saved' && (
            <Badge variant="outline" className="text-xs gap-1 text-emerald-500 border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              {componentCount ? `${componentCount} components` : 'Saved'}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-full">
            {(['heroui', 'figma-tokens', 'text'] as DSMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStatus('idle'); }}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'heroui' ? 'HeroUI' : m === 'figma-tokens' ? 'Figma Tokens' : 'Text'}
              </button>
            ))}
          </div>

          {mode === 'heroui' && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">HeroUI preset selected</p>
              <p>All 47 HeroUI components are pre-loaded: Button, Card, Modal, Table, Tabs, Navbar, and more. AI will reference these components in all recommendations.</p>
            </div>
          )}

          {mode === 'figma-tokens' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Paste your Figma Tokens JSON (export via Tokens Studio or Variables to JSON plugin).
              </p>
              <Textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={'{\n  "colors": {\n    "primary": { "value": "#18181B", "type": "color" }\n  },\n  "components": {\n    "Button": {}\n  }\n}'}
                className="font-mono text-xs min-h-[140px]"
              />
            </div>
          )}

          {mode === 'text' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Describe your component library in plain text.
              </p>
              <Textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="We use HeroUI as our base. Key components: Button (primary/secondary variants), Card, Modal, Table, Tabs, Navbar, Input, Select, Badge, Chip, Avatar..."
                className="text-sm min-h-[100px]"
              />
            </div>
          )}

          {status === 'error' && (
            <p className="text-xs text-destructive">Failed to save. Check your JSON format and try again.</p>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={status === 'saving' || status === 'saved'}
            className="w-full"
          >
            {status === 'saving' && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
            {status === 'saved' ? 'Saved' : mode === 'heroui' ? 'Use HeroUI' : 'Save Design System'}
          </Button>
        </div>
      )}
    </div>
  );
}
