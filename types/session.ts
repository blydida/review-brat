export type SessionMode = 'ideation' | 'flow-review';

export type SessionStatus =
  | 'created'
  | 'uploading'
  | 'understanding'
  | 'clarifying'
  | 'generating'
  | 'analyzing'
  | 'reviewing'
  | 'complete'
  | 'error';

export type ReviewRole = 'pm' | 'design-lead' | 'developer';

export interface Upload {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  order?: number;
  isDesignSystem?: boolean;
}

export interface ClarificationTurn {
  questions: string[];
  answers: string[];
}

export interface UnderstandingCard {
  userGoals: string[];
  businessGoals: string[];
  keyMechanics: string[];
}

export interface ScreenDescription {
  screenName: string;
  purpose: string;
  components: string[];
  interactions: string[];
  notes: string;
}

export interface FlowDiagram {
  mermaidSource: string;
}

export interface ScreenClarityScore {
  screenIndex: number;
  score: number;
  rationale: string;
}

export interface WeakSpot {
  location: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FlowAnalysis {
  logicSummary: string;
  clarityScores: ScreenClarityScore[];
  weakSpots: WeakSpot[];
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  issue: string;
  suggestion: string;
  affectedArea?: string;
}

export interface RoleReview {
  role: ReviewRole;
  summary: string;
  recommendations: Recommendation[];
}

export interface AnalysisResult {
  understandingCard?: UnderstandingCard;
  clarificationTurns?: ClarificationTurn[];
  flowDiagram?: FlowDiagram;
  screenDescriptions?: ScreenDescription[];
  flowAnalysis?: FlowAnalysis;
  roleReviews?: RoleReview[];
}

export interface Session {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  uploads: Upload[];
  designSystem?: import('./design-system').DesignSystemConfig;
  analysisResult?: AnalysisResult;
  error?: string;
}
