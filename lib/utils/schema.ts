import { z } from 'zod';

export const createSessionSchema = z.object({
  mode: z.enum(['ideation', 'flow-review']),
});

export const clarifySchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.string().min(1)).min(1).max(5),
});

export const analyzeSchema = z.object({
  sessionId: z.string().min(1),
  goal: z.string().optional(),
});

export const designSystemSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['figma-tokens', 'text', 'preset']),
  content: z.string().min(1),
});
