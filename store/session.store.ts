import { create } from 'zustand';
import type { ReviewRole } from '@/types/session';

type UploadProgress = Record<string, number>;

export type AnalysisPhase =
  | 'idle'
  | 'understanding'
  | 'clarifying'
  | 'generating'
  | 'analyzing'
  | 'reviewing'
  | 'complete'
  | 'error';

interface SessionUIState {
  // Upload
  uploadProgress: UploadProgress;
  isUploading: boolean;

  // Analysis
  activePhase: AnalysisPhase;
  generationDelta: string;
  errorMessage: string | null;

  // Clarification
  pendingQuestions: string[];
  clarificationAnswers: string[];
  textContent: string;
  flowGoal: string;

  // Review panel
  expandedRole: ReviewRole | null;

  // Design system input
  dsInputExpanded: boolean;

  // Actions
  setUploadProgress: (id: string, progress: number) => void;
  setIsUploading: (v: boolean) => void;
  setActivePhase: (phase: AnalysisPhase) => void;
  appendGenerationDelta: (delta: string) => void;
  resetGenerationDelta: () => void;
  setPendingQuestions: (questions: string[]) => void;
  setClarificationAnswer: (index: number, value: string) => void;
  setTextContent: (v: string) => void;
  setFlowGoal: (v: string) => void;
  setExpandedRole: (role: ReviewRole | null) => void;
  setDsInputExpanded: (v: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  uploadProgress: {},
  isUploading: false,
  activePhase: 'idle' as AnalysisPhase,
  generationDelta: '',
  errorMessage: null,
  pendingQuestions: [],
  clarificationAnswers: [],
  textContent: '',
  flowGoal: '',
  expandedRole: null as ReviewRole | null,
  dsInputExpanded: false,
};

export const useSessionStore = create<SessionUIState>((set) => ({
  ...initialState,

  setUploadProgress: (id, progress) =>
    set((s) => ({ uploadProgress: { ...s.uploadProgress, [id]: progress } })),

  setIsUploading: (v) => set({ isUploading: v }),

  setActivePhase: (phase) => set({ activePhase: phase }),

  appendGenerationDelta: (delta) =>
    set((s) => ({ generationDelta: s.generationDelta + delta })),

  resetGenerationDelta: () => set({ generationDelta: '' }),

  setPendingQuestions: (questions) =>
    set({ pendingQuestions: questions, clarificationAnswers: new Array(questions.length).fill('') }),

  setClarificationAnswer: (index, value) =>
    set((s) => {
      const answers = [...s.clarificationAnswers];
      answers[index] = value;
      return { clarificationAnswers: answers };
    }),

  setTextContent: (v) => set({ textContent: v }),
  setFlowGoal: (v) => set({ flowGoal: v }),
  setExpandedRole: (role) => set({ expandedRole: role }),
  setDsInputExpanded: (v) => set({ dsInputExpanded: v }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  reset: () => set({ ...initialState }),
}));
