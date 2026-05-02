import type { Upload } from './session';

export interface FigmaTokensDS {
  type: 'figma-tokens';
  componentNames: string[];
  colorTokens: Record<string, string>;
  spacingTokens: Record<string, string>;
  rawJson: string;
}

export interface ScreenshotsDS {
  type: 'screenshots';
  uploads: Upload[];
  componentAnnotations?: string;
}

export interface TextDS {
  type: 'text';
  description: string;
}

export interface PresetDS {
  type: 'preset';
  name: 'heroui';
}

export type DesignSystemConfig = FigmaTokensDS | ScreenshotsDS | TextDS | PresetDS;

export type DesignSystemInputType = DesignSystemConfig['type'];
