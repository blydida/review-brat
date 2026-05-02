import type { FlowDiagram, ScreenDescription } from '@/types/session';

export function parseGenerationResponse(text: string): {
  flowDiagram: FlowDiagram;
  screenDescriptions: ScreenDescription[];
} {
  // Extract Mermaid block
  const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)\s*```/);
  const mermaidSource = mermaidMatch ? mermaidMatch[1].trim() : 'flowchart LR\n  A[Start] --> B[End]';

  // Extract JSON block for screen descriptions
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  let screenDescriptions: ScreenDescription[] = [];

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        screenDescriptions = parsed.map((s) => ({
          screenName: s.screenName ?? 'Untitled Screen',
          purpose: s.purpose ?? '',
          components: s.components ?? [],
          interactions: s.interactions ?? [],
          notes: s.notes ?? '',
        }));
      }
    } catch {
      // malformed JSON — return empty screens
    }
  }

  return { flowDiagram: { mermaidSource }, screenDescriptions };
}
