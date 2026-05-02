import type { FlowDiagram, ScreenDescription } from '@/types/session';

export function parseGenerationResponse(text: string): {
  flowDiagram: FlowDiagram;
  screenDescriptions: ScreenDescription[];
} {
  // Extract mermaid block if present (optional now)
  const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)\s*```/);
  const mermaidSource = mermaidMatch ? mermaidMatch[1].trim() : '';

  // Extract JSON block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  let screenDescriptions: ScreenDescription[] = [];

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        screenDescriptions = parsed.map((s) => ({
          screenName: s.screenName ?? 'Без названия',
          purpose: s.purpose ?? '',
          htmlContent: s.htmlContent ?? '',
          components: s.components ?? [],
          interactions: s.interactions ?? [],
          notes: s.notes ?? '',
        }));
      }
    } catch {
      // malformed JSON
    }
  }

  return { flowDiagram: { mermaidSource }, screenDescriptions };
}
